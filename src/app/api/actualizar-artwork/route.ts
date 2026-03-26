import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buscarArtworkCancion, buscarImagenArtista } from '@/lib/artwork';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST: Update artwork for all content and artists
export async function POST(request: NextRequest) {
  try {
    const { tipo = 'todo' } = await request.json().catch(() => ({ tipo: 'todo' }));

    const results = {
      artistas_actualizados: 0,
      canciones_actualizadas: 0,
      errores: 0,
    };

    // 1. Update artist images
    if (tipo === 'todo' || tipo === 'artistas') {
      const { data: artistas } = await supabase
        .from('artistas')
        .select('id, nombre, imagen')
        .eq('activo', true);

      for (const artista of artistas || []) {
        // Skip if already has a non-YouTube image
        if (artista.imagen && !artista.imagen.includes('img.youtube.com')) continue;

        const imagen = await buscarImagenArtista(artista.nombre);
        if (imagen) {
          const { error } = await supabase
            .from('artistas')
            .update({ imagen })
            .eq('id', artista.id);

          if (!error) {
            results.artistas_actualizados++;
            console.log(`[Artwork] ✓ Artista: ${artista.nombre}`);
          } else {
            results.errores++;
          }
        }
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // 2. Update song thumbnails
    if (tipo === 'todo' || tipo === 'canciones') {
      const { data: canciones } = await supabase
        .from('contenido')
        .select('id, titulo, artista, thumbnail')
        .eq('publicado', true);

      for (const cancion of canciones || []) {
        // Skip if already has a non-YouTube thumbnail
        if (cancion.thumbnail && !cancion.thumbnail.includes('img.youtube.com')) continue;

        const artwork = await buscarArtworkCancion(cancion.titulo, cancion.artista);
        if (artwork) {
          const { error } = await supabase
            .from('contenido')
            .update({ thumbnail: artwork })
            .eq('id', cancion.id);

          if (!error) {
            results.canciones_actualizadas++;
            console.log(`[Artwork] ✓ Canción: ${cancion.titulo}`);
          } else {
            results.errores++;
          }
        }
        await new Promise(r => setTimeout(r, 200));
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('[Artwork] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
