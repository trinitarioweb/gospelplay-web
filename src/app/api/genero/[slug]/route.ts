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

interface LastfmTrack {
  name: string;
  artist: { name: string };
  listeners?: string;
  playcount?: string;
  image?: { '#text': string; size: string }[];
}

interface LastfmArtist {
  name: string;
  listeners?: string;
  playcount?: string;
  image?: { '#text': string; size: string }[];
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
      next: { revalidate: 3600 }, // Cache 1 hour
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tags = GENRE_TO_LASTFM_TAGS[slug];

  if (!tags) {
    return NextResponse.json({ error: 'Género no encontrado' }, { status: 404 });
  }

  // Get all our artists and content for matching
  const [{ data: artistas }, { data: contenido }] = await Promise.all([
    supabase.from('artistas').select('id, nombre, slug, imagen, generos, tipo').eq('activo', true),
    supabase.from('contenido').select('*').eq('publicado', true),
  ]);

  const artistaMap = new Map((artistas || []).map(a => [a.nombre.toLowerCase(), a]));
  const contenidoByArtist = new Map<string, typeof contenido>();
  for (const c of contenido || []) {
    const key = c.artista_id;
    if (!contenidoByArtist.has(key)) contenidoByArtist.set(key, []);
    contenidoByArtist.get(key)!.push(c);
  }

  // Fetch Last.fm data for the primary tag
  const primaryTag = tags[0];

  const [topTracksData, topArtistsData] = await Promise.all([
    lastfmFetch('tag.gettoptracks', { tag: primaryTag, limit: '50' }),
    lastfmFetch('tag.gettopartists', { tag: primaryTag, limit: '30' }),
  ]);

  // Process top tracks - match with our catalog
  const lastfmTracks: LastfmTrack[] = topTracksData?.tracks?.track || [];
  const topTracksMatched: Array<{
    titulo: string;
    artista: string;
    listeners: number;
    enCatalogo: boolean;
    contenidoId?: string;
    thumbnail?: string;
    url?: string;
  }> = [];

  for (const track of lastfmTracks) {
    const artistLower = track.artist.name.toLowerCase();
    const nuestroArtista = artistaMap.get(artistLower);
    const listeners = parseInt(track.listeners || '0', 10);

    if (nuestroArtista) {
      // Find matching content in our catalog
      const artistContent = contenidoByArtist.get(nuestroArtista.id) || [];
      const trackLower = track.name.toLowerCase();
      const match = artistContent.find(c =>
        c.titulo.toLowerCase().includes(trackLower) ||
        trackLower.includes(c.titulo.toLowerCase())
      );

      topTracksMatched.push({
        titulo: match ? match.titulo : track.name,
        artista: nuestroArtista.nombre,
        listeners,
        enCatalogo: !!match,
        contenidoId: match?.id,
        thumbnail: match?.thumbnail,
        url: match?.url,
      });
    } else {
      topTracksMatched.push({
        titulo: track.name,
        artista: track.artist.name,
        listeners,
        enCatalogo: false,
      });
    }
  }

  // Process top artists - match with our catalog
  const lastfmArtists: LastfmArtist[] = topArtistsData?.topartists?.artist || [];
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

  // Sort: catalog matches first, then by listeners
  const topEnCatalogo = topTracksMatched
    .filter(t => t.enCatalogo)
    .sort((a, b) => b.listeners - a.listeners);

  const topArtistasEnCatalogo = topArtistsMatched
    .filter(a => a.enCatalogo)
    .sort((a, b) => b.listeners - a.listeners);

  const topNoEnCatalogo = topTracksMatched
    .filter(t => !t.enCatalogo)
    .sort((a, b) => b.listeners - a.listeners)
    .slice(0, 10);

  return NextResponse.json({
    genero: slug,
    lastfmTag: primaryTag,
    topTracks: topEnCatalogo,
    topArtists: topArtistasEnCatalogo,
    sugerencias: topNoEnCatalogo, // Tracks populares que no tenemos
    totalLastfmTracks: lastfmTracks.length,
    totalLastfmArtists: lastfmArtists.length,
  });
}
