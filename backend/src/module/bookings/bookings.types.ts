// Base común
export type BookingBase = {
  startsAt: string;        // ISO
  durationMinutes: number; // 30 | 45 | 60...
  serviceName?: string;
};

// Crear turno EN 1 PASO: con clientId o con datos del cliente
export type CreateBookingDTO =
  | (BookingBase & { clientId: string })
  | (BookingBase & { client: { name: string; phone: string; notes?: string } });

export type UpdateBookingDTO = Partial<BookingBase> & {
  status?: "SCHEDULED" | "CANCELED" | "DONE";
  clientId?: string;
};

// 🔹 Recurrencia: semanal / quincenal / mensual
export type CreateRecurringDTO = {
  // cliente por id o inline
  clientId?: string;
  client?: { name: string; phone: string; notes?: string };

  // cuándo
  startDate: string; // YYYY-MM-DD (local)
  time: string;      // HH:mm (24h), local
  durationMinutes: number;
  serviceName?: string;

  // tipo de intervalo
  intervalType: "weekly" | "biweekly" | "monthly";

  // tope de repeticiones
  count?: number;        // ej: 8 ocurrencias
  untilDate?: string;    // YYYY-MM-DD (inclusive, alternativa a count)
};

export type RecurringResult = {
  seriesId: string;
  created: number;
  skipped: Array<{ startsAt: string; reason: string }>;
  bookings: Array<{ id: string; startsAt: string }>;
};
