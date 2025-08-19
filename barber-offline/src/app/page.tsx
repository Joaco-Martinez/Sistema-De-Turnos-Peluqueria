'use client';
import WeekView from './components/WeekView';
import { exportJSON, importJSON } from '@/lib/backup';
import { saveAs } from 'file-saver';
import { useRef, useState } from 'react';
import { resetDatabase } from '@/lib/reset-db';
import StatsBar from './components/StatsBar';

export default function Home() {
    const fileRef = useRef<HTMLInputElement>(null);
  const [statsTick, setStatsTick] = useState(0);
  const bumpStats = () => setStatsTick(t => t + 1);

  async function handleExport() {
    const data = await exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `turnos-backup-${new Date().toISOString().slice(0,10)}.json`);
  }
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    await importJSON(JSON.parse(txt));
    window.location.reload();
  }
  async function handleReset() {
    if (!confirm('Esto borra TODOS los turnos y datos locales. ¿Continuar?')) return;
    await resetDatabase();
  }

  return (
     <main className="p-4 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Turnos</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-3 py-2 border rounded">Exportar</button>
          <button onClick={()=>fileRef.current?.click()} className="px-3 py-2 border rounded">Importar</button>
          <button onClick={handleReset} className="px-3 py-2 border rounded text-red-600">Reiniciar base</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport}/>
        </div>
      </header>

      {/* 🔢 Resumen: hoy / semana / mes */}
      <StatsBar refreshKey={statsTick} />

      {/* Calendario */}
      <WeekView onChanged={bumpStats} />

      <p className="text-xs text-gray-500 mt-4">
        Doble click en una celda para crear un turno. Los datos se guardan 100% local (IndexedDB).
      </p>
    </main>
  );
}
