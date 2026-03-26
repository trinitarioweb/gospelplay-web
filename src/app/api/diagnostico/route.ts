import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check if artistas table exists and has data
  const { data: artistas, error: artistasError } = await supabase
    .from('artistas')
    .select('slug, nombre')
    .limit(5);

  // Check contenido count
  const { count: contenidoCount } = await supabase
    .from('contenido')
    .select('*', { count: 'exact', head: true });

  // Check if artista_id column exists
  const { data: testCol, error: colError } = await supabase
    .from('contenido')
    .select('artista_id')
    .limit(1);

  return NextResponse.json({
    artistas_tabla: artistasError ? `ERROR: ${artistasError.message}` : `OK - ${artistas?.length || 0} encontrados`,
    artistas_muestra: artistas?.slice(0, 3) || [],
    contenido_total: contenidoCount || 0,
    artista_id_columna: colError ? `NO EXISTE: ${colError.message}` : 'OK',
  });
}
