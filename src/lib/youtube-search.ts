// Shared YouTube search module used by /api/poblar and /api/bot endpoints
// Scrapes YouTube search results page and extracts channel verification badges

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  author: string;
  channelVerified: boolean;
  channelId: string;
}

// Titles that indicate compilations/fan uploads (not official singles)
const TITULO_BLACKLIST = [
  /\bmix\b/i, /\bmejores\s*(éxitos|exitos)\b/i, /\brecopilaci[oó]n\b/i,
  /\bplaylist\b/i, /\b\d+\s*hora/i, /\bfull\s*album\b/i,
  /\bcompleto\b/i, /\bgreatest\s*hits\b/i, /\bbest\s*of\b/i,
  /\btop\s*\d+/i, /\ball\s*time\b/i, /\bcollection\b/i,
  /\bcompilado\b/i, /\bnon[\s-]?stop\b/i,
];

export function esTituloCompilacion(titulo: string): boolean {
  return TITULO_BLACKLIST.some(re => re.test(titulo));
}

// Get video metadata via YouTube oEmbed
async function obtenerMetaOEmbed(videoId: string): Promise<{ title: string; author: string } | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { title: data.title || '', author: data.author_name || '' };
  } catch {
    return null;
  }
}

// Search YouTube by scraping search results page (no API key needed)
// Extracts channel verification badges to identify official channels
export async function buscarYouTube(query: string, maxResults = 5): Promise<YouTubeSearchResult[]> {
  try {
    // sp=EgIQAQ%3D%3D filters for videos only
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];

    const html = await res.text();

    // Extract ytInitialData JSON from the page
    const dataMatch = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    if (!dataMatch) {
      // Fallback: extract videoIds with oEmbed (no verification info available)
      const idMatches: string[] = [];
      const re = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
      let m;
      while ((m = re.exec(html)) !== null) idMatches.push(m[1]);
      const videoIds = [...new Set(idMatches)];
      const results: YouTubeSearchResult[] = [];
      for (const videoId of videoIds.slice(0, maxResults)) {
        const meta = await obtenerMetaOEmbed(videoId);
        if (meta) results.push({ videoId, title: meta.title, author: meta.author, channelVerified: false, channelId: '' });
      }
      return results;
    }

    // Parse ytInitialData to get video info INCLUDING verification badges
    const ytData = JSON.parse(dataMatch[1]);
    const sections = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    const results: YouTubeSearchResult[] = [];
    for (const section of sections) {
      const items = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const video = item.videoRenderer;
        if (!video?.videoId) continue;

        // Check for channel verification badge
        const badges = video.ownerBadges || [];
        const isVerified = badges.some((badge: { metadataBadgeRenderer?: { style?: string } }) => {
          const style = badge?.metadataBadgeRenderer?.style || '';
          return style === 'BADGE_STYLE_TYPE_VERIFIED_ARTIST'
            || style === 'BADGE_STYLE_TYPE_VERIFIED';
        });

        // Get channel ID from navigation endpoint
        const channelId = video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';

        results.push({
          videoId: video.videoId,
          title: video.title?.runs?.[0]?.text || '',
          author: video.ownerText?.runs?.[0]?.text || '',
          channelVerified: isVerified,
          channelId,
        });
        if (results.length >= maxResults) break;
      }
      if (results.length >= maxResults) break;
    }

    return results;
  } catch (e) {
    console.error('[YouTube] Error buscando:', e);
    return [];
  }
}

// Filter search results: only verified channels + no compilations
export function filtrarOficiales(
  videos: YouTubeSearchResult[],
  nombreArtista: string,
  youtubeCanalEsperado: string
): YouTubeSearchResult[] {
  const nombreLower = nombreArtista.toLowerCase();

  return videos.filter(video => {
    // 1. Skip compilations/mixes/playlists
    if (esTituloCompilacion(video.title)) {
      console.log(`[Filtro] Compilacion: "${video.title}"`);
      return false;
    }

    // 2. Accept if channel is YouTube-verified
    if (video.channelVerified) return true;

    // 3. Accept if channel name matches our known youtube_canal
    if (youtubeCanalEsperado) {
      const canalLower = video.author.toLowerCase().replace(/\s+/g, '');
      const esperadoLower = youtubeCanalEsperado.toLowerCase().replace(/\s+/g, '');
      if (canalLower.includes(esperadoLower) || esperadoLower.includes(canalLower)) return true;
    }

    // 4. Accept if channel name contains the artist name
    const authorLower = video.author.toLowerCase();
    if (authorLower.includes(nombreLower) || nombreLower.includes(authorLower.replace(/vevo|official|music|tv/gi, '').trim())) return true;

    // 5. Accept VEVO channels (always official)
    if (video.author.toLowerCase().endsWith('vevo')) return true;

    console.log(`[Filtro] Canal no oficial: "${video.author}" para "${nombreArtista}"`);
    return false;
  });
}
