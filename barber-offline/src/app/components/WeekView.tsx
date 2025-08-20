'use client';
import { Fragment, MouseEvent, useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { getOccurrences } from '@/lib/schedule';
import { endOfWeekISO, fmtDay, fmtTime, startOfWeekISO } from '@/lib/time';
import AppointmentForm from './AppointmentForm';

type Occ = {
  id: string;
  start: string;
  end: string;
  title?: string;
  clientId?: string;
  status?: 'pending' | 'done' | 'cancelled';
  price?: number;
};
type EditTarget = { baseId: string; start: string; end: string; title?: string };
type Props = { onChanged?: () => void };

const DAY_COLS = 7;
const SLOT_MIN = 15;
const START_HOUR = 7;
const END_HOUR = 24;

function slotISO(day: DateTime, hour: number, minute: number): string {
  return day
    .set({ hour, minute, second: 0, millisecond: 0 })
    .toISO({ suppressMilliseconds: true })!;
}
function nextQuarterISO(ref = DateTime.now()): string {
  const q = Math.ceil(ref.minute / 15) * 15;
  const hour = ref.hour + Math.floor(q / 60);
  const minute = q % 60;
  return ref
    .set({ hour, minute, second: 0, millisecond: 0 })
    .toISO({ suppressMilliseconds: true })!;
}

export default function WeekView({ onChanged }: Props) {
  const [ref, setRef] = useState(DateTime.now());
  const [items, setItems] = useState<Occ[]>([]);
  const [openFormAt, setOpenFormAt] = useState<string | undefined>();
  const [editing, setEditing] = useState<EditTarget | undefined>();
  const [scale, setScale] = useState(1); // 👈 control de zoom

  async function load() {
    const occs = await getOccurrences(startOfWeekISO(ref), endOfWeekISO(ref));
    setItems(
      occs
        .map((occ) => ({
          ...occ,
          status:
            occ.status === 'pending' || occ.status === 'done' || occ.status === 'cancelled'
              ? (occ.status as 'pending' | 'done' | 'cancelled')
              : undefined,
        }))
        .sort((a, b) => a.start.localeCompare(b.start))
    );
  }
  useEffect(() => {
    load();
  }, [ref]);

  const days = useMemo(() => {
    const start = ref.startOf('week');
    return Array.from({ length: DAY_COLS }, (_, i) => start.plus({ days: i }));
  }, [ref]);

  const isThisWeek = ref.hasSame(DateTime.now(), 'week');

  const openEditor = (e: MouseEvent, data: EditTarget) => {
    e.stopPropagation();
    setEditing(data);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Navegación */}
        <nav
          aria-label="Navegación de semana"
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800
                     bg-white/70 dark:bg-neutral-900/70 p-0.5 shadow-sm backdrop-blur"
        >
          {(() => {
            const base =
              'px-3 py-1.5 rounded-full text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500';
            const ghost = 'hover:bg-zinc-100 dark:hover:bg-neutral-800';
            const active = 'bg-sky-600 text-white shadow hover:bg-sky-500';
            return (
              <>
                <button
                  aria-label="Semana anterior"
                  onClick={() => setRef(ref.minus({ weeks: 1 }))}
                  className={`${base} ${ghost} min-w-[96px] text-left`}
                  title="Semana anterior"
                >
                  ‹ Semana
                </button>

                <button
                  onClick={() => setRef(DateTime.now())}
                  title="Ir a hoy"
                  className={`${base} ${
                    isThisWeek ? active : ghost
                  } font-medium px-4 min-w-[72px] text-center`}
                >
                  Hoy
                </button>

                <button
                  aria-label="Semana siguiente"
                  onClick={() => setRef(ref.plus({ weeks: 1 }))}
                  className={`${base} ${ghost} min-w-[96px] text-right`}
                  title="Semana siguiente"
                >
                  Semana ›
                </button>
              </>
            );
          })()}
        </nav>

        {/* Rango + acciones */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800
                           bg-white/70 dark:bg-neutral-900/70 px-3 py-1 text-sm text-zinc-600 dark:text-zinc-300">
            {ref.startOf('week').setLocale('es').toFormat('dd LLL')} –{' '}
            {ref.endOf('week').setLocale('es').toFormat('dd LLL yyyy')}
          </span>

          <button
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-sky-600 text-white hover:bg-sky-500 shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-sky-500"
            onClick={() => setOpenFormAt(nextQuarterISO(ref))}
            title="Agregar turno"
          >
            <span className="text-base leading-none">＋</span> Agregar turno
          </button>

          {/* 👇 control de zoom */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700"
            >
              −
            </button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((s) => Math.min(2, s + 0.1))}
              className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700"
            >
              ＋
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor con scroll horizontal */}
      <div className="card overflow-x-auto">
        <div
          className="origin-top-left"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            minWidth: '960px',
          }}
        >
          <div
            className="grid isolate"
            style={{ gridTemplateColumns: `72px repeat(${DAY_COLS}, 1fr)` }}
          >
            {/* encabezado */}
            <div className="h-10" />
            {days.map((d, i) => (
              <div
                key={i}
                className="h-10 px-2 flex items-end justify-center text-sm font-medium border-b border-zinc-200 dark:border-zinc-800"
              >
                {fmtDay(d.toISO()!)}
              </div>
            ))}

            {/* filas */}
            {Array.from({
              length: ((END_HOUR - START_HOUR) * 60) / SLOT_MIN,
            }).map((_, row) => {
              const minute = (row * SLOT_MIN) % 60;
              const hour = Math.floor((row * SLOT_MIN) / 60) + START_HOUR;
              const label = `${String(hour).padStart(2, '0')}:${String(
                minute
              ).padStart(2, '0')}`;

              return (
                <Fragment key={`row-${row}`}>
                  {/* columna de horas */}
                  <div className="h-12 pr-2 text-xs text-right text-zinc-500 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 flex items-center">
                    {label}
                  </div>

                  {days.map((d, di) => {
                    const isTodayCol = d.hasSame(DateTime.now(), 'day');

                    const startsHere = items.some((i) => {
                      const s = DateTime.fromISO(i.start);
                      return (
                        s.hasSame(d, 'day') &&
                        s.hour === hour &&
                        s.minute === minute
                      );
                    });

                    return (
                      <div
                        key={`${row}-${di}`}
                        className={`h-12 border border-l-0 border-t-0 border-zinc-200 dark:border-zinc-800 relative overflow-visible ${
                          startsHere ? 'z-20' : 'z-0'
                        }
                                    ${
                                      isTodayCol
                                        ? 'bg-sky-50 dark:bg-sky-950/20'
                                        : 'bg-white/40 dark:bg-neutral-900/40'
                                    }`}
                        onClick={() =>
                          setOpenFormAt(slotISO(d, hour, minute))
                        }
                        title="Click para nuevo turno"
                      >
                        {/* bloques */}
                        {items
                          .filter((i) => {
                            const s = DateTime.fromISO(i.start);
                            return (
                              s.hasSame(d, 'day') &&
                              s.hour === hour &&
                              s.minute === minute
                            );
                          })
                          .map((i) => {
                            const start = DateTime.fromISO(i.start);
                            const end = DateTime.fromISO(i.end);
                            const mins = end.diff(start, 'minutes').minutes;
                            const rows = Math.max(
                              1,
                              Math.round(mins / SLOT_MIN)
                            );

                            // 🎨 Color según estado
                            let statusClasses = '';
                            if (i.status === 'done') {
                              statusClasses =
                                'border-green-400 bg-green-200/50 text-green-800 dark:border-green-600 dark:bg-green-900/40 dark:text-green-200';
                            } else if (i.status === 'cancelled') {
                              statusClasses =
                                'border-red-400 bg-red-200/50 text-red-800 dark:border-red-600 dark:bg-red-900/40 dark:text-red-200';
                            } else {
                              statusClasses =
                                'border-sky-400/60 bg-sky-500/15 hover:bg-sky-500/20 text-zinc-900 dark:text-zinc-100';
                            }

                            return (
                              <button
                                key={i.id}
                                onClick={(e) =>
                                  openEditor(e, {
                                    baseId: i.id.split('::')[0],
                                    start: i.start,
                                    end: i.end,
                                    title: i.title,
                                  })
                                }
                                className={`absolute inset-x-1 top-0 z-20 text-left rounded-xl px-2 py-1 text-xs shadow-sm border ${statusClasses}`}
                                style={{ height: `${rows * 3}rem` }}
                                title="Abrir turno"
                              >
                                <div className="font-medium line-clamp-1">
                                  {i.title ?? 'Turno'}
                                </div>
                                <div className="opacity-70">
                                  {fmtTime(i.start)}–{fmtTime(i.end)}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Crear */}
      {openFormAt && (
        <AppointmentForm
          defaultStart={openFormAt}
          onClose={() => setOpenFormAt(undefined)}
          onSaved={() => {
            setOpenFormAt(undefined);
            load();
            onChanged?.();
          }}
        />
      )}

      {/* Editar */}
      {editing && (
        <AppointmentForm
          defaultStart={editing.start}
          editingBaseId={editing.baseId}
          occurrenceStartISO={editing.start}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            load();
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
