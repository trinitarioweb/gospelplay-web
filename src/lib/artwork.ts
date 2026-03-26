// Fetch official artwork from iTunes Search API (free, no key needed)

const ARTWORK_SIZE = '600x600bb';

export async function buscarArtworkCancion(titulo: string, artista: string): Promise<string | null> {
  try {
    const query = `${artista} ${titulo}`.trim();
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=3`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();

    if (data.resultCount > 0) {
      const artwork = data.results[0].artworkUrl100;
      // Scale up to high resolution
      return artwork.replace('100x100bb', ARTWORK_SIZE);
    }
    return null;
  } catch {
    return null;
  }
}

export async function buscarImagenArtista(nombre: string): Promise<string | null> {
  try {
    // First try musicArtist entity
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(nombre)}&media=music&entity=musicArtist&limit=3`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();

    // musicArtist doesn't always have images, so try to get from their top song artwork
    if (data.resultCount > 0) {
      // Try to get artist's top song for better artwork
      const songRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(nombre)}&media=music&entity=song&limit=1`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (songRes.ok) {
        const songData = await songRes.json();
        if (songData.resultCount > 0) {
          return songData.results[0].artworkUrl100.replace('100x100bb', ARTWORK_SIZE);
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
