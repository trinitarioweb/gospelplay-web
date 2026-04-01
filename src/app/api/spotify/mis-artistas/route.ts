import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const LASTFM_KEY = process.env.LASTFM_API_KEY || '';

// Refresh Spotify access token
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token;
}

// Get user's top artists from Spotify
async function getSpotifyTopArtists(accessToken: string) {
  const [shortTerm, mediumTerm] = await Promise.all([
    fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=short_term', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }).then(r => r.ok ? r.json() : { items: [] }),
    fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }).then(r => r.ok ? r.json() : { items: [] }),
  ]);

  // Merge and deduplicate
  const seen = new Set<string>();
  const artists: { name: string; genres: string[]; popularity: number; image: string }[] = [];

  for (const item of [...(shortTerm.items || []), ...(mediumTerm.items || [])]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    artists.push({
      name: item.name,
      genres: item.genres || [],
      popularity: item.popularity || 0,
      image: item.images?.[0]?.url || '',
    });
  }

  return artists;
}

// Get user's followed artists
async function getSpotifyFollowedArtists(accessToken: string) {
  const artists: { name: string; genres: string[]; popularity: number; image: string }[] = [];
  let after: string | null = null;

  for (let i = 0; i < 5; i++) { // Max 5 pages = 250 artists
    const url = new URL('https://api.spotify.com/v1/me/following');
    url.searchParams.set('type', 'artist');
    url.searchParams.set('limit', '50');
    if (after) url.searchParams.set('after', after);

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!res.ok) break;

    const data = await res.json();
    const items = data.artists?.items || [];
    if (items.length === 0) break;

    for (const item of items) {
      artists.push({
        name: item.name,
        genres: item.genres || [],
        popularity: item.popularity || 0,
        image: item.images?.[0]?.url || '',
      });
    }

    after = data.artists?.cursors?.after;
    if (!after) break;
  }

  return artists;
}

// Check if artist has Christian/gospel genres
function isChristianGenre(genres: string[]): boolean {
  const christianKeywords = [
    'christian', 'gospel', 'worship', 'ccm', 'praise',
    'hymn', 'cristian', 'adoracion', 'alabanza',
  ];
  return genres.some(g => {
    const gl = g.toLowerCase();
    return christianKeywords.some(kw => gl.includes(kw));
  });
}

// Get Last.fm recommendations for an artist
async function getLastfmSimilar(artistName: string): Promise<string[]> {
  if (!LASTFM_KEY) return [];

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json&limit=10`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.similarartists?.artist || []).map((a: { name: string }) => a.name);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    // Get profile with Spotify token
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('spotify_refresh_token')
      .eq('id', user.id)
      .single();

    if (!profile?.spotify_refresh_token) {
      return NextResponse.json({ error: 'Spotify no conectado' }, { status: 400 });
    }

    // Get fresh access token
    const accessToken = await refreshAccessToken(profile.spotify_refresh_token);
    if (!accessToken) {
      return NextResponse.json({ error: 'Token de Spotify expirado' }, { status: 401 });
    }

    // Get user's Spotify artists
    const [topArtists, followedArtists] = await Promise.all([
      getSpotifyTopArtists(accessToken),
      getSpotifyFollowedArtists(accessToken),
    ]);

    // Merge all artists
    const allArtistsMap = new Map<string, typeof topArtists[0]>();
    for (const a of [...topArtists, ...followedArtists]) {
      const key = a.name.toLowerCase();
      if (!allArtistsMap.has(key)) allArtistsMap.set(key, a);
    }

    // Filter Christian artists
    const christianArtists = [...allArtistsMap.values()].filter(a => isChristianGenre(a.genres));

    // Get existing artists in GospelPlay
    const { data: gpArtists } = await supabase.from('artistas').select('nombre, slug');
    const gpArtistNames = new Set((gpArtists || []).map(a => a.nombre.toLowerCase()));

    // Split into: already in GP and not in GP
    const enGospelPlay = christianArtists.filter(a => gpArtistNames.has(a.name.toLowerCase()));
    const noEnGospelPlay = christianArtists.filter(a => !gpArtistNames.has(a.name.toLowerCase()));

    // Get Last.fm recommendations based on their Christian artists
    const recomendaciones: { nombre: string; porQue: string }[] = [];
    const recSet = new Set<string>();

    // Use top 10 Christian artists as seeds for recommendations
    const seeds = christianArtists.slice(0, 10);
    for (const seed of seeds) {
      const similares = await getLastfmSimilar(seed.name);
      for (const sim of similares) {
        const simLower = sim.toLowerCase();
        if (recSet.has(simLower)) continue;
        if (allArtistsMap.has(simLower)) continue; // Already listen to them
        recSet.add(simLower);

        // Check if this artist is in GospelPlay
        if (gpArtistNames.has(simLower)) {
          recomendaciones.push({
            nombre: sim,
            porQue: `Similar a ${seed.name}`,
          });
        }
      }
    }

    return NextResponse.json({
      spotify: {
        total: allArtistsMap.size,
        cristianos: christianArtists.length,
      },
      tus_artistas_en_gospelplay: enGospelPlay.map(a => ({
        nombre: a.name,
        imagen: a.image,
        popularidad: a.popularity,
      })),
      artistas_no_en_gospelplay: noEnGospelPlay.map(a => ({
        nombre: a.name,
        generos: a.genres,
      })),
      recomendaciones: recomendaciones.slice(0, 30),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
