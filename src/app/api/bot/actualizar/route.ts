import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buscarYouTube, filtrarOficiales } from '@/lib/youtube-search';
import { limpiarMetadata } from '@/lib/limpiar-metadata';
import { buscarArtworkCancion, buscarImagenArtista } from '@/lib/artwork';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Classify content using Claude AI (same pattern as poblar)
async function clasificarConIA(titulo: string, artista: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'tu-api-key-aqui') {
    return {
      tipo: 'musica',
      categoria: 'adoracion',
      genero_musical: 'worship',
      es_congregacional: true,
      tiene_mensaje: true,
      es_instrumental: false,
      momento_del_culto: 'adoracion_profunda',
      energia: 'media',
      nivel: 'basico',
      eval_cristocentrico: 85,
      eval_fidelidad_biblica: 85,
      eval_profundidad: 80,
      eval_edificante: 88,
      eval_doctrina_sana: 85,
      eval_puntuacion_total: 85,
      eval_aprobado: true,
      eval_notas: 'Clasificacion automatica',
      pasajes: [],
      temas: ['adoracion', 'fe'],
      apto_para: ['culto dominical'],
      audiencia: ['todo publico'],
    };
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: `Eres un experto en musica cristiana. Clasifica la cancion y devuelve SOLO un JSON valido con estos campos:
{
  "tipo": "musica|predicacion|estudio_biblico",
  "categoria": "adoracion|alabanza|evangelistico|motivacional|doctrina|devocional",
  "genero_musical": "worship|pop_cristiano|rock_cristiano|balada_cristiana|reggaeton_cristiano|hip_hop_cristiano|salsa_cristiana|himnos_clasicos|soaking|instrumental",
  "es_congregacional": true/false,
  "momento_del_culto": "apertura|alabanza_energica|adoracion_profunda|altar|cierre",
  "energia": "baja|media|alta",
  "eval_cristocentrico": 0-100,
  "eval_fidelidad_biblica": 0-100,
  "eval_profundidad": 0-100,
  "eval_edificante": 0-100,
  "eval_doctrina_sana": 0-100,
  "temas": ["tema1", "tema2"],
  "pasajes": ["Versiculo 1:1"]
}`,
        messages: [{ role: 'user', content: `Clasifica: "${titulo}" de ${artista}` }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    const total = Math.round(
      ((parsed.eval_cristocentrico || 85) +
        (parsed.eval_fidelidad_biblica || 85) +
        (parsed.eval_profundidad || 80) +
        (parsed.eval_edificante || 85) +
        (parsed.eval_doctrina_sana || 85)) / 5
    );

    return {
      tipo: parsed.tipo || 'musica',
      categoria: parsed.categoria || 'adoracion',
      genero_musical: parsed.genero_musical || 'worship',
      es_congregacional: parsed.es_congregacional ?? true,
      tiene_mensaje: true,
      es_instrumental: false,
      momento_del_culto: parsed.momento_del_culto || 'adoracion_profunda',
      energia: parsed.energia || 'media',
      nivel: 'basico',
      eval_cristocentrico: parsed.eval_cristocentrico || 85,
      eval_fidelidad_biblica: parsed.eval_fidelidad_biblica || 85,
      eval_profundidad: parsed.eval_profundidad || 80,
      eval_edificante: parsed.eval_edificante || 85,
      eval_doctrina_sana: parsed.eval_doctrina_sana || 85,
      eval_puntuacion_total: total,
      eval_aprobado: total >= 70,
      eval_notas: 'Clasificado por IA (bot actualizar)',
      pasajes: parsed.pasajes || [],
      temas: parsed.temas || [],
      apto_para: ['culto dominical'],
      audiencia: ['todo publico'],
    };
  } catch {
    return null;
  }
}

interface ArtistaStats {
  artista: string;
  slug: string;
  canciones_nuevas: number;
  imagen_actualizada: boolean;
}

