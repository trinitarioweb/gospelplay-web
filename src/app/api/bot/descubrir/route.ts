import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buscarYouTube, filtrarOficiales, esTituloCompilacion } from '@/lib/youtube-search';
import { limpiarMetadata } from '@/lib/limpiar-metadata';
import { buscarArtworkCancion, buscarImagenArtista } from '@/lib/artwork';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Discovery search queries by genre
const DISCOVERY_QUERIES: Record<string, string> = {
  'worship_espanol': 'musica cristiana worship 2025 2026 nuevo',
  'worship_english': 'christian worship new release official',
  'pop_cristiano': 'pop cristiano nuevo official video',
  'rock_cristiano': 'rock cristiano banda oficial',
  'reggaeton_cristiano': 'reggaeton cristiano nuevo oficial 2025 2026',
  'hip_hop_cristiano': 'hip hop cristiano rap cristiano nuevo',
  'salsa_cristiana': 'salsa cristiana gospel tropical',
  'predicadores': 'predicacion cristiana sermon 2025 2026',
};

function generarSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Generate a short bio for a new artist using Claude AI
async function generarBioArtista(nombre: string, genero: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'tu-api-key-aqui') {
    return `Artista de musica cristiana.`;
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
        max_tokens: 300,
        system: 'Eres un experto en musica cristiana. Genera una biografia corta (2-3 oraciones) en espanol para el artista cristiano dado. Si no lo conoces, genera una bio generica apropiada basada en su genero musical. Responde SOLO con la bio, sin comillas ni formato extra.',
        messages: [{ role: 'user', content: `Bio para: ${nombre} (genero: ${genero})` }],
      }),
    });

    if (!res.ok) return `Artista de musica cristiana.`;
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || `Artista de musica cristiana.`;
  } catch {
    return `Artista de musica cristiana.`;
  }
}

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
      eval_notas: 'Clasificado por IA (bot descubrir)',
      pasajes: parsed.pasajes || [],
      temas: parsed.temas || [],
      apto_para: ['culto dominical'],
      audiencia: ['todo publico'],
    };
  } catch {
    return null;
  }
}

