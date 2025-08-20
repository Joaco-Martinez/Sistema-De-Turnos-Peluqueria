import Dexie, { Table } from 'dexie';

export interface Client {
  id: string;
  name: string;
  phone?: string;
}

export interface Service {
  id: string;
  name: string;   // ej: "Corte", "Corte + Barba"
  price: number;  // ej: 8000
}

export interface Appointment {
  id: string;
  clientId?: string;
  serviceId: string;      // 🔥 referencia a Service
  title?: string;          // opcional, si querés mostrarlo plano
  startDateTime: string;   // ISO
  durationMin: number;     // 30|45|60|custom
  isRecurring: boolean;
  rrule?: {
    freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    interval: number;
    byweekday?: number[];
    until?: string;
    count?: number;
  };
  timezone?: string;
  notes?: string;
  status?: 'pending' | 'done' | 'cancelled';
}

export interface Exception {
  id: string;
  appointmentId: string;
  originalDateTime: string;
  type: 'skip' | 'move';
  newStartDateTime?: string;
  newDurationMin?: number;
}

export class BarberDB extends Dexie {
  clients!: Table<Client, string>;
  services!: Table<Service, string>;      // 🔥 nueva tabla
  appointments!: Table<Appointment, string>;
  exceptions!: Table<Exception, string>;

  constructor() {
    super('barber_offline');
    this.version(3).stores({
      clients: 'id, name, phone',
      services: 'id, name, price',        // 🔥 catálogo
      appointments: 'id, startDateTime, isRecurring, status, serviceId',
      exceptions: 'id, appointmentId, originalDateTime',
    });
  }
}

export const db = new BarberDB();
