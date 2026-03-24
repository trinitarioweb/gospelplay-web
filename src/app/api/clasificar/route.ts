import { NextRequest, NextResponse } from 'next/server';
import { clasificarContenido } from '@/lib/clasificador-ia';

export async function POST(request: NextRequest) {
  try {
    const { url, titulo, artista, descripcion } = await request.json();

    if (!url && !titulo) {
      return NextResponse.json({ error: 'Se requiere url o titulo' }, { status: 400 });
    }

    // Si solo hay URL, extraer metadata (por ahora usamos datos simulados)
    const tituloFinal = titulo || extraerTituloDeUrl(url);
    const artistaFinal = artista || 'Desconocido';
    const descripcionFinal = descripcion || '';

    const resultado = await clasificarContenido(tituloFinal, artistaFinal, descripcionFinal);

    if (!resultado) {
      return NextResponse.json({ error: 'Error al clasificar' }, { status: 500 });
    }

    return NextResponse.json({
      url,
      titulo: tituloFinal,
      artista: artistaFinal,
      ...resultado,
    });
  } catch (error) {
    console.error('Error en /api/clasificar:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

function extraerTituloDeUrl(url: string): string {
  // Placeholder: en producción se usaría Spotify/YouTube API para extraer metadata real
  if (url.includes('spotify')) return 'Canción de Spotify (metadata pendiente)';
  if (url.includes('youtube') || url.includes('youtu.be')) return 'Video de YouTube (metadata pendiente)';
  return 'Contenido sin título';
}
