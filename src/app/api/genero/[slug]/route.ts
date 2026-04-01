import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const LASTFM_KEY = process.env.LASTFM_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Map our genre keys to Last.fm tags
const GENRE_TO_LASTFM_TAGS: Record<string, string[]> = {
  worship: ['worship', 'praise and worship', 'praise'],
  pop_cristiano: ['christian pop', 'ccm', 'contemporary christian'],
  rock_cristiano: ['christian rock', 'christian alternative'],
  hip_hop_cristiano: ['christian hip-hop', 'christian rap'],
  reggaeton_cristiano: ['reggaeton cristiano', 'latin christian'],
  balada_cristiana: ['christian', 'cristiano'],
  himnos_clasicos: ['hymns', 'christian hymns'],
  salsa_cristiana: ['salsa cristiana', 'latin gospel'],
  soaking: ['soaking', 'worship ambient'],
};

const GENRE_CLASIFICACION: Record<string, string> = {
  worship: 'worship',
  pop_cristiano: 'pop_cristiano',
  rock_cristiano: 'rock_cristiano',
  hip_hop_cristiano: 'hip_hop_cristiano',
  reggaeton_cristiano: 'reggaeton_cristiano',
  balada_cristiana: 'balada_cristiana',
  himnos_clasicos: 'himnos_clasicos',
  salsa_cristiana: 'salsa_cristiana',
  soaking: 'soaking',
};

interface LastfmTrack {
  name: string;
  artist: { name: string };
  listeners?: string;
  playcount?: string;
}

interface LastfmArtist {
  name: string;
  listeners?: string;
  playcount?: string;
}

