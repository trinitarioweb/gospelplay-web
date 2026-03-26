import { NextRequest, NextResponse } from 'next/server';
import { limpiarMetadata } from '@/lib/limpiar-metadata';

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

    // 5. Last resort: Claude AI
    const aiResult = await buscarConClaude(track, artist);
    if (aiResult) {
      console.log('[Letras] Encontrada via Claude AI');
      return NextResponse.json({
        letras: aiResult,
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

async function buscarConClaude(track: string, artist: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'tu-api-key-aqui') return null;

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
        max_tokens: 3000,
        system: 'Eres un experto en letras de canciones. Devuelve SOLO la letra de la cancion pedida, sin encabezados como [Verso], [Coro], etc. Solo la letra pura con saltos de linea. Si no conoces la letra exacta, responde: NO_ENCONTRADA',
        messages: [{ role: 'user', content: `Letra de "${track}" de ${artist || 'artista desconocido'}` }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.content?.[0]?.text || '').trim();
    if (!text || text.includes('NO_ENCONTRADA')) return null;
    return text;
  } catch { return null; }
}
