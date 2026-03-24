import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GospelPlay - Música Cristiana Curada con IA',
  description: 'Contenido cristiano clasificado por IA teológica. Música, predicaciones, estudios bíblicos y comunidad.',
  keywords: ['música cristiana', 'predicaciones', 'estudios bíblicos', 'gospel', 'adoración'],
  manifest: '/manifest.json',
  themeColor: '#f97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
