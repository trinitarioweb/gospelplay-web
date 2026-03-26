import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Recomendacion {
  id: string;
  titulo: string;
  artista: string;
  thumbnail: string;
  url: string;
  genero_musical: string;
  energia: string;
  categoria: string;
  eval_puntuacion_total: number;
  razon: string;
}

// Get top values from an array by frequency
function topPorFrecuencia(items: string[], limit = 3): string[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    if (item) counts[item] = (counts[item] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

// Recommend songs similar to a specific song
async function recomendarSimilares(contenidoId: string, sessionId: string): Promise<Recomendacion[]> {
  // Get the reference song
  const { data: cancion, error: cancionError } = await supabase
    .from('contenido')
    .select('*')
    .eq('id', contenidoId)
    .single();

  if (cancionError || !cancion) return [];

  // Get songs the user has already listened to
  const { data: historial } = await supabase
    .from('historial_escucha')
    .select('contenido_id')
    .eq('session_id', sessionId);

  const yaEscuchados = new Set((historial || []).map(h => h.contenido_id));

  const recomendaciones: Recomendacion[] = [];

  // 1. Same genre + same energy
  const { data: mismoGeneroEnergia } = await supabase
    .from('contenido')
    .select('*')
    .eq('genero_musical', cancion.genero_musical)
    .eq('energia', cancion.energia)
    .eq('publicado', true)
    .eq('eval_aprobado', true)
    .neq('id', contenidoId)
    .order('eval_puntuacion_total', { ascending: false })
    .limit(10);

  for (const c of mismoGeneroEnergia || []) {
    if (yaEscuchados.has(c.id)) continue;
    recomendaciones.push({
      id: c.id,
      titulo: c.titulo,
      artista: c.artista,
      thumbnail: c.thumbnail || '',
      url: c.url,
      genero_musical: c.genero_musical,
      energia: c.energia,
      categoria: c.categoria,
      eval_puntuacion_total: c.eval_puntuacion_total,
      razon: `Mismo genero (${c.genero_musical}) y energia (${c.energia})`,
    });
  }

  // 2. Same category
  const { data: mismaCategoria } = await supabase
    .from('contenido')
    .select('*')
    .eq('categoria', cancion.categoria)
    .eq('publicado', true)
    .eq('eval_aprobado', true)
    .neq('id', contenidoId)
    .order('eval_puntuacion_total', { ascending: false })
    .limit(8);

  for (const c of mismaCategoria || []) {
    if (yaEscuchados.has(c.id)) continue;
    if (recomendaciones.some(r => r.id === c.id)) continue;
    recomendaciones.push({
      id: c.id,
      titulo: c.titulo,
      artista: c.artista,
      thumbnail: c.thumbnail || '',
      url: c.url,
      genero_musical: c.genero_musical,
      energia: c.energia,
      categoria: c.categoria,
      eval_puntuacion_total: c.eval_puntuacion_total,
      razon: `Misma categoria: ${c.categoria}`,
    });
  }

  // 3. Same artist or related artists
  if (cancion.artista_id) {
    // Get the artist's related artists
    const { data: artista } = await supabase
      .from('artistas')
      .select('artistas_relacionados')
      .eq('id', cancion.artista_id)
      .single();

    const relacionadosSlugs: string[] = artista?.artistas_relacionados || [];

    if (relacionadosSlugs.length > 0) {
      // Get IDs of related artists
      const { data: relacionados } = await supabase
        .from('artistas')
        .select('id')
        .in('slug', relacionadosSlugs);

      const relacionadosIds = (relacionados || []).map(r => r.id);

      if (relacionadosIds.length > 0) {
        const { data: deRelacionados } = await supabase
          .from('contenido')
          .select('*')
          .in('artista_id', relacionadosIds)
          .eq('publicado', true)
          .eq('eval_aprobado', true)
          .order('eval_puntuacion_total', { ascending: false })
          .limit(8);

        for (const c of deRelacionados || []) {
          if (yaEscuchados.has(c.id)) continue;
          if (recomendaciones.some(r => r.id === c.id)) continue;
          recomendaciones.push({
            id: c.id,
            titulo: c.titulo,
            artista: c.artista,
            thumbnail: c.thumbnail || '',
            url: c.url,
            genero_musical: c.genero_musical,
            energia: c.energia,
            categoria: c.categoria,
            eval_puntuacion_total: c.eval_puntuacion_total,
            razon: `Artista relacionado`,
          });
        }
      }
    }
  }

  // 4. Shared themes (temas)
  const temas: string[] = cancion.temas || [];
  if (temas.length > 0) {
    const { data: mismosTemas } = await supabase
      .from('contenido')
      .select('*')
      .overlaps('temas', temas)
      .eq('publicado', true)
      .eq('eval_aprobado', true)
      .neq('id', contenidoId)
      .order('eval_puntuacion_total', { ascending: false })
      .limit(8);

    for (const c of mismosTemas || []) {
      if (yaEscuchados.has(c.id)) continue;
      if (recomendaciones.some(r => r.id === c.id)) continue;
      const temasComunes = (c.temas || []).filter((t: string) => temas.includes(t));
      recomendaciones.push({
        id: c.id,
        titulo: c.titulo,
        artista: c.artista,
        thumbnail: c.thumbnail || '',
        url: c.url,
        genero_musical: c.genero_musical,
        energia: c.energia,
        categoria: c.categoria,
        eval_puntuacion_total: c.eval_puntuacion_total,
        razon: `Temas en comun: ${temasComunes.join(', ')}`,
      });
    }
  }

  // Sort by score and return top 20
  recomendaciones.sort((a, b) => b.eval_puntuacion_total - a.eval_puntuacion_total);
  return recomendaciones.slice(0, 20);
}

// Recommend based on listening history preferences
async function recomendarPorHistorial(sessionId: string): Promise<Recomendacion[]> {
  // Get listening history
  const { data: historial, error: historialError } = await supabase
    .from('historial_escucha')
    .select('contenido_id, genero, energia, categoria, artista_id, completada')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (historialError || !historial || historial.length === 0) {
    // No history: return top-rated songs across genres
    return await recomendarTopGlobal();
  }

  const yaEscuchados = new Set(historial.map(h => h.contenido_id));

  // Weight completed songs more heavily
  const generos: string[] = [];
  const energias: string[] = [];
  const categorias: string[] = [];
  const artistaIds: string[] = [];

  for (const h of historial) {
    const weight = h.completada ? 3 : 1;
    for (let i = 0; i < weight; i++) {
      if (h.genero) generos.push(h.genero);
      if (h.energia) energias.push(h.energia);
      if (h.categoria) categorias.push(h.categoria);
      if (h.artista_id) artistaIds.push(h.artista_id);
    }
  }

  const topGeneros = topPorFrecuencia(generos, 3);
  const topEnergias = topPorFrecuencia(energias, 2);
  const topCategorias = topPorFrecuencia(categorias, 3);
  const topArtistas = topPorFrecuencia(artistaIds, 5);

  const recomendaciones: Recomendacion[] = [];

  // 1. Songs from favorite genres with preferred energy
  if (topGeneros.length > 0) {
    let query = supabase
      .from('contenido')
      .select('*')
      .in('genero_musical', topGeneros)
      .eq('publicado', true)
      .eq('eval_aprobado', true)
      .order('eval_puntuacion_total', { ascending: false })
      .limit(15);

    if (topEnergias.length > 0) {
      query = query.in('energia', topEnergias);
    }

    const { data: porGenero } = await query;

    for (const c of porGenero || []) {
      if (yaEscuchados.has(c.id)) continue;
      recomendaciones.push({
        id: c.id,
        titulo: c.titulo,
        artista: c.artista,
        thumbnail: c.thumbnail || '',
        url: c.url,
        genero_musical: c.genero_musical,
        energia: c.energia,
        categoria: c.categoria,
        eval_puntuacion_total: c.eval_puntuacion_total,
        razon: `Basado en tu preferencia por ${c.genero_musical}`,
      });
    }
  }

  // 2. Songs from favorite artists
  if (topArtistas.length > 0) {
    const { data: porArtista } = await supabase
      .from('contenido')
      .select('*')
      .in('artista_id', topArtistas)
      .eq('publicado', true)
      .eq('eval_aprobado', true)
      .order('eval_puntuacion_total', { ascending: false })
      .limit(10);

    for (const c of porArtista || []) {
      if (yaEscuchados.has(c.id)) continue;
      if (recomendaciones.some(r => r.id === c.id)) continue;
      recomendaciones.push({
        id: c.id,
        titulo: c.titulo,
        artista: c.artista,
        thumbnail: c.thumbnail || '',
        url: c.url,
        genero_musical: c.genero_musical,
        energia: c.energia,
        categoria: c.categoria,
        eval_puntuacion_total: c.eval_puntuacion_total,
        razon: `Mas de ${c.artista}, que escuchas frecuentemente`,
      });
    }
  }

  // 3. Songs from favorite categories
  if (topCategorias.length > 0) {
    const { data: porCategoria } = await supabase
      .from('contenido')
      .select('*')
      .in('categoria', topCategorias)
      .eq('publicado', true)
      .eq('eval_aprobado', true)
      .order('eval_puntuacion_total', { ascending: false })
      .limit(10);

    for (const c of porCategoria || []) {
      if (yaEscuchados.has(c.id)) continue;
      if (recomendaciones.some(r => r.id === c.id)) continue;
      recomendaciones.push({
        id: c.id,
        titulo: c.titulo,
        artista: c.artista,
        thumbnail: c.thumbnail || '',
        url: c.url,
        genero_musical: c.genero_musical,
        energia: c.energia,
        categoria: c.categoria,
        eval_puntuacion_total: c.eval_puntuacion_total,
        razon: `Categoria que disfrutas: ${c.categoria}`,
      });
    }
  }

  // 4. Related artists' songs
  if (topArtistas.length > 0) {
    const { data: artistasData } = await supabase
      .from('artistas')
      .select('artistas_relacionados')
      .in('id', topArtistas);

    const allRelatedSlugs = (artistasData || [])
      .flatMap(a => a.artistas_relacionados || [])
      .filter((slug: string, i: number, arr: string[]) => arr.indexOf(slug) === i);

    if (allRelatedSlugs.length > 0) {
      const { data: relacionados } = await supabase
        .from('artistas')
        .select('id')
        .in('slug', allRelatedSlugs.slice(0, 10));

      const relacionadosIds = (relacionados || []).map(r => r.id);

      if (relacionadosIds.length > 0) {
        const { data: deRelacionados } = await supabase
          .from('contenido')
          .select('*')
          .in('artista_id', relacionadosIds)
          .eq('publicado', true)
          .eq('eval_aprobado', true)
          .order('eval_puntuacion_total', { ascending: false })
          .limit(8);

        for (const c of deRelacionados || []) {
          if (yaEscuchados.has(c.id)) continue;
          if (recomendaciones.some(r => r.id === c.id)) continue;
          recomendaciones.push({
            id: c.id,
            titulo: c.titulo,
            artista: c.artista,
            thumbnail: c.thumbnail || '',
            url: c.url,
            genero_musical: c.genero_musical,
            energia: c.energia,
            categoria: c.categoria,
            eval_puntuacion_total: c.eval_puntuacion_total,
            razon: `Artista relacionado con tus favoritos`,
          });
        }
      }
    }
  }

  // If we still need more, fill with top-rated songs
  if (recomendaciones.length < 10) {
    const topGlobal = await recomendarTopGlobal();
    for (const c of topGlobal) {
      if (yaEscuchados.has(c.id)) continue;
      if (recomendaciones.some(r => r.id === c.id)) continue;
      recomendaciones.push({ ...c, razon: 'Popular en GospelPlay' });
      if (recomendaciones.length >= 20) break;
    }
  }

  // Sort by score and return top 20
  recomendaciones.sort((a, b) => b.eval_puntuacion_total - a.eval_puntuacion_total);
  return recomendaciones.slice(0, 20);
}

// Fallback: top-rated songs across all genres
async function recomendarTopGlobal(): Promise<Recomendacion[]> {
  const { data } = await supabase
    .from('contenido')
    .select('*')
    .eq('publicado', true)
    .eq('eval_aprobado', true)
    .order('eval_puntuacion_total', { ascending: false })
    .limit(20);

  return (data || []).map(c => ({
    id: c.id,
    titulo: c.titulo,
    artista: c.artista,
    thumbnail: c.thumbnail || '',
    url: c.url,
    genero_musical: c.genero_musical,
    energia: c.energia,
    categoria: c.categoria,
    eval_puntuacion_total: c.eval_puntuacion_total,
    razon: 'Mejor puntuado en GospelPlay',
  }));
}

export async function POST(request: NextRequest) {
  try {
    const { session_id, contenido_id } = await request.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Se requiere session_id' }, { status: 400 });
    }

    let recomendaciones: Recomendacion[];

    if (contenido_id) {
      // Recommend similar to a specific song
      recomendaciones = await recomendarSimilares(contenido_id, session_id);
    } else {
      // Recommend based on listening history
      recomendaciones = await recomendarPorHistorial(session_id);
    }

    // Update user preferences if we have history
    const { data: historial } = await supabase
      .from('historial_escucha')
      .select('genero, energia, categoria, artista_id, completada')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (historial && historial.length > 0) {
      const generos = historial.filter(h => h.completada && h.genero).map(h => h.genero);
      const categorias = historial.filter(h => h.completada && h.categoria).map(h => h.categoria);
      const energias = historial.filter(h => h.completada && h.energia).map(h => h.energia);
      const artistaIds = historial.filter(h => h.completada && h.artista_id).map(h => h.artista_id);

      await supabase
        .from('preferencias_usuario')
        .upsert({
          session_id,
          generos_favoritos: topPorFrecuencia(generos, 5),
          artistas_favoritos: topPorFrecuencia(artistaIds, 10),
          energia_preferida: topPorFrecuencia(energias, 1)[0] || 'media',
          categorias_favoritas: topPorFrecuencia(categorias, 5),
          ultima_actualizacion: new Date().toISOString(),
        }, { onConflict: 'session_id' })
        ;
    }

    return NextResponse.json({
      session_id,
      total: recomendaciones.length,
      recomendaciones,
    });
  } catch (error) {
    console.error('[Recomendaciones] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
