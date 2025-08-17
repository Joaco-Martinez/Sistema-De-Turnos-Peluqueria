import { prisma } from "../../prisma";
import type { CreateBookingDTO, UpdateBookingDTO, CreateRecurringDTO, RecurringResult } from "./bookings.types";
import { endOfBooking, intervalsOverlap } from "../../shared/time";
import type { BookingStatus } from "@prisma/client";
import { normalizePhoneE164, isE164 } from "../../shared/phone";

// --- helpers de solapamiento ---
async function existsOverlap(startsAt: Date, endsAt: Date, excludeId?: string) {
  const neighbors = await prisma.booking.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      status: "SCHEDULED" as BookingStatus,
      startsAt: { lt: endsAt },
    },
    orderBy: { startsAt: "asc" },
    take: 20,
  });

  return neighbors.some((b) => {
    const bEnd = endOfBooking(b.startsAt, b.durationMinutes);
    return intervalsOverlap(startsAt, endsAt, b.startsAt, bEnd);
  });
}

// --- cliente por id o inline ---
async function ensureClientId(input: CreateBookingDTO | CreateRecurringDTO): Promise<string> {
  if ("clientId" in input && typeof input.clientId === "string" && input.clientId) {
    return input.clientId;
  }
  if ("client" in input && input.client) {
    const name = String(input.client.name ?? "").trim();
    const phoneRaw = String(input.client.phone ?? "").trim();
    if (!name) throw new Error("Nombre de cliente requerido");
    if (!phoneRaw) throw new Error("Teléfono de cliente requerido");

    const phone = normalizePhoneE164(phoneRaw);
    if (!isE164(phone)) throw new Error("Teléfono inválido (E.164, ej: +54911...)");

    const upserted = await prisma.client.upsert({
      where: { phone },
      create: { name, phone, notes: input.client.notes },
      update: { name, notes: input.client.notes },
      select: { id: true },
    });
    return upserted.id;
  }
  throw new Error("Debes enviar clientId o client { name, phone }");
}

// --- util de fecha local (AR) ---
function dateAtLocalTime(dateYYYYMMDD: string, timeHHmm: string) {
  const [y, m, d] = dateYYYYMMDD.split("-").map(Number);
  const [hh, mm] = timeHHmm.split(":").map(Number);
  return new Date(y, (m - 1), d, hh, mm, 0, 0); // TZ local del server
}

// ======== HÁBILES ========
function isBusinessDay(d: Date) {
  const dow = d.getDay(); // 0=Dom, 6=Sab
  return dow !== 0 && dow !== 6;
}
function nextBusinessDay(d: Date) {
  const x = new Date(d);
  while (!isBusinessDay(x)) x.setDate(x.getDate() + 1);
  return x;
}
function ensureBusinessDay(d: Date) {
  return isBusinessDay(d) ? d : nextBusinessDay(d);
}



