
import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sistema Agéntico de Ventas',
  description: 'Dashboard completo para gestión de ventas automatizadas con IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
