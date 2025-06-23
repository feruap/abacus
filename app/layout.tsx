
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistema Agéntico de Ventas - CRM AI',
  description: 'Sistema inteligente de ventas con IA integrada para automatización y análisis avanzado',
  keywords: ['CRM', 'IA', 'Ventas', 'Automatización', 'MyAlice.ai'],
  authors: [{ name: 'Amunet' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
