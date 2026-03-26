import { NextRequest, NextResponse } from 'next/server';

interface LrcLibResult {
  syncedLyrics: string | null;
  plainLyrics: string | null;
  trackName: string;
  artistName: string;
}

// Clean YouTube-style titles to get real artist/track names
function limpiarMetadata(titulo: string, artista: string): { track: string; artist: string } {
  let track = titulo;
  let artist = artista;

  // Remove VEVO suffix from artist
  artist = artist.replace(/VEVO$/i, '').replace(/\s*-\s*Topic$/i, '').trim();

  // If title has "Artist - Track" format, extract both
  const dashMatch = track.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    const possibleArtist = dashMatch[1].trim();
    const possibleTrack = dashMatch[2].trim();
    // Use the part after the dash as the track name
    track = possibleTrack;
    // If artist was just a channel name, use the one from the title
    if (!artist || artist.toLowerCase().includes('vevo') || artist.toLowerCase().includes('official')) {
      artist = possibleArtist;
    }
  }

  // Remove common YouTube suffixes from track name
  track = track
    .replace(/\(Official\s*(Music\s*)?Video\)/gi, '')
    .replace(/\(Official\s*Audio\)/gi, '')
    .replace(/\(Lyric\s*Video\)/gi, '')
    .replace(/\(Lyrics?\)/gi, '')
    .replace(/\(Live\)/gi, '')
    .replace(/\(Audio\s*Oficial\)/gi, '')
    .replace(/\(Video\s*Oficial\)/gi, '')
    .replace(/\(En\s*Vivo\)/gi, '')
    .replace(/\[Official\s*(Music\s*)?Video\]/gi, '')
    .replace(/\[Audio\]/gi, '')
    .replace(/\[Lyrics?\]/gi, '')
    .replace(/\|.*$/g, '') // Remove everything after |
    .replace(/ft\.?\s*.+$/i, '') // Remove feat/ft
    .replace(/feat\.?\s*.+$/i, '')
    .replace(/\(feat\.?\s*[^)]+\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Clean artist too
  artist = artist
    .replace(/Official$/i, '')
    .replace(/Music$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { track, artist };
}

export async function POST(request: NextRequest) {
  try {
    const { titulo, artista } = await request.json();

    if (!titulo) {
      return NextResponse.json({ error: 'Se requiere un titulo' }, { status: 400 });
    }

    const { track, artist } = limpiarMetadata(titulo, artista || '');
    console.log('[Letras] Original:', titulo, '-', artista);
    console.log('[Letras] Limpio:', track, '-', artist);

    // 1. Try lrclib.net direct lookup with clean names
    let result = await buscarEnLrcLib(track, artist);
    if (result) {
      console.log('[Letras] Encontrada en lrclib directo');
      return NextResponse.json({
        letras: result.syncedLyrics || result.plainLyrics,
        sincronizada: !!result.syncedLyrics,
        encontrada: true,
      });
    }

    // 2. Try lrclib.net search with clean names
    result = await buscarEnLrcLibSearch(track, artist);
    if (result) {
      console.log('[Letras] Encontrada en lrclib search');
      return NextResponse.json({
        letras: result.syncedLyrics || result.plainLyrics,
        sincronizada: !!result.syncedLyrics,
        encontrada: true,
      });
    }

    // 3. Try search with just track name (no artist)
    result = await buscarEnLrcLibSearch(track, '');
    if (result) {
      console.log('[Letras] Encontrada en lrclib search (solo titulo)');
      return NextResponse.json({
        letras: result.syncedLyrics || result.plainLyrics,
        sincronizada: !!result.syncedLyrics,
        encontrada: true,
      });
    }

    // 4. Fallback: lyrics.ovh with clean names
    const ovhResult = await buscarEnLyricsOvh(track, artist);
    if (ovhResult) {
      console.log('[Letras] Encontrada en lyrics.ovh');
      return NextResponse.json({
        letras: ovhResult,
        sincronizada: false,
        encontrada: true,
      });
    }

    console.log('[Letras] No encontrada en ninguna fuente');
    return NextResponse.json({ letras: null, sincronizada: false, encontrada: false });
  } catch (error) {
    console.error('[Letras] Error:', error);
    return NextResponse.json({ letras: null, sincronizada: false, encontrada: false });
  }
}

async function buscarEnLrcLib(track: string, artist: string): Promise<LrcLibResult | null> {
  try {
    const params = new URLSearchParams({ track_name: track });
    if (artist) params.append('artist_name', artist);
    const res = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { 'User-Agent': 'GospelPlay/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.plainLyrics || data.syncedLyrics) ? data : null;
  } catch { return null; }
}

async function buscarEnLrcLibSearch(track: string, artist: string): Promise<LrcLibResult | null> {
  try {
    const query = artist ? `${artist} ${track}` : track;
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'GospelPlay/1.0' },
    });
    if (!res.ok) return null;
    const data: LrcLibResult[] = await res.json();
    if (data.length > 0 && (data[0].plainLyrics || data[0].syncedLyrics)) return data[0];
    return null;
  } catch { return null; }
}

async function buscarEnLyricsOvh(track: string, artist: string): Promise<string | null> {
  try {
    if (!artist) return null;
    const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.lyrics || null;
  } catch { return null; }
}
