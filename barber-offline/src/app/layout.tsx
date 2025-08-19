import './globals.css';
import type { Metadata, Viewport  } from 'next';
import { ThemeProvider } from './context/ThemeContext';
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


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-dvh bg-white text-zinc-900 dark:bg-neutral-900 dark:text-zinc-100">
         <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}