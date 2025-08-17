export type Client = {
  id: string; name: string; phone: string; notes?: string | null;
  createdAt: string; updatedAt: string;
};

export type Booking = {
  id: string; clientId: string; startsAt: string; durationMinutes: number;
  serviceName?: string | null; status: "SCHEDULED" | "CANCELED" | "DONE";
  client?: Client;
  createdAt: string; updatedAt: string;
};

export type CreateBookingInline = {
  client: { name: string; phone: string; notes?: string };
  startsAt: string;                // ISO
  durationMinutes: number;
  serviceName?: string;
};

export type CreateRecurring = {
  client?: { name: string; phone: string; notes?: string };
  clientId?: string;
  startDate: string; // YYYY-MM-DD
  time: string;      // HH:mm
  intervalType: "weekly" | "biweekly" | "monthly";
  count?: number;
  untilDate?: string;
  durationMinutes: number;
  serviceName?: string;
};
