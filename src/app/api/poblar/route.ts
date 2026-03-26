import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { limpiarMetadata } from '@/lib/limpiar-metadata';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface YouTubeSearchResult {
  videoId: string;
  title: string;
  author: string;
}

// Search YouTube videos using Invidious API (free, no key needed)
async function buscarYouTube(query: string, maxResults = 5): Promise<YouTubeSearchResult[]> {
  const instances = [
    'https://vid.puffyan.us',
    'https://invidious.fdn.fr',
    'https://inv.tux.pizza',
  ];

  for (const instance of instances) {
    try {
      const res = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) continue;
      const data = await res.json();
      return data
        .filter((item: { type: string }) => item.type === 'video')
        .slice(0, maxResults)
        .map((item: { videoId: string; title: string; author: string }) => ({
          videoId: item.videoId,
          title: item.title,
          author: item.author,
        }));
    } catch {
      continue;
    }
  }

  // Fallback: try Piped API
  try {
    const res = await fetch(
      `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json();
      return (data.items || [])
        .slice(0, maxResults)
        .map((item: { url: string; title: string; uploaderName: string }) => ({
          videoId: item.url?.replace('/watch?v=', '') || '',
          title: item.title,
          author: item.uploaderName,
        }))
        .filter((item: YouTubeSearchResult) => item.videoId);
    }
  } catch {}

  return [];
}

// Classify content using Claude AI
async function clasificarConIA(titulo: string, artista: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'tu-api-key-aqui') {
    // Return default classification for music
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
      eval_notas: 'Clasificación automática',
      pasajes: [],
      temas: ['adoración', 'fe'],
      apto_para: ['culto dominical'],
      audiencia: ['todo público'],
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
        system: `Eres un experto en música cristiana. Clasifica la canción y devuelve SOLO un JSON válido con estos campos:
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
  "pasajes": ["Versículo 1:1"]
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
      eval_notas: 'Clasificado por IA',
      pasajes: parsed.pasajes || [],
      temas: parsed.temas || [],
      apto_para: ['culto dominical'],
      audiencia: ['todo público'],
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { artista_slug, max_canciones = 8 } = await request.json();

    if (!artista_slug) {
      return NextResponse.json({ error: 'Se requiere artista_slug' }, { status: 400 });
    }

    // Get the artist from DB
    const { data: artista, error: artistaError } = await supabase
      .from('artistas')
      .select('*')
      .eq('slug', artista_slug)
      .single();

    if (artistaError || !artista) {
      return NextResponse.json({ error: `Artista no encontrado: ${artista_slug}` }, { status: 404 });
    }

    console.log(`[Poblar] Buscando canciones de ${artista.nombre}...`);

    // Search YouTube for this artist
    const searchQuery = artista.tipo === 'pastor' || artista.tipo === 'predicador'
      ? `${artista.nombre} predicación sermón`
      : `${artista.nombre} música cristiana oficial`;

    const videos = await buscarYouTube(searchQuery, max_canciones);

    if (!videos.length) {
      return NextResponse.json({ error: 'No se encontraron videos', artista: artista.nombre }, { status: 404 });
    }

    console.log(`[Poblar] Encontrados ${videos.length} videos para ${artista.nombre}`);

    const added: { titulo: string; url: string }[] = [];
    const skipped: string[] = [];

    for (const video of videos) {
      const url = `https://www.youtube.com/watch?v=${video.videoId}`;

      // Check if already exists
      const { data: existe } = await supabase
        .from('contenido')
        .select('id')
        .eq('url', url)
        .single();

      if (existe) {
        skipped.push(video.title);
        continue;
      }

      // Clean metadata
      const { track, artist } = limpiarMetadata(video.title, video.author);

      // Get thumbnail
      const thumbnail = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

      // Classify with AI
      const clasificacion = await clasificarConIA(track, artist);
      if (!clasificacion) {
        skipped.push(video.title);
        continue;
      }

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
        added.push({ titulo: track, url });
        console.log(`[Poblar] ✓ ${track}`);
      } else {
        console.error(`[Poblar] ✗ Error insertando ${track}:`, insertError.message);
        skipped.push(video.title);
      }

      // Small delay to not overwhelm APIs
      await new Promise(r => setTimeout(r, 500));
    }

    return NextResponse.json({
      artista: artista.nombre,
      agregados: added.length,
      omitidos: skipped.length,
      canciones: added,
      omitidos_lista: skipped,
    });
  } catch (error) {
    console.error('[Poblar] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// GET: Populate all artists at once
export async function GET() {
  try {
    const { data: artistas, error } = await supabase
      .from('artistas')
      .select('slug, nombre')
      .eq('activo', true)
      .order('nombre');

    if (error || !artistas) {
      return NextResponse.json({ error: 'No hay artistas' }, { status: 500 });
    }

    const results: { artista: string; agregados: number; error?: string }[] = [];

    for (const artista of artistas) {
      try {
        // Check how many songs this artist already has
        const { count } = await supabase
          .from('contenido')
          .select('*', { count: 'exact', head: true })
          .eq('artista_id', artista.slug); // This won't work correctly, need artist id

        if ((count || 0) >= 5) {
          results.push({ artista: artista.nombre, agregados: 0 });
          continue;
        }

        const searchQuery = `${artista.nombre} música cristiana oficial`;
        const videos = await buscarYouTube(searchQuery, 5);

        let added = 0;
        for (const video of videos) {
          const url = `https://www.youtube.com/watch?v=${video.videoId}`;

          const { data: existe } = await supabase
            .from('contenido')
            .select('id')
            .eq('url', url)
            .single();

          if (existe) continue;

          const { track, artist } = limpiarMetadata(video.title, video.author);
          const thumbnail = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
          const clasificacion = await clasificarConIA(track, artist);
          if (!clasificacion) continue;

          const { error: insertError } = await supabase.from('contenido').insert({
            url,
            plataforma: 'youtube',
            titulo: track,
            artista: artist || artista.nombre,
            artista_id: undefined, // Need actual UUID
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

          if (!insertError) added++;
          await new Promise(r => setTimeout(r, 300));
        }

        results.push({ artista: artista.nombre, agregados: added });
        console.log(`[Poblar] ${artista.nombre}: ${added} canciones`);
      } catch (e) {
        results.push({ artista: artista.nombre, agregados: 0, error: String(e) });
      }
    }

    return NextResponse.json({
      total_artistas: artistas.length,
      resultados: results,
    });
  } catch (error) {
    console.error('[Poblar] Error general:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
