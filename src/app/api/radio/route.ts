import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const LASTFM_KEY = process.env.LASTFM_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filaAContenido(row: any) {
  return {
    id: row.id,
    url: row.url,
    plataforma: row.plataforma,
    titulo: row.titulo,
    artista: row.artista,
    artista_id: row.artista_id,
    descripcion: row.descripcion || '',
    duracion: row.duracion || '',
    thumbnail: row.thumbnail || '',
    clasificacion: {
      tipo: row.tipo,
      categoria: row.categoria,
      generoMusical: row.genero_musical,
      esCongreacional: row.es_congregacional,
      tieneMensaje: row.tiene_mensaje,
      esInstrumental: row.es_instrumental || false,
      momentoDelCulto: row.momento_del_culto,
      energia: row.energia,
      nivel: row.nivel,
    },
    evaluacion: {
      cristocentrico: row.eval_cristocentrico,
      fidelidadBiblica: row.eval_fidelidad_biblica,
      profundidad: row.eval_profundidad,
      edificante: row.eval_edificante,
      doctrinaSana: row.eval_doctrina_sana,
      puntuacionTotal: row.eval_puntuacion_total,
      aprobado: row.eval_aprobado,
      notas: row.eval_notas || '',
    },
    contenidoBiblico: {
      pasajes: row.pasajes || [],
      versiculosClave: row.versiculos_clave || [],
      temas: row.temas || [],
      personajes: row.personajes || [],
      doctrina: row.doctrina || [],
    },
    aptoPara: row.apto_para || [],
    audiencia: row.audiencia || [],
    likes: row.likes || 0,
    guardados: row.guardados || 0,
    compartidos: row.compartidos || 0,
    creadoPor: row.creado_por || 'sistema',
    fechaCreacion: row.created_at,
    revisadoPorIA: row.revisado_por_ia,
  };
}

async function lastfmSimilarArtists(artistName: string, limit = 15) {
  if (!LASTFM_KEY) return [];
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json&limit=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.similarartists?.artist || []).map((a: { name: string; match: string }) => ({
      name: a.name,
      match: parseFloat(a.match || '0'),
    }));
  } catch { return []; }
}

async function lastfmSimilarTracks(artistName: string, trackName: string) {
  if (!LASTFM_KEY) return [];
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&api_key=${LASTFM_KEY}&format=json&limit=30`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.similartracks?.track || []).map((t: { name: string; artist: { name: string } }) => ({
      name: t.name,
      artist: t.artist.name,
    }));
  } catch { return []; }
}

// GET /api/radio?artist=Hillsong+Worship or ?track=Oceans&artist=Hillsong+Worship
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get('artist');
  const trackName = searchParams.get('track');

  if (!artistName) {
    return NextResponse.json({ error: 'Se requiere parámetro artist' }, { status: 400 });
  }

  // Get all our content
  const { data: contenido } = await supabase
    .from('contenido')
    .select('*')
    .eq('publicado', true);

  if (!contenido) {
    return NextResponse.json({ error: 'Error al obtener contenido' }, { status: 500 });
  }

  // Index content by artist name (lowercase)
  const contentByArtist = new Map<string, typeof contenido>();
  for (const c of contenido) {
    const key = (c.artista || '').toLowerCase();
    if (!contentByArtist.has(key)) contentByArtist.set(key, []);
    contentByArtist.get(key)!.push(c);
  }

  const radioTracks: typeof contenido = [];
  const usedIds = new Set<string>();

  // 1. Start with the seed artist's songs
  const seedSongs = contentByArtist.get(artistName.toLowerCase()) || [];
  const shuffledSeed = [...seedSongs].sort(() => Math.random() - 0.5);

  // If we have a specific track, put it first
  if (trackName) {
    const trackLower = trackName.toLowerCase();
    const exactTrack = shuffledSeed.find(s => s.titulo.toLowerCase().includes(trackLower));
    if (exactTrack) {
      radioTracks.push(exactTrack);
      usedIds.add(exactTrack.id);
    }
  }

  // Add some seed songs (up to 8)
  for (const song of shuffledSeed) {
    if (usedIds.has(song.id)) continue;
    if (radioTracks.length >= 8) break;
    radioTracks.push(song);
    usedIds.add(song.id);
  }

  // 2. Get similar artists from Last.fm
  const similarArtists = await lastfmSimilarArtists(artistName);

  // 3. Get similar tracks if we have a specific track
  let similarTrackNames: { name: string; artist: string }[] = [];
  if (trackName) {
    similarTrackNames = await lastfmSimilarTracks(artistName, trackName);
  }

  // 4. Match similar tracks with our catalog
  for (const st of similarTrackNames) {
    const artistSongs = contentByArtist.get(st.artist.toLowerCase()) || [];
    const stLower = st.name.toLowerCase();
    const match = artistSongs.find(s =>
      !usedIds.has(s.id) && (
        s.titulo.toLowerCase().includes(stLower) ||
        stLower.includes(s.titulo.toLowerCase())
      )
    );
    if (match) {
      radioTracks.push(match);
      usedIds.add(match.id);
    }
  }

  // 5. Add songs from similar artists
  for (const sa of similarArtists) {
    const artistSongs = contentByArtist.get(sa.name.toLowerCase()) || [];
    const shuffled = [...artistSongs].sort(() => Math.random() - 0.5);

    // Add 2-3 songs per similar artist
    let addedFromArtist = 0;
    for (const song of shuffled) {
      if (usedIds.has(song.id)) continue;
      if (addedFromArtist >= 3) break;
      radioTracks.push(song);
      usedIds.add(song.id);
      addedFromArtist++;
    }

    if (radioTracks.length >= 50) break;
  }

  // 6. If still not enough, add random songs from same genre
  if (radioTracks.length < 30 && seedSongs.length > 0) {
    const genre = seedSongs[0]?.genero_musical;
    if (genre) {
      const genreSongs = contenido.filter(c =>
        c.genero_musical === genre && !usedIds.has(c.id)
      ).sort(() => Math.random() - 0.5);

      for (const song of genreSongs) {
        if (radioTracks.length >= 50) break;
        radioTracks.push(song);
        usedIds.add(song.id);
      }
    }
  }

  return NextResponse.json({
    nombre: trackName
      ? `Radio: ${trackName} - ${artistName}`
      : `Radio: ${artistName}`,
    tracks: radioTracks.map(filaAContenido),
    totalTracks: radioTracks.length,
    basedOn: {
      artist: artistName,
      track: trackName || null,
      similarArtists: similarArtists.slice(0, 5).map((a: { name: string }) => a.name),
    },
  });
}
