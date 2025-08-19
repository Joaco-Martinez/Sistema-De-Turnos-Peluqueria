'use client';
import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { getOccurrences } from '@/lib/schedule';

type Props = { refreshKey?: number };

export default function StatsBar({ refreshKey }: Props) {
  const [today, setToday] = useState(0);
  const [week, setWeek]   = useState(0);
  const [month, setMonth] = useState(0);

  useEffect(() => {
    (async () => {
      const now = DateTime.now();
      const t = await getOccurrences(now.startOf('day').toISO()!,   now.endOf('day').toISO()!);
      const w = await getOccurrences(now.startOf('week').toISO()!,  now.endOf('week').toISO()!);
      const m = await getOccurrences(now.startOf('month').toISO()!, now.endOf('month').toISO()!);
      setToday(t.length); setWeek(w.length); setMonth(m.length);
    })();
  }, [refreshKey]);

  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      <div className="rounded-xl border p-3">
        <div className="text-xs text-gray-500">Turnos hoy</div>
        <div className="text-xl font-semibold">{today}</div>
      </div>
      <div className="rounded-xl border p-3">
        <div className="text-xs text-gray-500">Turnos esta semana</div>
        <div className="text-xl font-semibold">{week}</div>
      </div>
      <div className="rounded-xl border p-3">
        <div className="text-xs text-gray-500">Turnos este mes</div>
        <div className="text-xl font-semibold">{month}</div>
      </div>
    </div>
  );
}
