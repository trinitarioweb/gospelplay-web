import { NextRequest, NextResponse } from 'next/server';

// Use lrclib.net - free API with synced lyrics (timestamps)
// Falls back to lyrics.ovh if not found

interface LrcLibResult {
  syncedLyrics: string | null;
  plainLyrics: string | null;
  trackName: string;
  artistName: string;
}

export async function POST(request: NextRequest) {
  try {
    const { titulo, artista } = await request.json();

    if (!titulo) {
      return NextResponse.json({ error: 'Se requiere un titulo' }, { status: 400 });
    }

    console.log('[Letras] Buscando:', titulo, '-', artista);

    // 1. Try lrclib.net direct lookup
    const lrcResult = await buscarEnLrcLib(titulo, artista);
    if (lrcResult) {
      console.log('[Letras] Encontrada en lrclib.net, synced:', !!lrcResult.syncedLyrics);
      return NextResponse.json({
        letras: lrcResult.syncedLyrics || lrcResult.plainLyrics,
        sincronizada: !!lrcResult.syncedLyrics,
        encontrada: true,
      });
    }

    // 2. Try lrclib.net search
    const lrcSearchResult = await buscarEnLrcLibSearch(titulo, artista);
    if (lrcSearchResult) {
      console.log('[Letras] Encontrada via lrclib search, synced:', !!lrcSearchResult.syncedLyrics);
      return NextResponse.json({
        letras: lrcSearchResult.syncedLyrics || lrcSearchResult.plainLyrics,
        sincronizada: !!lrcSearchResult.syncedLyrics,
        encontrada: true,
      });
    }

    // 3. Fallback: lyrics.ovh
    const ovhResult = await buscarEnLyricsOvh(titulo, artista);
    if (ovhResult) {
      console.log('[Letras] Encontrada en lyrics.ovh');
      return NextResponse.json({
        letras: ovhResult,
        sincronizada: false,
        encontrada: true,
      });
    }

    console.log('[Letras] No encontrada en ninguna fuente');
    return NextResponse.json({
      letras: null,
      sincronizada: false,
      encontrada: false,
    });
  } catch (error) {
    console.error('[Letras] Error:', error);
    return NextResponse.json(
      { letras: null, sincronizada: false, encontrada: false },
      { status: 200 }
    );
  }
}

async function buscarEnLrcLib(titulo: string, artista: string): Promise<LrcLibResult | null> {
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artista || '')}&track_name=${encodeURIComponent(titulo)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'GospelPlay/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.plainLyrics || data.syncedLyrics) {
      return data as LrcLibResult;
    }
    return null;
  } catch {
    return null;
  }
}

async function buscarEnLrcLibSearch(titulo: string, artista: string): Promise<LrcLibResult | null> {
  try {
    const query = `${artista ? artista + ' ' : ''}${titulo}`;
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'GospelPlay/1.0' } });
    if (!res.ok) return null;
    const data: LrcLibResult[] = await res.json();
    if (data.length > 0 && (data[0].plainLyrics || data[0].syncedLyrics)) {
      return data[0];
    }
    return null;
  } catch {
    return null;
  }
}

async function buscarEnLyricsOvh(titulo: string, artista: string): Promise<string | null> {
  try {
    if (!artista) return null;
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artista)}/${encodeURIComponent(titulo)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.lyrics || null;
  } catch {
    return null;
  }
}
