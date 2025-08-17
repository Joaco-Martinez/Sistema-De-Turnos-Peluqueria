import cron from "node-cron";
import { prisma } from "../../prisma";
import { addDays, startOfDay, endOfDay } from "../../shared/time";
import { normalizePhoneE164 } from "../../shared/phone";
import type { BookingStatus } from "@prisma/client";
import { TwilioWAProvider } from "./wa.provider";

export function scheduleReminderJob() {
  const hour = Number(process.env.REMINDER_HOUR ?? 10);
  const cronExpr = `0 ${hour} * * *`; // todos los días a la hora X

  console.log(`⏰ Recordatorios (Twilio): todos los días a las ${hour}:00`);

  cron.schedule(cronExpr, async () => {
    try {
      const tomorrow = addDays(new Date(), 1);
      const from = startOfDay(tomorrow);
      const to = endOfDay(tomorrow);

      const bookings = await prisma.booking.findMany({
        where: {
          status: "SCHEDULED" as BookingStatus,
          startsAt: { gte: from, lte: to },
        },
        include: { client: true },
        orderBy: { startsAt: "asc" },
      });

      if (!bookings.length) return console.log("📭 No hay recordatorios hoy.");

      const wa = new TwilioWAProvider();

      for (const b of bookings) {
        const phone = normalizePhoneE164(b.client.phone); // +54911...
        const hora = b.startsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
        const fecha = b.startsAt.toLocaleDateString("es-AR");
        const servicio = b.serviceName ? ` de ${b.serviceName}` : "";
        const body =
          `¡Hola ${b.client.name}! Te recordamos tu turno${servicio} ` +
          `para mañana ${fecha} a las ${hora}. ` +
          `Si no podés asistir, avisá por este medio. 💈✂️`;

        try {
          await wa.sendText(`whatsapp:${phone}`, body);
          console.log("✅ Recordatorio enviado a", phone, b.id);
        } catch (err) {
          console.error("❌ Error enviando a", phone, err);
        }
      }
    } catch (e) {
      console.error("❌ Job recordatorios falló:", e);
    }
  });
}
