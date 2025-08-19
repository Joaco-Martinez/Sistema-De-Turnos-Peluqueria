import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Barber Uri',
  description: 'Calendario de turnos 100% offline',
  manifest: '/manifest.webmanifest',
  themeColor: '#0ea5e9',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-neutral-950 dark:text-zinc-100 antialiased">
        <div className="mx-auto max-w-7xl px-3 md:px-6 py-4">{children}</div>
      </body>
    </html>
  );
}