async function lastfmFetch(method: string, params: Record<string, string>) {
  if (!LASTFM_KEY) return null;
  const query = new URLSearchParams({
    method,
    api_key: LASTFM_KEY,
    format: 'json',
    ...params,
  });
  try {
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${query}`, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── YouTube search (server-side scraping) ──

function normalizar(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function canalEsDelArtista(canalNombre: string, artistaNombre: string) {
  const canal = normalizar(canalNombre);
  const artista = normalizar(artistaNombre);
  if (canal === artista) return true;
  if (canal.includes(artista)) return true;
  const canalLimpio = canal.replace(/(vevo|official|music|tv|topic|channel)$/g, '');
  if (canalLimpio === artista || canalLimpio.includes(artista) || artista.includes(canalLimpio)) return true;
  if (artista.length >= 6) {
    const minLen = Math.min(artista.length, 6);
    if (canalLimpio.startsWith(artista.substring(0, minLen)) && canalLimpio.length < artista.length + 10) return true;
  }
  return false;
}

const TITULO_BLACKLIST = [
  /\bmix\b/i, /\bplaylist\b/i, /\b\d+\s*hora/i, /\bfull\s*album\b/i,
  /\breaction\b/i, /\btutorial\b/i, /\bentrevista\b/i, /\binterview\b/i,
  /\bpodcast\b/i, /\btrailer\b/i, /\bkaraoke\b/i, /\bcompilation\b/i,
  /\bpredica\b/i, /\bsermon\b/i, /\bdocumentary\b/i,
];

async function buscarVideoYouTube(artistName: string, trackName: string): Promise<{ videoId: string; title: string; thumbnail: string } | null> {
  try {
    const query = `"${artistName}" "${trackName}" official`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const dataMatch = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    if (!dataMatch) return null;

    const ytData = JSON.parse(dataMatch[1]);
    const sections = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    for (const section of sections) {
      for (const item of (section?.itemSectionRenderer?.contents || [])) {
        const video = item.videoRenderer;
        if (!video?.videoId) continue;

        const title = video.title?.runs?.[0]?.text || '';
        const author = video.ownerText?.runs?.[0]?.text || '';

        // Must be from artist's channel
        if (!canalEsDelArtista(author, artistName)) continue;
        // Must not be blacklisted
        if (TITULO_BLACKLIST.some(re => re.test(title))) continue;

        return {
          videoId: video.videoId,
          title,
          thumbnail: `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function buscarArtwork(titulo: string, artista: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(`${artista} ${titulo}`)}&media=music&entity=song&limit=3`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.resultCount > 0) return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
    return null;
  } catch {
    return null;
  }
}

// ── Main handler ──

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tags = GENRE_TO_LASTFM_TAGS[slug];
  const generoMusical = GENRE_CLASIFICACION[slug] || slug;

  if (!tags) {
    return NextResponse.json({ error: 'Género no encontrado' }, { status: 404 });
  }

  // Get all our artists and content
  const [{ data: artistas }, { data: contenido }] = await Promise.all([
    supabase.from('artistas').select('id, nombre, slug, imagen, generos, tipo').eq('activo', true),
    supabase.from('contenido').select('*').eq('publicado', true),
  ]);

  const artistaMap = new Map((artistas || []).map(a => [a.nombre.toLowerCase(), a]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contenidoByArtist = new Map<string, any[]>();
  for (const c of contenido || []) {
    const key = c.artista_id;
    if (!contenidoByArtist.has(key)) contenidoByArtist.set(key, []);
    contenidoByArtist.get(key)!.push(c);
  }

  // All existing URLs for dedup
  const existingUrls = new Set((contenido || []).map(c => c.url));

  // Fetch Last.fm data
  const primaryTag = tags[0];
  const [topTracksData, topArtistsData] = await Promise.all([
    lastfmFetch('tag.gettoptracks', { tag: primaryTag, limit: '50' }),
    lastfmFetch('tag.gettopartists', { tag: primaryTag, limit: '30' }),
  ]);

  const lastfmTracks: LastfmTrack[] = topTracksData?.tracks?.track || [];
  const lastfmArtists: LastfmArtist[] = topArtistsData?.topartists?.artist || [];

  // Process tracks - match with catalog, auto-fill missing ones
  const topTracksMatched: Array<{
    titulo: string;
    artista: string;
    listeners: number;
    enCatalogo: boolean;
    contenidoId?: string;
    thumbnail?: string;
  }> = [];

  const tracksToAdd: Array<{
    trackName: string;
    artistName: string;
    artistId: string;
    listeners: number;
  }> = [];

  for (const track of lastfmTracks) {
    const artistLower = track.artist.name.toLowerCase();
    const nuestroArtista = artistaMap.get(artistLower);
    const listeners = parseInt(track.listeners || '0', 10);

    if (nuestroArtista) {
      const artistContent = contenidoByArtist.get(nuestroArtista.id) || [];
      const trackLower = track.name.toLowerCase();
      const match = artistContent.find((c: { titulo: string }) =>
        c.titulo.toLowerCase().includes(trackLower) ||
        trackLower.includes(c.titulo.toLowerCase())
      );

      if (match) {
        topTracksMatched.push({
          titulo: match.titulo,
          artista: nuestroArtista.nombre,
          listeners,
          enCatalogo: true,
          contenidoId: match.id,
          thumbnail: match.thumbnail,
        });
      } else {
        // Artist exists but track doesn't → queue for auto-add
        tracksToAdd.push({
          trackName: track.name,
          artistName: nuestroArtista.nombre,
          artistId: nuestroArtista.id,
          listeners,
        });
      }
    } else {
      topTracksMatched.push({
        titulo: track.name,
        artista: track.artist.name,
        listeners,
        enCatalogo: false,
      });
    }
  }

  // Auto-fill: search YouTube for missing tracks (max 5 per request to keep it fast)
  const autoAdded: typeof topTracksMatched = [];
  const maxAutoAdd = 5;
  let added = 0;

  for (const item of tracksToAdd) {
    if (added >= maxAutoAdd) break;

    const video = await buscarVideoYouTube(item.artistName, item.trackName);
    if (!video) continue;

    const url = `https://www.youtube.com/watch?v=${video.videoId}`;
    if (existingUrls.has(url)) continue;

    // Get artwork from iTunes
    const artwork = await buscarArtwork(item.trackName, item.artistName);
    const thumbnail = artwork || video.thumbnail;

    // Insert into Supabase
    const { data: inserted, error } = await supabase.from('contenido').insert({
      url,
      plataforma: 'youtube',
      titulo: item.trackName,
      artista: item.artistName,
      artista_id: item.artistId,
      descripcion: `${item.trackName} - ${item.artistName}`,
      thumbnail,
      duracion: '',
      tipo: 'musica',
      categoria: 'adoracion',
      genero_musical: generoMusical,
      es_congregacional: slug === 'worship',
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
    }).select().single();

    if (!error && inserted) {
      existingUrls.add(url);
      added++;
      autoAdded.push({
        titulo: item.trackName,
        artista: item.artistName,
        listeners: item.listeners,
        enCatalogo: true,
        contenidoId: inserted.id,
        thumbnail,
      });
    }
  }

  // Combine: matched + auto-added
  const allTopTracks = [...topTracksMatched.filter(t => t.enCatalogo), ...autoAdded]
    .sort((a, b) => b.listeners - a.listeners);

  // Tracks that are still not in catalog (artist not in DB)
  const sugerencias = topTracksMatched
    .filter(t => !t.enCatalogo)
    .sort((a, b) => b.listeners - a.listeners)
    .slice(0, 10);

  // Process artists
  const topArtistsMatched: Array<{
    nombre: string;
    listeners: number;
    enCatalogo: boolean;
    artistaId?: string;
    slug?: string;
    imagen?: string;
    canciones?: number;
  }> = [];

  for (const artist of lastfmArtists) {
    const artistLower = artist.name.toLowerCase();
    const nuestro = artistaMap.get(artistLower);
    const listeners = parseInt(artist.listeners || '0', 10);

    if (nuestro) {
      const songCount = (contenidoByArtist.get(nuestro.id) || []).length;
      topArtistsMatched.push({
        nombre: nuestro.nombre,
        listeners,
        enCatalogo: true,
        artistaId: nuestro.id,
        slug: nuestro.slug,
        imagen: nuestro.imagen,
        canciones: songCount,
      });
    } else {
      topArtistsMatched.push({
        nombre: artist.name,
        listeners,
        enCatalogo: false,
      });
    }
  }

  return NextResponse.json({
    genero: slug,
    lastfmTag: primaryTag,
    topTracks: allTopTracks,
    topArtists: topArtistsMatched.filter(a => a.enCatalogo).sort((a, b) => b.listeners - a.listeners),
    sugerencias,
    autoAgregados: added,
    totalLastfmTracks: lastfmTracks.length,
    totalLastfmArtists: lastfmArtists.length,
  });
}