// --- generadores de ocurrencias (siempre día hábil) ---
function* generateOccurrences(
  startDate: string,
  time: string,
  intervalType: "weekly" | "biweekly" | "monthly",
  opts: { count?: number; untilDate?: string }
) {
  let current = ensureBusinessDay(dateAtLocalTime(startDate, time));
  const until = opts.untilDate ? dateAtLocalTime(opts.untilDate, time) : undefined;
  let left = opts.count ?? 52; // máx por defecto 1 año

  while (left > 0) {
    if (until && current > until) break;
    yield new Date(current); // copia
    left--;

    if (intervalType === "weekly") {
      // +7 días y luego llevar a hábil
      current = ensureBusinessDay(new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else if (intervalType === "biweekly") {
      // +14 días y luego llevar a hábil
      current = ensureBusinessDay(new Date(current.getTime() + 14 * 24 * 60 * 60 * 1000));
    } else {
      // monthly: sumar 1 mes preservando H:M y luego llevar a hábil
      const y = current.getFullYear();
      const m = current.getMonth();
      const d = current.getDate();
      const hh = current.getHours();
      const mm = current.getMinutes();
      const candidate = new Date(y, m + 1, d, hh, mm, 0, 0);
      current = ensureBusinessDay(candidate);
    }
  }
}



export const bookingsService = {
  async list(from?: Date, to?: Date) {
    return prisma.booking.findMany({
      where: { startsAt: from && to ? { gte: from, lte: to } : undefined },
      include: { client: true },
      orderBy: { startsAt: "asc" },
    });
  },

  async getById(id: string) {
    return prisma.booking.findUnique({ where: { id }, include: { client: true } });
  },

  // ✅ creación en una sola llamada (con clientId o con datos del cliente)
  async create(data: CreateBookingDTO) {
    const startsAt = new Date(data.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new Error("startsAt inválido (ISO requerido)");
    if (typeof data.durationMinutes !== "number" || data.durationMinutes <= 0) {
      throw new Error("durationMinutes inválido");
    }

    const endsAt = endOfBooking(startsAt, data.durationMinutes);
    if (await existsOverlap(startsAt, endsAt)) {
      throw new Error("El turno se superpone con otro ya agendado.");
    }

    const clientId = await ensureClientId(data);

    return prisma.booking.create({
      data: {
        clientId,
        startsAt,
        durationMinutes: data.durationMinutes,
        serviceName: data.serviceName,
        status: "SCHEDULED" as BookingStatus,
      },
      include: { client: true },
    });
  },

 async cancelOneInSeries(seriesId: string, date: string, time: string) {
    if (!seriesId) throw new Error("seriesId requerido");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date inválida (YYYY-MM-DD)");
    if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("time inválida (HH:mm)");

    // armamos Date local con tus helpers
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const target = new Date(y, m - 1, d, hh, mm, 0, 0);

    // buscamos esa ocurrencia exacta (margen +/- 30min por si hubo ajustes)
    const from = new Date(target.getTime() - 30 * 60 * 1000);
    const to = new Date(target.getTime() + 30 * 60 * 1000);

    const b = await prisma.booking.findFirst({
      where: {
        seriesId,
        status: "SCHEDULED",
        startsAt: { gte: from, lte: to },
      },
      orderBy: { startsAt: "asc" },
    });

    if (!b) {
      throw new Error("No se encontró la ocurrencia a cancelar para esa fecha/hora");
    }

    const updated = await prisma.booking.update({
      where: { id: b.id },
      data: { status: "CANCELED" },
      include: { client: true },
    });

    return { canceledId: updated.id, startsAt: updated.startsAt.toISOString() };
  },

  async cancelSeries(seriesId: string, opts: { onlyFuture?: boolean } = { onlyFuture: true }) {
    if (!seriesId) throw new Error("seriesId requerido");

    const now = new Date();
    const where = {
      seriesId,
      status: "SCHEDULED" as BookingStatus,
      ...(opts.onlyFuture ? { startsAt: { gte: now } } : {}),
    };

    const result = await prisma.booking.updateMany({
      where,
      data: { status: "CANCELED" as BookingStatus },
    });

    return { seriesId, affected: result.count, onlyFuture: !!opts.onlyFuture };
  },

  async update(id: string, data: UpdateBookingDTO) {
    const current = await prisma.booking.findUnique({ where: { id } });
    if (!current) throw new Error("Turno no encontrado");

    const startsAt = data.startsAt ? new Date(data.startsAt) : current.startsAt;
    const duration = data.durationMinutes ?? current.durationMinutes;
    const endsAt = endOfBooking(startsAt, duration);

    if (await existsOverlap(startsAt, endsAt, id)) {
      throw new Error("El turno actualizado se superpone con otro.");
    }

    const newClientId = data.clientId ?? current.clientId;

    return prisma.booking.update({
      where: { id },
      data: {
        clientId: newClientId,
        startsAt,
        durationMinutes: duration,
        status: (data.status as BookingStatus | undefined) ?? current.status,
        serviceName: data.serviceName ?? current.serviceName,
      },
      include: { client: true },
    });
  },

  async cancel(id: string) {
    return prisma.booking.update({
      where: { id },
      data: { status: "CANCELED" as BookingStatus },
      include: { client: true },
    });
  },

  async complete(id: string) {
    return prisma.booking.update({
      where: { id },
      data: { status: "DONE" as BookingStatus },
      include: { client: true },
    });
  },

  // 🔹 Recurrencia: semanal / quincenal / mensual (siempre días hábiles)
  async createRecurring(payload: CreateRecurringDTO): Promise<RecurringResult> {
    const clientId = await ensureClientId(payload);

    if (!payload.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.startDate)) {
      throw new Error("startDate inválido (YYYY-MM-DD)");
    }
    if (!payload.time || !/^\d{2}:\d{2}$/.test(payload.time)) {
      throw new Error("time inválido (HH:mm)");
    }
    if (!["weekly", "biweekly", "monthly"].includes(payload.intervalType)) {
      throw new Error("intervalType debe ser 'weekly' | 'biweekly' | 'monthly'");
    }
    if (!payload.count && !payload.untilDate) {
      throw new Error("Debes enviar count o untilDate");
    }
    if (payload.durationMinutes <= 0) {
      throw new Error("durationMinutes inválido");
    }

    const seriesId = `series_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const created: Array<{ id: string; startsAt: string }> = [];
    const skipped: Array<{ startsAt: string; reason: string }> = [];

    for (const occ of generateOccurrences(
      payload.startDate,
      payload.time,
      payload.intervalType,
      { count: payload.count, untilDate: payload.untilDate }
    )) {
      const startsAt = occ; // ya viene ajustado a hábil
      const endsAt = endOfBooking(startsAt, payload.durationMinutes);

      if (await existsOverlap(startsAt, endsAt)) {
        skipped.push({ startsAt: startsAt.toISOString(), reason: "Se superpone con otro turno" });
        continue;
      }

      const b = await prisma.booking.create({
        data: {
          clientId,
          startsAt,
          durationMinutes: payload.durationMinutes,
          serviceName: payload.serviceName,
          status: "SCHEDULED" as BookingStatus,
          seriesId,
        },
        select: { id: true, startsAt: true },
      });
      created.push({ id: b.id, startsAt: b.startsAt.toISOString() });
    }

    return { seriesId, created: created.length, skipped, bookings: created };
  },
};
