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
     <main className="space-y-4">
      {/* Header */}
      <div className="card flex flex-col md:flex-row md:items-center md:justify-between gap-3">
  <div className="flex flex-wrap items-center gap-2">
    <nav
      aria-label="Acciones"
      className="inline-flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800
                 bg-white/70 dark:bg-neutral-900/70 p-0.5 shadow-sm backdrop-blur"
    >
      {/* Exportar */}
      <button
        onClick={handleExport}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                   hover:bg-zinc-100 dark:hover:bg-neutral-800
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        title="Exportar a JSON"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80" aria-hidden>
          <path d="M12 3v10m0 0l-3.5-3.5M12 13l3.5-3.5M5 21h14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Exportar</span>
      </button>

      {/* Importar (label controla el input) */}
      <label
        htmlFor="import-json"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer
                   hover:bg-zinc-100 dark:hover:bg-neutral-800
                   focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500"
        title="Importar desde JSON"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80" aria-hidden>
          <path d="M12 21V11m0 0l3.5 3.5M12 11L8.5 14.5M5 3h14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Importar</span>
      </label>

      {/* Reiniciar */}
      <button
        onClick={handleReset}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
           border border-red-300 dark:border-red-700
           text-red-700 dark:text-red-300
           bg-red-50/80 dark:bg-red-900/20
           hover:bg-red-100 dark:hover:bg-red-900/30
           focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300
           shadow-none"
        title="Borrar base local"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path d="M3 6h18M8 6l1-2h6l1 2M9 10v8M15 10v8M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Reiniciar</span>
      </button>
    </nav>

    {/* input de archivo oculto */}
    <input
      id="import-json"
      ref={fileRef}
      type="file"
      accept="application/json"
      className="hidden"
      onChange={handleImport}
    />
  </div>
</div>

      {/* Resumen */}
      <StatsBar refreshKey={statsTick} />

      {/* Calendario */}
      <WeekView onChanged={bumpStats} />
    </main>
  );
}
