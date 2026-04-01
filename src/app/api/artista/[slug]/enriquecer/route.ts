import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const LASTFM_KEY = process.env.LASTFM_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizar(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function canalEsDelArtista(canalNombre: string, artistaNombre: string) {
  const canal = normalizar(canalNombre);
  const artista = normalizar(artistaNombre);
  if (canal === artista || canal.includes(artista)) return true;
  const canalLimpio = canal.replace(/(vevo|official|music|tv|topic|channel)$/g, '');
  if (canalLimpio === artista || canalLimpio.includes(artista) || artista.includes(canalLimpio)) return true;
  if (artista.length >= 6 && canalLimpio.startsWith(artista.substring(0, 6))) return true;
  return false;
}

const TITULO_BLACKLIST = [
  /\bmix\b/i, /\bplaylist\b/i, /\b\d+\s*hora/i, /\bfull\s*album\b/i,
  /\breaction\b/i, /\btutorial\b/i, /\bentrevista\b/i, /\binterview\b/i,
  /\bpodcast\b/i, /\btrailer\b/i, /\bkaraoke\b/i, /\bcompilation\b/i,
  /\bpredica\b/i, /\bsermon\b/i, /\bdocumentary\b/i, /\bbehind\s*the/i,
];

async function buscarVideosYouTube(query: string, max: number = 15) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const dataMatch = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    if (!dataMatch) return [];

    const ytData = JSON.parse(dataMatch[1]);
    const sections = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const results: { videoId: string; title: string; author: string }[] = [];

    for (const section of sections) {
      for (const item of (section?.itemSectionRenderer?.contents || [])) {
        const video = item.videoRenderer;
        if (!video?.videoId) continue;
        results.push({
          videoId: video.videoId,
          title: video.title?.runs?.[0]?.text || '',
          author: video.ownerText?.runs?.[0]?.text || '',
        });
        if (results.length >= max) break;
      }
      if (results.length >= max) break;
    }
    return results;
  } catch { return []; }
}

async function buscarArtwork(titulo: string, artista: string) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(`${artista} ${titulo}`)}&media=music&entity=song&limit=3`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.resultCount > 0) return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
    return null;
  } catch { return null; }
}

async function lastfmTopTracks(artistName: string) {
  if (!LASTFM_KEY) return [];
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json&limit=20`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.toptracks?.track || []).map((t: { name: string; listeners: string }) => ({
      name: t.name,
      listeners: parseInt(t.listeners || '0', 10),
    }));
  } catch { return []; }
}

