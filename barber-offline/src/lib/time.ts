import { DateTime } from 'luxon';

export const toISO = (d: Date | string) =>
  (typeof d === 'string' ? DateTime.fromISO(d) : DateTime.fromJSDate(d)).toISO();

export const startOfWeekISO = (ref = DateTime.now()) =>
  ref.startOf('week').toISO();

export const endOfWeekISO = (ref = DateTime.now()) =>
  ref.endOf('week').toISO();

export function fmtDay(dtISO: string) {
  return DateTime.fromISO(dtISO).toFormat('EEE dd/LL');
}
export function fmtTime(dtISO: string) {
  return DateTime.fromISO(dtISO).toFormat('HH:mm');
}

export function addMinutesISO(dtISO: string, minutes: number) {
  return DateTime.fromISO(dtISO).plus({ minutes }).toISO();
}

export function sameDay(aISO: string, bISO: string) {
  const a = DateTime.fromISO(aISO), b = DateTime.fromISO(bISO);
  return a.hasSame(b, 'day');
}