async function descubrirPorGenero(generoKey: string, query: string) {
  const stats = { artistas_nuevos: 0, canciones_agregadas: 0, genero: generoKey };

  console.log(`[Descubrir] Buscando: "${query}"...`);
  const videos = await buscarYouTube(query, 15);

  if (!videos.length) {
    console.log(`[Descubrir] Sin resultados para "${query}"`);
    return stats;
  }

  // Group videos by channel (potential new artists)
  const canalesProcesados = new Set<string>();

  for (const video of videos) {
    // Only consider verified channels
    if (!video.channelVerified) continue;

    // Skip compilations
    if (esTituloCompilacion(video.title)) continue;

    // Skip if we already processed this channel in this run
    if (canalesProcesados.has(video.channelId)) continue;
    canalesProcesados.add(video.channelId);

    const artistName = video.author
      .replace(/VEVO$/i, '')
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/\s+(Official|Music|TV)$/i, '')
      .trim();

    const slug = generarSlug(artistName);
    if (!slug) continue;

    // Check if artist already exists
    const { data: existente } = await supabase
      .from('artistas')
      .select('id, slug')
      .eq('slug', slug)
      .single();

    if (existente) {
      console.log(`[Descubrir] Artista ya existe: ${artistName}`);
      continue;
    }

    // Map genre key to DB genre values
    const generoMap: Record<string, string> = {
      'worship_espanol': 'worship',
      'worship_english': 'worship',
      'pop_cristiano': 'pop_cristiano',
      'rock_cristiano': 'rock_cristiano',
      'reggaeton_cristiano': 'reggaeton_cristiano',
      'hip_hop_cristiano': 'hip_hop_cristiano',
      'salsa_cristiana': 'salsa_cristiana',
      'predicadores': 'predicacion',
    };

    const tipoMap: Record<string, string> = {
      'predicadores': 'predicador',
    };

    // Generate bio
    const bio = await generarBioArtista(artistName, generoKey);

    // Get artist image
    const imagen = await buscarImagenArtista(artistName);

    // Create new artist
    const { data: nuevoArtista, error: insertError } = await supabase
      .from('artistas')
      .insert({
        nombre: artistName,
        slug,
        bio,
        imagen: imagen || '',
        banner: '',
        pais: '',
        generos: [generoMap[generoKey] || 'worship'],
        tipo: tipoMap[generoKey] || 'artista',
        youtube_canal: artistName,
        spotify_id: '',
        artistas_relacionados: [],
        seguidores: 0,
        verificado: false,
        activo: true,
      })
      .select()
      .single();

    if (insertError || !nuevoArtista) {
      console.error(`[Descubrir] Error creando artista ${artistName}:`, insertError?.message);
      continue;
    }

    console.log(`[Descubrir] Nuevo artista: ${artistName} (${slug})`);
    stats.artistas_nuevos++;

    // Now search for this artist's songs
    const searchQuery = tipoMap[generoKey]
      ? `${artistName} predicacion completa`
      : `${artistName} official video`;

    const artistVideos = await buscarYouTube(searchQuery, 15);
    const oficiales = filtrarOficiales(artistVideos, artistName, artistName);

    let cancionesAgregadas = 0;
    for (const songVideo of oficiales) {
      if (cancionesAgregadas >= 5) break;

      const url = `https://www.youtube.com/watch?v=${songVideo.videoId}`;

      // Check if already exists
      const { data: yaExiste } = await supabase
        .from('contenido')
        .select('id')
        .eq('url', url)
        .single();

      if (yaExiste) continue;

      // Clean metadata
      const { track, artist } = limpiarMetadata(songVideo.title, songVideo.author);

      // Get artwork
      const artwork = await buscarArtworkCancion(track, artist || artistName);
      const thumbnail = artwork || `https://img.youtube.com/vi/${songVideo.videoId}/hqdefault.jpg`;

      // Classify with AI
      const clasificacion = await clasificarConIA(track, artist || artistName);
      if (!clasificacion) continue;

      // Save to DB
      const { error: songError } = await supabase.from('contenido').insert({
        url,
        plataforma: 'youtube',
        titulo: track,
        artista: artist || artistName,
        artista_id: nuevoArtista.id,
        descripcion: `${track} - ${artist || artistName}`,
        thumbnail,
        duracion: '',
        ...clasificacion,
        versiculos_clave: [],
        personajes: [],
        doctrina: [],
        publicado: true,
        revisado_por_ia: true,
      });

      if (!songError) {
        cancionesAgregadas++;
        stats.canciones_agregadas++;
        console.log(`[Descubrir] + ${track}`);
      }

      // Small delay
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return stats;
}

// POST: Manual trigger with optional genre filter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { genero, idioma } = body as { genero?: string; idioma?: string };

    const resultados: Array<{ artistas_nuevos: number; canciones_agregadas: number; genero: string }> = [];

    if (genero) {
      // Search specific genre
      const query = DISCOVERY_QUERIES[genero];
      if (!query) {
        return NextResponse.json(
          { error: `Genero no reconocido: ${genero}. Disponibles: ${Object.keys(DISCOVERY_QUERIES).join(', ')}` },
          { status: 400 }
        );
      }
      const stats = await descubrirPorGenero(genero, query);
      resultados.push(stats);
    } else {
      // Search all genres (optionally filtered by language)
      const entries = Object.entries(DISCOVERY_QUERIES).filter(([key]) => {
        if (idioma === 'espanol') return !key.includes('english');
        if (idioma === 'english') return key.includes('english');
        return true;
      });

      for (const [generoKey, query] of entries) {
        const stats = await descubrirPorGenero(generoKey, query);
        resultados.push(stats);
        // Delay between genres
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    const totalArtistas = resultados.reduce((sum, r) => sum + r.artistas_nuevos, 0);
    const totalCanciones = resultados.reduce((sum, r) => sum + r.canciones_agregadas, 0);
    const generosSearched = resultados.map(r => r.genero);

    // Log the bot run
    await supabase.from('bot_log').insert({
      tipo: 'descubrir',
      detalles: { artistas_nuevos: totalArtistas, canciones_agregadas: totalCanciones, generos: generosSearched },
    });

    return NextResponse.json({
      exito: true,
      artistas_nuevos: totalArtistas,
      canciones_agregadas: totalCanciones,
      generos_buscados: generosSearched,
      detalle: resultados,
    });
  } catch (error) {
    console.error('[Descubrir] Error:', error);
    return NextResponse.json({ error: 'Error interno en bot descubrir' }, { status: 500 });
  }
}

// GET: Cron trigger (Vercel crons use GET)
export async function GET() {
  try {
    const resultados: Array<{ artistas_nuevos: number; canciones_agregadas: number; genero: string }> = [];

    for (const [generoKey, query] of Object.entries(DISCOVERY_QUERIES)) {
      const stats = await descubrirPorGenero(generoKey, query);
      resultados.push(stats);
      await new Promise(r => setTimeout(r, 1000));
    }

    const totalArtistas = resultados.reduce((sum, r) => sum + r.artistas_nuevos, 0);
    const totalCanciones = resultados.reduce((sum, r) => sum + r.canciones_agregadas, 0);

    await supabase.from('bot_log').insert({
      tipo: 'descubrir_cron',
      detalles: { artistas_nuevos: totalArtistas, canciones_agregadas: totalCanciones },
    });

    return NextResponse.json({
      exito: true,
      artistas_nuevos: totalArtistas,
      canciones_agregadas: totalCanciones,
      detalle: resultados,
    });
  } catch (error) {
    console.error('[Descubrir CRON] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
