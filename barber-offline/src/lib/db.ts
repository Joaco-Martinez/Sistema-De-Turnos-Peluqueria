import Dexie, { Table } from 'dexie';

export interface Client { id: string; name: string; phone?: string; }
export interface Appointment {
  id: string;
  clientId?: string;
  title?: string;
  startDateTime: string; // ISO
  durationMin: number;   // 30|45|60|custom
  isRecurring: boolean;
  rrule?: {
    freq: 'DAILY'|'WEEKLY'|'MONTHLY';
    interval: number;
    byweekday?: number[]; // 0=MO..6=SU (tu mapping)
    until?: string; // ISO
    count?: number;
  };
  timezone?: string;
  notes?: string;
}
export interface Exception {
  id: string;
  appointmentId: string;
  originalDateTime: string; // ISO de la ocurrencia base
  type: 'skip'|'move';
  newStartDateTime?: string;
  newDurationMin?: number;
}

export class BarberDB extends Dexie {
  clients!: Table<Client, string>;
  appointments!: Table<Appointment, string>;
  exceptions!: Table<Exception, string>;
  constructor() {
    super('barber_offline');
    this.version(1).stores({
      clients: 'id, name, phone',
      appointments: 'id, startDateTime, isRecurring',
      exceptions: 'id, appointmentId, originalDateTime'
    });
  }
}
export const db = new BarberDB();
