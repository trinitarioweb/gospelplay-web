import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'GospelPlay - Música Cristiana Curada con IA',
  description: 'Contenido cristiano clasificado por IA teológica. Música, predicaciones, estudios bíblicos y comunidad.',
  keywords: ['música cristiana', 'predicaciones', 'estudios bíblicos', 'gospel', 'adoración'],
  manifest: '/manifest.json',
  themeColor: '#d4a843',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#121212] text-white antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
