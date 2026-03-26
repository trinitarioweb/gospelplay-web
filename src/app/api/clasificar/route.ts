import { NextRequest, NextResponse } from 'next/server';
import { clasificarContenido } from '@/lib/clasificador-ia';
import { limpiarMetadata } from '@/lib/limpiar-metadata';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Se requiere una URL' }, { status: 400 });
    }

    // 1. Extraer metadata real del video/canción
    const metadata = await extraerMetadata(url);

    // 2. Limpiar título y artista (quitar "Official Video", "VEVO", etc.)
    const { track: tituloLimpio, artist: artistaLimpio } = limpiarMetadata(
      metadata.titulo,
      metadata.artista
    );

    console.log('[Clasificar] Original:', metadata.titulo, '-', metadata.artista);
    console.log('[Clasificar] Limpio:', tituloLimpio, '-', artistaLimpio);

    // 3. Clasificar con IA (usar nombres limpios)
    const resultado = await clasificarContenido(
      tituloLimpio,
      artistaLimpio,
      metadata.descripcion
    );

    if (!resultado) {
      return NextResponse.json({ error: 'Error al clasificar' }, { status: 500 });
    }

    // 4. Devolver con títulos limpios
    return NextResponse.json({
      url,
      plataforma: detectarPlataforma(url),
      titulo: tituloLimpio,
      artista: artistaLimpio,
      descripcion: metadata.descripcion,
      thumbnail: metadata.thumbnail,
      duracion: metadata.duracion,
      ...resultado,
    });
  } catch (error) {
    console.error('Error en /api/clasificar:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

function detectarPlataforma(url: string): string {
  if (url.includes('spotify')) return 'spotify';
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  return 'otro';
}

async function extraerMetadata(url: string): Promise<{
  titulo: string;
  artista: string;
  descripcion: string;
  thumbnail: string;
  duracion: string;
}> {
  // YouTube: usar oEmbed API (gratis, sin API key)
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        // Extraer video ID para thumbnail de alta calidad
        const videoId = extraerYouTubeId(url);
        return {
          titulo: data.title || 'Sin título',
          artista: data.author_name || 'Desconocido',
          descripcion: `Video de ${data.author_name}: ${data.title}`,
          thumbnail: videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            : '',
          duracion: '',
        };
      }
    } catch (e) {
      console.error('Error extrayendo metadata de YouTube:', e);
    }
  }

  // Spotify: por ahora metadata básica (necesita API key para más)
  if (url.includes('spotify')) {
    return {
      titulo: 'Canción de Spotify',
      artista: 'Artista',
      descripcion: 'Contenido de Spotify (conectar API para metadata completa)',
      thumbnail: '',
      duracion: '',
    };
  }

  return {
    titulo: 'Contenido sin título',
    artista: 'Desconocido',
    descripcion: '',
    thumbnail: '',
    duracion: '',
  };
}

function extraerYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
