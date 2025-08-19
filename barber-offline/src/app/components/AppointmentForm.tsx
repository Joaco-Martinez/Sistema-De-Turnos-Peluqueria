'use client';
import { useEffect, useState } from 'react';
import { db, Appointment } from '@/lib/db';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';
import { isSlotAvailable } from '@/lib/schedule';

type Props = {
  defaultStart?: string;             // ISO sugerida
  editingBaseId?: string;            // id del appointment base si se está editando una ocurrencia
  occurrenceStartISO?: string;       // start de la ocurrencia clickeada (para “solo este”)
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
  const [durationMin, setDurationMin] = useState(45);
  const [startISO, setStartISO] = useState(defaultStart ?? DateTime.now().toISO()!);
  const [isRecurring, setIsRecurring] = useState(false);
  const [freq, setFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [byweekday, setByweekday] = useState<number[]>([DateTime.fromISO(startISO).weekday % 7]);
  const [error, setError] = useState<string | null>(null);

  // Si es edición, cargamos los datos del appointment base
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
        setByweekday(base.rrule.byweekday ?? [DateTime.fromISO(base.startDateTime).weekday % 7]);
      }
      // si abrimos una ocurrencia, el inicio por defecto es el de esa ocurrencia
      if (occurrenceStartISO) setStartISO(occurrenceStartISO);
      else setStartISO(base.startDateTime);
    })();
  }, [editingBaseId, occurrenceStartISO]);

  useEffect(() => {
    if (!editingBaseId && isRecurring && freq === 'WEEKLY') {
      const w = DateTime.fromISO(startISO).weekday % 7;
      setByweekday([w]);
    }
  }, [startISO, isRecurring, freq, editingBaseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 1) Validación de disponibilidad (bloquea solapados)
    const free = await isSlotAvailable(startISO, durationMin, editingBaseId);
    if (!free) {
      setError('Ese horario ya está ocupado por otro turno.');
      return;
    }

    // 2) Upsert
    const payload: Appointment = {
      id: editingBaseId ?? nanoid(),
      title: title || 'Turno',
      startDateTime: startISO,
      durationMin,
      isRecurring,
      rrule: isRecurring ? { freq, interval, byweekday } : undefined,
    };

    await db.appointments.put(payload);
    onSaved();
  }

  // Eliminar / Cancelar
  async function handleDelete() {
    if (!editingBaseId) {
      // nada que borrar si es creación nueva
      onClose();
      return;
    }
    const base = await db.appointments.get(editingBaseId);
    if (!base) return;

    // Si es serie y hay occurrenceStartISO => “solo este” (exception skip)
    if (base.isRecurring && occurrenceStartISO) {
      if (!confirm('¿Cancelar SOLO esta ocurrencia?')) return;
      await db.exceptions.add({
        id: nanoid(),
        appointmentId: base.id,
        originalDateTime: occurrenceStartISO,
        type: 'skip',
      });
    } else {
      // Borrar todo el turno (simple o serie completa)
      const msg = base.isRecurring
        ? 'Esto eliminará TODA la serie. ¿Confirmás?'
        : '¿Eliminar este turno?';
      if (!confirm(msg)) return;
      await db.appointments.delete(base.id);
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 w-full max-w-md space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editingBaseId ? 'Editar turno' : 'Nuevo turno'}
          </h2>
          {editingBaseId && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-2 py-1 text-sm border rounded hover:bg-red-50"
              title="Eliminar o cancelar"
            >
              Eliminar/Cancelar
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <label className="block">
          <span className="text-sm">Título/Cliente</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border rounded p-2"
            placeholder="Juan / Corte 45m"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm">Inicio</span>
            <input
              type="datetime-local"
              value={DateTime.fromISO(startISO).toFormat("yyyy-LL-dd'T'HH:mm")}
              onChange={(e) =>
                setStartISO(DateTime.fromFormat(e.target.value, "yyyy-LL-dd'T'HH:mm").toISO()!)
              }
              className="mt-1 w-full border rounded p-2"
            />
          </label>
          <label className="block">
            <span className="text-sm">Duración (min)</span>
            <input
              type="number"
              min={15}
              step={15}
              value={durationMin}
              onChange={(e) => setDurationMin(+e.target.value)}
              className="mt-1 w-full border rounded p-2"
            />
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          <span>Repetir</span>
        </label>

        {isRecurring && (
          <div className="space-y-2 border rounded p-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-sm">Frecuencia</span>
                <select
                  value={freq}
                  onChange={(e) => setFreq(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
                  className="mt-1 w-full border rounded p-2"
                >
                  <option value="DAILY">Diaria</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="MONTHLY">Mensual</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm">Cada (intervalo)</span>
                <input
                  type="number"
                  min={1}
                  value={interval}
                  onChange={(e) => setInterval(+e.target.value)}
                  className="mt-1 w-full border rounded p-2"
                />
              </label>
            </div>
            {freq === 'WEEKLY' && (
              <div className="flex flex-wrap gap-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() =>
                      setByweekday((w) => (w.includes(i) ? w.filter((x) => x !== i) : [...w, i]))
                    }
                    className={`px-2 py-1 rounded border ${byweekday.includes(i) ? 'bg-black text-white' : ''}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              “Todos los jueves” → Semanal / intervalo 1 / J. — “Cada 15 días” → Semanal / intervalo 2.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded border">
            Cancelar
          </button>
          <button className="px-3 py-2 rounded bg-black text-white">Guardar</button>
        </div>
      </form>
    </div>
  );
}