async function actualizarArtista(artista: {
  id: string;
  nombre: string;
  slug: string;
  tipo: string;
  youtube_canal: string;
  imagen: string;
}): Promise<ArtistaStats> {
  const stats: ArtistaStats = {
    artista: artista.nombre,
    slug: artista.slug,
    canciones_nuevas: 0,
    imagen_actualizada: false,
  };

  // Search for latest videos
  const searchQuery = artista.tipo === 'pastor' || artista.tipo === 'predicador'
    ? `${artista.nombre} predicacion completa 2025 2026`
    : `${artista.nombre} official video 2025 2026`;

  const rawVideos = await buscarYouTube(searchQuery, 10);
  const videos = filtrarOficiales(rawVideos, artista.nombre, artista.youtube_canal || '');

  for (const video of videos) {
    if (stats.canciones_nuevas >= 5) break;

    const url = `https://www.youtube.com/watch?v=${video.videoId}`;

    // Check if already exists in contenido
    const { data: yaExiste } = await supabase
      .from('contenido')
      .select('id')
      .eq('url', url)
      .single();

    if (yaExiste) continue;

    // Clean metadata
    const { track, artist } = limpiarMetadata(video.title, video.author);

    // Get artwork
    const artwork = await buscarArtworkCancion(track, artist || artista.nombre);
    const thumbnail = artwork || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

    // Classify with AI
    const clasificacion = await clasificarConIA(track, artist || artista.nombre);
    if (!clasificacion) continue;

    // Save to DB
    const { error: insertError } = await supabase.from('contenido').insert({
      url,
      plataforma: 'youtube',
      titulo: track,
      artista: artist || artista.nombre,
      artista_id: artista.id,
      descripcion: `${track} - ${artist || artista.nombre}`,
      thumbnail,
      duracion: '',
      ...clasificacion,
      versiculos_clave: [],
      personajes: [],
      doctrina: [],
      publicado: true,
      revisado_por_ia: true,
    });

    if (!insertError) {
      stats.canciones_nuevas++;
      console.log(`[Actualizar] + ${artista.nombre}: ${track}`);
    }

    // Small delay
    await new Promise(r => setTimeout(r, 500));
  }

  // Update artist image if missing
  if (!artista.imagen) {
    const imagen = await buscarImagenArtista(artista.nombre);
    if (imagen) {
      const { error: updateError } = await supabase
        .from('artistas')
        .update({ imagen })
        .eq('id', artista.id);

      if (!updateError) {
        stats.imagen_actualizada = true;
        console.log(`[Actualizar] Imagen actualizada: ${artista.nombre}`);
      }
    }
  }

  return stats;
}

// POST: Manual trigger
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { artista_slug } = body as { artista_slug?: string };

    let artistas;

    if (artista_slug) {
      // Update a specific artist
      const { data, error } = await supabase
        .from('artistas')
        .select('id, nombre, slug, tipo, youtube_canal, imagen')
        .eq('slug', artista_slug)
        .eq('activo', true)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: `Artista no encontrado: ${artista_slug}` }, { status: 404 });
      }
      artistas = [data];
    } else {
      // Get all active artists
      const { data, error } = await supabase
        .from('artistas')
        .select('id, nombre, slug, tipo, youtube_canal, imagen')
        .eq('activo', true)
        .order('nombre');

      if (error || !data) {
        return NextResponse.json({ error: 'No se pudieron obtener artistas' }, { status: 500 });
      }
      artistas = data;
    }

    console.log(`[Actualizar] Procesando ${artistas.length} artistas...`);

    const resultados: ArtistaStats[] = [];

    for (const artista of artistas) {
      const stats = await actualizarArtista(artista);
      resultados.push(stats);

      // Delay between artists to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }

    const totalCanciones = resultados.reduce((sum, r) => sum + r.canciones_nuevas, 0);
    const totalImagenes = resultados.filter(r => r.imagen_actualizada).length;
    const artistasConNuevo = resultados.filter(r => r.canciones_nuevas > 0);

    // Log the bot run
    await supabase.from('bot_log').insert({
      tipo: 'actualizar',
      detalles: {
        artistas_procesados: artistas.length,
        canciones_nuevas: totalCanciones,
        imagenes_actualizadas: totalImagenes,
      },
    });

    return NextResponse.json({
      exito: true,
      artistas_procesados: artistas.length,
      canciones_nuevas: totalCanciones,
      imagenes_actualizadas: totalImagenes,
      artistas_con_contenido_nuevo: artistasConNuevo.map(r => ({
        artista: r.artista,
        canciones: r.canciones_nuevas,
      })),
      detalle: resultados,
    });
  } catch (error) {
    console.error('[Actualizar] Error:', error);
    return NextResponse.json({ error: 'Error interno en bot actualizar' }, { status: 500 });
  }
}

// GET: Cron trigger (Vercel crons use GET)
export async function GET() {
  try {
    const { data: artistas, error } = await supabase
      .from('artistas')
      .select('id, nombre, slug, tipo, youtube_canal, imagen')
      .eq('activo', true)
      .order('nombre');

    if (error || !artistas) {
      return NextResponse.json({ error: 'No se pudieron obtener artistas' }, { status: 500 });
    }

    console.log(`[Actualizar CRON] Procesando ${artistas.length} artistas...`);

    const resultados: ArtistaStats[] = [];

    for (const artista of artistas) {
      const stats = await actualizarArtista(artista);
      resultados.push(stats);
      await new Promise(r => setTimeout(r, 1000));
    }

    const totalCanciones = resultados.reduce((sum, r) => sum + r.canciones_nuevas, 0);
    const totalImagenes = resultados.filter(r => r.imagen_actualizada).length;

    await supabase.from('bot_log').insert({
      tipo: 'actualizar_cron',
      detalles: {
        artistas_procesados: artistas.length,
        canciones_nuevas: totalCanciones,
        imagenes_actualizadas: totalImagenes,
      },
    });

    return NextResponse.json({
      exito: true,
      artistas_procesados: artistas.length,
      canciones_nuevas: totalCanciones,
      imagenes_actualizadas: totalImagenes,
    });
  } catch (error) {
    console.error('[Actualizar CRON] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
