import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { limpiarMetadata } from '@/lib/limpiar-metadata';

// One-time endpoint to clean existing titles in the database
export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get all content
    const { data: contenido, error } = await supabase
      .from('contenido')
      .select('id, titulo, artista');

    if (error || !contenido) {
      return NextResponse.json({ error: 'Error al leer contenido' }, { status: 500 });
    }

    const updates: { id: string; old: string; new_titulo: string; new_artista: string }[] = [];

    for (const item of contenido) {
      const { track, artist } = limpiarMetadata(item.titulo, item.artista || '');

      // Only update if something changed
      if (track !== item.titulo || artist !== (item.artista || '')) {
        const { error: updateError } = await supabase
          .from('contenido')
          .update({ titulo: track, artista: artist })
          .eq('id', item.id);

        if (!updateError) {
          updates.push({
            id: item.id,
            old: `${item.titulo} - ${item.artista}`,
            new_titulo: track,
            new_artista: artist,
          });
        }
      }
    }

    return NextResponse.json({
      total: contenido.length,
      actualizados: updates.length,
      cambios: updates,
    });
  } catch (error) {
    console.error('[Limpiar] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
