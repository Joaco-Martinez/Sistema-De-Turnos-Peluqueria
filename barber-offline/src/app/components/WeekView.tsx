'use client';
import { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { getOccurrences } from '@/lib/schedule';
import { endOfWeekISO, fmtDay, fmtTime, startOfWeekISO } from '@/lib/time';
import AppointmentForm from './AppointmentForm';

type Occ = { id:string; start:string; end:string; title?:string; clientId?:string };
type EditTarget = { baseId: string; start: string; end: string; title?: string };

const DAY_COLS = 7;
const SLOT_MIN = 15;
const START_HOUR = 7;
const END_HOUR = 24;

function slotISO(day: DateTime, hour: number, minute: number): string {
  return day.set({ hour, minute, second: 0, millisecond: 0 }).toISO({ suppressMilliseconds: true })!;
}
function nextQuarterISO(ref = DateTime.now()): string {
  const q = Math.ceil(ref.minute / 15) * 15;
  const hour = ref.hour + Math.floor(q / 60);
  const minute = q % 60;
  return ref.set({ hour, minute, second: 0, millisecond: 0 }).toISO({ suppressMilliseconds: true })!;
}
type Props = { onChanged?: () => void };

export default function WeekView({ onChanged }: Props) {
  const [ref, setRef] = useState(DateTime.now());
  const [items, setItems] = useState<Occ[]>([]);
  const [openFormAt, setOpenFormAt] = useState<string | undefined>();
  const [editing, setEditing] = useState<EditTarget | undefined>();

  async function load() {
    const occs = await getOccurrences(startOfWeekISO(ref), endOfWeekISO(ref));
    setItems(occs.sort((a, b) => a.start.localeCompare(b.start)));
  }
  useEffect(() => { load(); }, [ref]);

  const days = useMemo(() => {
    const start = ref.startOf('week');
    return Array.from({ length: DAY_COLS }, (_, i) => start.plus({ days: i }));
  }, [ref]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <button className="px-2 py-1 border rounded" onClick={() => setRef(ref.minus({ weeks: 1 }))}>← Semana</button>
          <button className="px-2 py-1 border rounded" onClick={() => setRef(DateTime.now())}>Hoy</button>
          <button className="px-2 py-1 border rounded" onClick={() => setRef(ref.plus({ weeks: 1 }))}>Semana →</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {ref.startOf('week').toFormat('dd/LL')} – {ref.endOf('week').toFormat('dd/LL/yyyy')}
          </div>
          <button
            className="px-3 py-2 rounded bg-black text-white"
            onClick={() => setOpenFormAt(nextQuarterISO(ref))}
            title="Agregar turno"
          >
            + Agregar turno
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: `80px repeat(${DAY_COLS}, 1fr)` }}>
        {/* encabezado */}
        <div />
        {days.map((d, i) => (
          <div key={i} className="p-2 text-center font-medium border-b">
            {fmtDay(d.toISO()!)}
          </div>
        ))}

        {/* filas */}
        {Array.from({ length: (END_HOUR - START_HOUR) * 60 / SLOT_MIN }).map((_, row) => {
          const minute = (row * SLOT_MIN) % 60;
          const hour = Math.floor(row * SLOT_MIN / 60) + START_HOUR;
          return (
            <>
              <div key={`h-${row}`} className="border-r text-xs text-right pr-2 py-4 text-gray-500">
                {`${('' + hour).padStart(2, '0')}:${('' + minute).padStart(2, '0')}`}
              </div>
              {days.map((d, di) => (
                <div
                  key={`${row}-${di}`}
                  className="border h-12 relative group"
                  onDoubleClick={() => setOpenFormAt(slotISO(d, hour, minute))}
                  title="Doble click para nuevo turno"
                >
                  {items.filter(i => {
                    const s = DateTime.fromISO(i.start);
                    return s.hasSame(d, 'day') && s.hour === hour && s.minute === minute;
                  }).map(i => {
                    const mins = DateTime.fromISO(i.end).diff(DateTime.fromISO(i.start), 'minutes').minutes;
                    const rows = Math.max(1, Math.round(mins / SLOT_MIN));
                    return (
                      <div
                        key={i.id}
                        onClick={() => setEditing({ baseId: i.id.split('::')[0], start: i.start, end: i.end, title: i.title })}
                        className="absolute inset-x-1 -top-px rounded p-1 text-xs cursor-pointer bg-sky-200"
                        style={{ height: `${rows * 3}rem` }}
                        title="Click para editar"
                      >
                        <div className="font-medium line-clamp-1">{i.title ?? 'Turno'}</div>
                        <div className="opacity-70">{fmtTime(i.start)}–{fmtTime(i.end)}</div>
                      </div>
                    );
                  })}
                  <div className="absolute hidden group-hover:block right-1 top-1 text-[10px] px-1 py-0.5 border rounded bg-white">+ turno</div>
                </div>
              ))}
            </>
          );
        })}
      </div>

      {/* Modal crear */}
      {openFormAt && (
    <AppointmentForm
      defaultStart={openFormAt}
      onClose={() => setOpenFormAt(undefined)}
      onSaved={() => { setOpenFormAt(undefined); load(); onChanged?.(); }}
    />
  )}
  {editing && (
    <AppointmentForm
      defaultStart={editing.start}
      editingBaseId={editing.baseId}
      occurrenceStartISO={editing.start}
      onClose={() => setEditing(undefined)}
      onSaved={() => { setEditing(undefined); load(); onChanged?.(); }}
    />
  )}
    </div>
  );
}