async function lastfmSimilarArtists(artistName: string) {
  if (!LASTFM_KEY) return [];
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json&limit=15`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.similarartists?.artist || []).map((a: { name: string }) => a.name);
  } catch { return []; }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Get artist
  const { data: artista } = await supabase
    .from('artistas')
    .select('id, nombre, slug, generos')
    .eq('slug', slug)
    .single();

  if (!artista) {
    return NextResponse.json({ error: 'Artista no encontrado' }, { status: 404 });
  }

  // Get existing songs
  const { data: existingSongs } = await supabase
    .from('contenido')
    .select('id, titulo, url')
    .eq('artista_id', artista.id);

  const existingUrls = new Set((existingSongs || []).map(s => s.url));
  const existingTitles = new Set((existingSongs || []).map(s => normalizar(s.titulo)));
  const currentCount = existingSongs?.length || 0;

  // Get Last.fm top tracks for this artist
  const lastfmTracks = await lastfmTopTracks(artista.nombre);

  // Get similar artists from Last.fm
  const similarNames = await lastfmSimilarArtists(artista.nombre);

  // Match similar artists with our catalog
  const { data: allArtists } = await supabase
    .from('artistas')
    .select('id, nombre, slug, imagen')
    .eq('activo', true);

  const artistMap = new Map((allArtists || []).map(a => [a.nombre.toLowerCase(), a]));
  const similarInCatalog = similarNames
    .map((name: string) => artistMap.get(name.toLowerCase()))
    .filter((a: unknown): a is { id: string; nombre: string; slug: string; imagen: string } => !!a);

  // Update artistas_relacionados if we found new ones
  if (similarInCatalog.length > 0) {
    const relatedSlugs = similarInCatalog.slice(0, 10).map((a: { slug: string }) => a.slug);
    await supabase
      .from('artistas')
      .update({ artistas_relacionados: relatedSlugs })
      .eq('id', artista.id);
  }

  // Find tracks we're missing: Last.fm top tracks not in our catalog
  const missingTracks = lastfmTracks.filter((t: { name: string }) =>
    !existingTitles.has(normalizar(t.name))
  );

  // Search YouTube for missing tracks (max 8 new songs per request)
  const maxNew = 8;
  let added = 0;
  const newSongs: { titulo: string; url: string; thumbnail: string }[] = [];

  // Strategy 1: Search for specific Last.fm top tracks
  for (const track of missingTracks) {
    if (added >= maxNew) break;

    const videos = await buscarVideosYouTube(`"${artista.nombre}" "${track.name}"`, 5);
    const oficial = videos.find(v =>
      canalEsDelArtista(v.author, artista.nombre) &&
      !TITULO_BLACKLIST.some(re => re.test(v.title))
    );

    if (!oficial) continue;

    const url = `https://www.youtube.com/watch?v=${oficial.videoId}`;
    if (existingUrls.has(url)) continue;

    const artwork = await buscarArtwork(track.name, artista.nombre);
    const thumbnail = artwork || `https://img.youtube.com/vi/${oficial.videoId}/hqdefault.jpg`;
    const genero = artista.generos?.[0] || 'worship';

    const { error } = await supabase.from('contenido').insert({
      url,
      plataforma: 'youtube',
      titulo: track.name,
      artista: artista.nombre,
      artista_id: artista.id,
      descripcion: `${track.name} - ${artista.nombre}`,
      thumbnail,
      duracion: '',
      tipo: 'musica',
      categoria: 'adoracion',
      genero_musical: genero,
      es_congregacional: genero === 'worship',
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
      eval_notas: 'Auto-agregado desde Last.fm top tracks',
      pasajes: [],
      temas: ['adoracion', 'fe'],
      versiculos_clave: [],
      personajes: [],
      doctrina: [],
      apto_para: ['culto dominical'],
      audiencia: ['todo publico'],
      publicado: true,
      revisado_por_ia: false,
    });

    if (!error) {
      existingUrls.add(url);
      added++;
      newSongs.push({ titulo: track.name, url, thumbnail });
    }
  }

  // Strategy 2: If still under 8, search general YouTube for more
  if (added < maxNew) {
    const videos = await buscarVideosYouTube(`"${artista.nombre}" official music video`, 20);
    for (const video of videos) {
      if (added >= maxNew) break;
      if (!canalEsDelArtista(video.author, artista.nombre)) continue;
      if (TITULO_BLACKLIST.some(re => re.test(video.title))) continue;

      const url = `https://www.youtube.com/watch?v=${video.videoId}`;
      if (existingUrls.has(url)) continue;

      // Clean title
      let titulo = video.title
        .replace(/\(official\s*(music\s*)?video\)/gi, '')
        .replace(/\(video\s*oficial\)/gi, '')
        .replace(/\(official\s*audio\)/gi, '')
        .replace(/\(lyric\s*video\)/gi, '')
        .replace(/\[official.*?\]/gi, '')
        .replace(/\|.*/g, '')
        .trim();

      // Remove artist name from title if at start
      const dashMatch = titulo.match(/^(.+?)\s*[-–]\s+(.+)$/);
      if (dashMatch) {
        const part = dashMatch[1].trim();
        if (normalizar(part).includes(normalizar(artista.nombre).substring(0, 5))) {
          titulo = dashMatch[2].trim();
        }
      }

      if (existingTitles.has(normalizar(titulo))) continue;

      const artwork = await buscarArtwork(titulo, artista.nombre);
      const thumbnail = artwork || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
      const genero = artista.generos?.[0] || 'worship';

      const { error } = await supabase.from('contenido').insert({
        url,
        plataforma: 'youtube',
        titulo,
        artista: artista.nombre,
        artista_id: artista.id,
        descripcion: `${titulo} - ${artista.nombre}`,
        thumbnail,
        duracion: '',
        tipo: 'musica',
        categoria: 'adoracion',
        genero_musical: genero,
        es_congregacional: genero === 'worship',
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
        eval_notas: 'Auto-agregado desde YouTube',
        pasajes: [],
        temas: ['adoracion', 'fe'],
        versiculos_clave: [],
        personajes: [],
        doctrina: [],
        apto_para: ['culto dominical'],
        audiencia: ['todo publico'],
        publicado: true,
        revisado_por_ia: false,
      });

      if (!error) {
        existingUrls.add(url);
        existingTitles.add(normalizar(titulo));
        added++;
        newSongs.push({ titulo, url, thumbnail });
      }
    }
  }

  return NextResponse.json({
    artista: artista.nombre,
    cancionesAntes: currentCount,
    cancionesAgregadas: added,
    cancionesAhora: currentCount + added,
    nuevas: newSongs,
    similaresEnCatalogo: similarInCatalog.length,
    similares: similarInCatalog.slice(0, 10).map((a: { nombre: string; slug: string }) => ({ nombre: a.nombre, slug: a.slug })),
  });
}
