'use client';
import WeekView from './components/WeekView';
import { exportJSON, importJSON } from '@/lib/backup';
import { saveAs } from 'file-saver';
import { useRef, useState } from 'react';
import { resetDatabase } from '@/lib/reset-db';
import StatsBar from './components/StatsBar';
import  StatsView  from './components/StatsView';
import PricesView from './components/PriceView';
import { Download, Upload, Trash2, CalendarDays, DollarSign, BarChart3 } from "lucide-react";
type View = 'week' | 'prices' | 'stats';

export default function Home() {
  const [view, setView] = useState<View>('week');
  const fileRef = useRef<HTMLInputElement>(null);
  const [statsTick, setStatsTick] = useState(0);
  const bumpStats = () => setStatsTick(t => t + 1);

  async function handleExport() {
    const data = await exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `turnos-backup-${new Date().toISOString().slice(0, 10)}.json`);
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

  const handlePrices = () => setView('prices');
  const handleStats = () => setView('stats');
  const handleWeek = () => setView('week');

  return (
    <main className="space-y-4">
      {/* Header */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full">
          <nav
  aria-label="Acciones"
  className="flex flex-wrap gap-2 w-full sm:w-auto
             rounded-xl border border-zinc-200 dark:border-zinc-800
             bg-white/70 dark:bg-neutral-900/70 p-2 shadow-sm backdrop-blur"
>
  {/* Exportar */}
  <button
    onClick={handleExport}
    className="flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
               hover:bg-zinc-100 dark:hover:bg-neutral-800
               focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    title="Exportar a JSON"
  >
    <Download size={16} />
    <span>Exportar</span>
  </button>

  {/* Importar */}
  <label
    htmlFor="import-json"
    className="flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer
               hover:bg-zinc-100 dark:hover:bg-neutral-800
               focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500"
    title="Importar desde JSON"
  >
    <Upload size={16} />
    <span>Importar</span>
  </label>

  {/* Reiniciar */}
  <button
    onClick={handleReset}
    className="flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
               border border-red-300 dark:border-red-700
               text-red-700 dark:text-red-300
               bg-red-50/80 dark:bg-red-900/20
               hover:bg-red-100 dark:hover:bg-red-900/30
               focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300
               shadow-none"
    title="Borrar base local"
  >
    <Trash2 size={16} />
    <span>Reiniciar</span>
  </button>

  {/* Vistas */}
  <button
    onClick={handleWeek}
    className="flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm hover:bg-zinc-100 dark:hover:bg-neutral-800"
  >
    <CalendarDays size={16} />
    <span>Agenda</span>
  </button>
  <button
    onClick={handlePrices}
    className="flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm hover:bg-zinc-100 dark:hover:bg-neutral-800"
  >
    <DollarSign size={16} />
    <span>Precios</span>
  </button>
  <button
    onClick={handleStats}
    className="flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm hover:bg-zinc-100 dark:hover:bg-neutral-800"
  >
    <BarChart3 size={16} />
    <span>Estadísticas</span>
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



      {/* Contenido principal */}
      {view === 'week' && <>
      <StatsBar refreshKey={statsTick} />
      <WeekView onChanged={bumpStats} />
      </>}
      {view === 'prices' && <div className="card p-4"><PricesView  /></div>}
      {view === 'stats' && <div className="card p-4"><StatsView  /></div>}
    </main>
  );
}
