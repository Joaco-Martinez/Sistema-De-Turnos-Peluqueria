'use client';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? 'Claro' : 'Oscuro';
  const icon = theme === 'dark' ? '☀️' : '🌙';

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 border border-zinc-200 dark:border-zinc-700
                 bg-white/70 dark:bg-neutral-900/70 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      title={`Cambiar a ${label.toLowerCase()}`}
      aria-label="Cambiar tema"
    >
      <span aria-hidden>{icon}</span>
      {label}
    </button>
  );
}
