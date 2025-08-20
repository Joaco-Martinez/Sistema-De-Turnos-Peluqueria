'use client';
import { useEffect, useState } from 'react';
import { db, Appointment, Service } from '@/lib/db';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';
import { isSlotAvailable } from '@/lib/schedule';

type Props = {
  defaultStart?: string;
  editingBaseId?: string;
  occurrenceStartISO?: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function AppointmentForm({
  defaultStart,
  editingBaseId,
  occurrenceStartISO,
  onClose,
  onSaved,
}: Props) {
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState(30);
  const [startISO, setStartISO] = useState(defaultStart ?? DateTime.now().toISO()!);
  const [isRecurring, setIsRecurring] = useState(false);
  const [freq, setFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [byweekday, setByweekday] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ---- Servicios ----
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string>('');

  // helpers de estilo
  const inputCls =
    'mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 ' +
    'bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 ' +
    'placeholder-zinc-400 dark:placeholder-zinc-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent';

const chipBase = "px-3 py-1 rounded-full border text-sm transition-colors";
const chipActive = "bg-sky-500 text-white border-sky-500 hover:bg-sky-600";
const chipInactive = "bg-white border-sky-300 hover:bg-sky-100 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:bg-sky-800";

  
  const days = [
    { label: 'L', value: 0 },
    { label: 'M', value: 1 },
    { label: 'X', value: 2 },
    { label: 'J', value: 3 },
    { label: 'V', value: 4 },
    { label: 'S', value: 5 },
    { label: 'D', value: 6 },
  ];

  // Cargar datos si es edición
  useEffect(() => {
    if (!editingBaseId) return;
    (async () => {
      const base = await db.appointments.get(editingBaseId);
      if (!base) return;
      setTitle(base.title ?? '');
      setDurationMin(base.durationMin);
      setIsRecurring(base.isRecurring);
      if (base.isRecurring && base.rrule) {
        setFreq(base.rrule.freq);
        setInterval(base.rrule.interval ?? 1);
        setByweekday(base.rrule.byweekday ?? []);
      }
      setStartISO(occurrenceStartISO ?? base.startDateTime);
      setServiceId(base.serviceId ?? '');
    })();
  }, [editingBaseId, occurrenceStartISO]);

  // Cargar servicios al montar
  useEffect(() => {
    (async () => {
      const all = await db.services.toArray();
      setServices(all);
    })();
  }, []);

  // Cuando arranca repetición semanal → no autoselecciona día
  useEffect(() => {
    if (!editingBaseId && isRecurring && freq === 'WEEKLY') {
      setByweekday([]);
    }
  }, [startISO, isRecurring, freq, editingBaseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!serviceId) {
      setError('Tenés que seleccionar un servicio.');
      return;
    }

    if (isRecurring && freq === 'WEEKLY' && byweekday.length === 0) {
      setError('Tenés que seleccionar al menos un día de la semana.');
      return;
    }

    const free = await isSlotAvailable(startISO, durationMin, editingBaseId);
    if (!free) {
      setError('Ese horario ya está ocupado por otro turno.');
      return;
    }

    const payload: Appointment = {
      id: editingBaseId ?? nanoid(),
      title: title || 'Turno',
      startDateTime: startISO,
      durationMin,
      isRecurring,
      rrule: isRecurring ? { freq, interval, byweekday } : undefined,
      serviceId,
    };

    await db.appointments.put(payload);
    onSaved();
  }


  
async function confirmDelete(choice: 'uno' | 'todos' | 'actual') {
  if (!editingBaseId) return;
  const base = await db.appointments.get(editingBaseId);
  if (!base) return;

  if (base.isRecurring) {
    if (choice === 'uno' && occurrenceStartISO) {
      await db.exceptions.add({
        id: nanoid(),
        appointmentId: base.id,
        originalDateTime: occurrenceStartISO,
        type: 'skip',
      });
    } else if (choice === 'todos') {
      await db.appointments.delete(base.id);
    } else if (choice === 'actual' && occurrenceStartISO) {
      await db.appointments.put({
        ...base,
        id: nanoid(),
        startDateTime: occurrenceStartISO,
        isRecurring: false,
        rrule: undefined,
      });
      await db.appointments.delete(base.id);
    }
  } else {
    await db.appointments.delete(base.id);
  }

  setShowDeleteModal(false);
  onSaved();
}

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-neutral-900 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">
            {editingBaseId ? 'Editar turno' : 'Nuevo turno'}
          </h2>
          {editingBaseId && (
            <button
  type="button"
  onClick={() => setShowDeleteModal(true)}
  className="px-2.5 py-1.5 rounded-lg border border-red-300 dark:border-red-700 
             text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
  title="Eliminar o cancelar"
>
  Eliminar/Cancelar
</button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {error && (
            <p className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Título/Cliente</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder="Juan / Corte 30m"
            />
          </label>

          {/* Servicio */}
          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Servicio</span>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className={inputCls}
            >
              <option value="">Seleccioná un servicio...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.price}$
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Inicio</span>
              <input
                type="datetime-local"
                value={DateTime.fromISO(startISO).toFormat("yyyy-LL-dd'T'HH:mm")}
                onChange={(e) =>
                  setStartISO(
                    DateTime.fromFormat(e.target.value, "yyyy-LL-dd'T'HH:mm")
                      .toISO({ suppressMilliseconds: true })!
                  )
                }
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Duración (min)</span>
              <input
                type="number"
                min={15}
                step={15}
                value={durationMin === null || Number.isNaN(durationMin) ? "" : durationMin}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setDurationMin(NaN);
                  } else {
                    setDurationMin(+val);
                  }
                }}
                className={inputCls}
              />
            </label>
          </div>

          {/* Repetición */}
          <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              className="accent-sky-600"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <span>Repetir</span>
          </label>

          {isRecurring && (
            <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-neutral-900/40 p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Frecuencia</span>
                  <select
                    value={freq}
                    onChange={(e) => setFreq(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
                    className={inputCls}
                  >
                    <option value="DAILY">Diaria</option>
                    <option value="WEEKLY">Semanal</option>
                    <option value="MONTHLY">Mensual</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Cada (intervalo)</span>
                  <input
                    type="number"
                    min={1}
                    value={interval}
                    onChange={(e) => setInterval(+e.target.value)}
                    className={inputCls}
                  />
                </label>
              </div>

              {freq === 'WEEKLY' && (
  <div className="flex flex-wrap gap-2">
    {days.map(({ label, value }) => {
      const isActive = byweekday.includes(value);
      return (
        <button
          key={value}
          type="button"
          onClick={() =>
            setByweekday((w) =>
              w.includes(value) ? w.filter((x) => x !== value) : [...w, value]
            )
          }
          className={`${chipBase} ${isActive ? chipActive : chipInactive}`}
        >
          {label}
        </button>
      );
    })}
  </div>
)}

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                “Todos los jueves” → Semanal / 1 / J — “Cada 15 días” → Semanal / 2 (día de inicio).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button className="px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500">
            Guardar
          </button>
        </div>
      </form>
      {showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-xl space-y-4 w-full max-w-sm">
      <h3 className="text-lg font-semibold">¿Qué querés hacer?</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Este turno es parte de una serie recurrente.
      </p>
      <div className="space-y-2">
        <button
          onClick={() => confirmDelete('uno')}
          className="w-full px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500"
        >
          Cancelar solo este
        </button>
        <button
          onClick={() => confirmDelete('todos')}
          className="w-full px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500"
        >
          Borrar toda la serie
        </button>
        <button
          onClick={() => confirmDelete('actual')}
          className="w-full px-3 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-400"
        >
          Convertir en único
        </button>
      </div>
      <button
        onClick={() => setShowDeleteModal(false)}
        className="mt-3 w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-neutral-800"
      >
        Cancelar
      </button>
    </div>
  </div>
)}
    </div>
  );
}
