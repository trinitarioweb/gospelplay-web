// Limpia títulos y artistas de YouTube para obtener nombres reales
// Usado por: /api/clasificar (guardar limpio en DB) y /api/letras (buscar letra)

export function limpiarMetadata(titulo: string, artista: string): { track: string; artist: string } {
  let track = titulo;
  let artist = artista;

  // Remove VEVO, Topic, Rock, Official suffixes from artist
  artist = artist
    .replace(/VEVO$/i, '')
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/\s+(Rock|Official|Music|Band)$/i, '')
    .trim();

  // Handle "TRACK // ARTIST (stuff)" format (common in Spanish YouTube)
  const doubleSlashMatch = track.match(/^(.+?)\s*\/\/\s*(.+)$/);
  if (doubleSlashMatch) {
    track = doubleSlashMatch[1].trim();
    const afterSlash = doubleSlashMatch[2].replace(/\(.*\)/g, '').trim();
    if (afterSlash) artist = afterSlash;
  }

  // Handle "Artist - Track" format
  const dashMatch = track.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    const possibleArtist = dashMatch[1].trim();
    const possibleTrack = dashMatch[2].trim();
    track = possibleTrack;
    if (!artist || artist.toLowerCase().includes('vevo') || artist.toLowerCase().includes('official')) {
      artist = possibleArtist;
    }
  }

  // Remove common YouTube suffixes
  track = track
    .replace(/\(Official\s*(Music\s*)?Video\)/gi, '')
    .replace(/\(Official\s*Audio\)/gi, '')
    .replace(/\(Lyric\s*Video\)/gi, '')
    .replace(/\(Lyrics?\)/gi, '')
    .replace(/\(Live\)/gi, '')
    .replace(/\(Audio\s*Oficial\)/gi, '')
    .replace(/\(Video\s*Oficial\)/gi, '')
    .replace(/\(video\s*lyrics?\s*oficial\)/gi, '')
    .replace(/\(En\s*Vivo\)/gi, '')
    .replace(/\[Official\s*(Music\s*)?Video\]/gi, '')
    .replace(/\[Audio\]/gi, '')
    .replace(/\[Lyrics?\]/gi, '')
    .replace(/\|.*$/g, '')
    .replace(/\/\/.*$/g, '')
    .replace(/ft\.?\s*.+$/i, '')
    .replace(/feat\.?\s*.+$/i, '')
    .replace(/\(feat\.?\s*[^)]+\)/gi, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Clean artist too
  artist = artist
    .replace(/Official$/i, '')
    .replace(/Music$/i, '')
    .replace(/Rock$/i, '')
    .replace(/Band$/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { track, artist };
}
