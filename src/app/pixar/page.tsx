import GeneradorPixar from '@/components/GeneradorPixar';

export const metadata = {
  title: 'Foto Pixar con la Selección Colombia',
  description: 'Genera una imagen estilo Pixar posando con tu jugador favorito de la Selección Colombia',
};

export default function PixarPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-blue-50 py-12">
      <GeneradorPixar />
    </main>
  );
}
