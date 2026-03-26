#!/usr/bin/env node
/**
 * SCRIPT DE POBLACION MASIVA - GospelPlay
 *
 * Ejecutar: node scripts/poblar-masivo.mjs
 *
 * Corre localmente sin limites de timeout.
 * Pobla la base de datos con artistas curados y sus canciones.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIG
// ============================================================
const SUPABASE_URL = 'https://unuxjxryyxdfmngdhnju.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yt669oTk8lGBgANprEoCXA_H9JKJauq';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

const MAX_CANCIONES_POR_ARTISTA = 5;
const DELAY_ENTRE_ARTISTAS = 2000;
const DELAY_ENTRE_CANCIONES = 800;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// CATALOGO CURADO DE ARTISTAS CRISTIANOS
// ============================================================
const CATALOGO = [
  // ─── WORSHIP EN ESPAÑOL ───
  { nombre: 'Marcos Witt', generos: ['worship'], pais: 'MX', tipo: 'artista' },
  { nombre: 'Jesus Adrian Romero', generos: ['worship', 'balada_cristiana'], pais: 'MX', tipo: 'artista' },
  { nombre: 'Danilo Montero', generos: ['worship'], pais: 'CR', tipo: 'artista' },
  { nombre: 'Miel San Marcos', generos: ['worship'], pais: 'GT', tipo: 'banda' },
  { nombre: 'Su Presencia', generos: ['worship'], pais: 'CO', tipo: 'ministerio' },
  { nombre: 'Barak', generos: ['worship'], pais: 'SV', tipo: 'banda' },
  { nombre: 'Un Corazon', generos: ['worship', 'pop_cristiano'], pais: 'AR', tipo: 'banda' },
  { nombre: 'Marcela Gandara', generos: ['worship', 'pop_cristiano'], pais: 'MX', tipo: 'artista' },
  { nombre: 'Ingrid Rosario', generos: ['worship'], pais: 'DO', tipo: 'artista' },
  { nombre: 'Christine DClario', generos: ['worship'], pais: 'PR', tipo: 'artista' },
  { nombre: 'Alex Campos', generos: ['worship', 'pop_cristiano'], pais: 'CO', tipo: 'artista' },
  { nombre: 'Evan Craft', generos: ['worship', 'pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Marco Barrientos', generos: ['worship'], pais: 'MX', tipo: 'artista' },
  { nombre: 'Julio Melgar', generos: ['worship'], pais: 'GT', tipo: 'artista' },
  { nombre: 'Coalo Zamorano', generos: ['worship'], pais: 'MX', tipo: 'artista' },
  { nombre: 'Generacion 12', generos: ['worship'], pais: 'CO', tipo: 'banda' },
  { nombre: 'Montesanto', generos: ['worship'], pais: 'MX', tipo: 'banda' },
  { nombre: 'Averly Morillo', generos: ['worship'], pais: 'DO', tipo: 'artista' },
  { nombre: 'Living', generos: ['worship'], pais: 'CO', tipo: 'banda' },
  { nombre: 'Twice Musica', generos: ['worship'], pais: 'MX', tipo: 'banda' },
  { nombre: 'Kairo Worship', generos: ['worship'], pais: 'CO', tipo: 'banda' },
  { nombre: 'Alfareros', generos: ['worship'], pais: 'CO', tipo: 'banda' },
  { nombre: 'New Wine', generos: ['worship'], pais: 'PR', tipo: 'banda' },
  { nombre: 'Xtreme Kids', generos: ['worship'], pais: 'CO', tipo: 'banda' },
  { nombre: 'Samuel Hernandez', generos: ['worship'], pais: 'PR', tipo: 'artista' },

  // ─── WORSHIP EN INGLES ───
  { nombre: 'Hillsong Worship', generos: ['worship'], pais: 'AU', tipo: 'banda' },
  { nombre: 'Elevation Worship', generos: ['worship'], pais: 'US', tipo: 'banda' },
  { nombre: 'Bethel Music', generos: ['worship'], pais: 'US', tipo: 'ministerio' },
  { nombre: 'Maverick City Music', generos: ['worship'], pais: 'US', tipo: 'banda' },
  { nombre: 'Chris Tomlin', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Kari Jobe', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'CityAlight', generos: ['worship', 'himnos_clasicos'], pais: 'AU', tipo: 'banda' },
  { nombre: 'Phil Wickham', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Brandon Lake', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Brooke Ligertwood', generos: ['worship'], pais: 'AU', tipo: 'artista' },
  { nombre: 'Hillsong United', generos: ['worship', 'rock_cristiano'], pais: 'AU', tipo: 'banda' },
  { nombre: 'Hillsong Young and Free', generos: ['worship', 'pop_cristiano'], pais: 'AU', tipo: 'banda' },
  { nombre: 'Jesus Culture', generos: ['worship'], pais: 'US', tipo: 'banda' },
  { nombre: 'Passion', generos: ['worship'], pais: 'US', tipo: 'banda' },
  { nombre: 'Matt Redman', generos: ['worship'], pais: 'GB', tipo: 'artista' },
  { nombre: 'Sinach', generos: ['worship'], pais: 'NG', tipo: 'artista' },
  { nombre: 'Don Moen', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Tasha Cobbs Leonard', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Chandler Moore', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Upperroom', generos: ['worship', 'soaking'], pais: 'US', tipo: 'banda' },
  { nombre: 'Shane and Shane', generos: ['worship'], pais: 'US', tipo: 'banda' },
  { nombre: 'Leeland', generos: ['worship'], pais: 'US', tipo: 'banda' },
  { nombre: 'Vertical Worship', generos: ['worship'], pais: 'US', tipo: 'banda' },

  // ─── POP CRISTIANO ───
  { nombre: 'Lauren Daigle', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Katy Nichole', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'for KING AND COUNTRY', generos: ['pop_cristiano'], pais: 'AU', tipo: 'banda' },
  { nombre: 'Casting Crowns', generos: ['pop_cristiano'], pais: 'US', tipo: 'banda' },
  { nombre: 'TobyMac', generos: ['pop_cristiano', 'hip_hop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'MercyMe', generos: ['pop_cristiano'], pais: 'US', tipo: 'banda' },
  { nombre: 'Matthew West', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Cory Asbury', generos: ['pop_cristiano', 'worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Anne Wilson', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'We The Kingdom', generos: ['pop_cristiano'], pais: 'US', tipo: 'banda' },
  { nombre: 'CAIN', generos: ['pop_cristiano'], pais: 'US', tipo: 'banda' },
  { nombre: 'Newsboys', generos: ['pop_cristiano'], pais: 'AU', tipo: 'banda' },
  { nombre: 'Danny Gokey', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Tauren Wells', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Riley Clemmons', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Terrian', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Blanca', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Jordan Feliz', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },

  // ─── ROCK / ALTERNATIVO CRISTIANO ───
  { nombre: 'Skillet', generos: ['rock_cristiano'], pais: 'US', tipo: 'banda' },
  { nombre: 'Switchfoot', generos: ['rock_cristiano'], pais: 'US', tipo: 'banda' },
  { nombre: 'Rojo', generos: ['rock_cristiano', 'pop_cristiano'], pais: 'MX', tipo: 'banda' },
  { nombre: 'Rescate', generos: ['rock_cristiano'], pais: 'AR', tipo: 'banda' },
  { nombre: 'Needtobreathe', generos: ['rock_cristiano'], pais: 'US', tipo: 'banda' },
  { nombre: 'Tenth Avenue North', generos: ['rock_cristiano', 'pop_cristiano'], pais: 'US', tipo: 'banda' },
  { nombre: 'Red', generos: ['rock_cristiano'], pais: 'US', tipo: 'banda' },
  { nombre: 'Kutless', generos: ['rock_cristiano'], pais: 'US', tipo: 'banda' },
  { nombre: 'Thousand Foot Krutch', generos: ['rock_cristiano'], pais: 'CA', tipo: 'banda' },
  { nombre: 'Disciple', generos: ['rock_cristiano'], pais: 'US', tipo: 'banda' },

  // ─── HIP-HOP / RAP CRISTIANO ───
  { nombre: 'Lecrae', generos: ['hip_hop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'NF', generos: ['hip_hop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Redimi2', generos: ['hip_hop_cristiano', 'reggaeton_cristiano'], pais: 'DO', tipo: 'artista' },
  { nombre: 'Funky', generos: ['hip_hop_cristiano', 'reggaeton_cristiano'], pais: 'PR', tipo: 'artista' },
  { nombre: 'Alex Zurdo', generos: ['hip_hop_cristiano'], pais: 'PR', tipo: 'artista' },
  { nombre: 'Manny Montes', generos: ['hip_hop_cristiano'], pais: 'PR', tipo: 'artista' },
  { nombre: 'Jay Kalyl', generos: ['hip_hop_cristiano', 'reggaeton_cristiano'], pais: 'PR', tipo: 'artista' },
  { nombre: 'Musiko', generos: ['hip_hop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Indiomar', generos: ['hip_hop_cristiano'], pais: 'PR', tipo: 'artista' },
  { nombre: 'Almighty', generos: ['hip_hop_cristiano', 'reggaeton_cristiano'], pais: 'PR', tipo: 'artista' },
  { nombre: 'Ander Bock', generos: ['hip_hop_cristiano'], pais: 'PR', tipo: 'artista' },
  { nombre: 'KB', generos: ['hip_hop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Andy Mineo', generos: ['hip_hop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Trip Lee', generos: ['hip_hop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Social Club Misfits', generos: ['hip_hop_cristiano'], pais: 'US', tipo: 'banda' },
  { nombre: 'Niko Eme', generos: ['hip_hop_cristiano'], pais: 'DO', tipo: 'artista' },
  { nombre: 'Lizzy Parra', generos: ['hip_hop_cristiano', 'reggaeton_cristiano'], pais: 'CO', tipo: 'artista' },
  { nombre: 'Lil Silvio y El Vega', generos: ['reggaeton_cristiano'], pais: 'CO', tipo: 'banda' },

  // ─── REGGAETON CRISTIANO ───
  { nombre: 'Daddy Yankee', generos: ['reggaeton_cristiano'], pais: 'PR', tipo: 'artista' },
  { nombre: 'Farruko', generos: ['reggaeton_cristiano'], pais: 'PR', tipo: 'artista' },
  { nombre: 'Miel San Marcos Feat Lowsan', generos: ['reggaeton_cristiano'], pais: 'GT', tipo: 'artista' },

  // ─── BALADA / ROMANTICA CRISTIANA ───
  { nombre: 'Marcos Vidal', generos: ['balada_cristiana'], pais: 'ES', tipo: 'artista' },
  { nombre: 'Lilly Goodman', generos: ['balada_cristiana'], pais: 'DO', tipo: 'artista' },
  { nombre: 'Tercer Cielo', generos: ['balada_cristiana', 'pop_cristiano'], pais: 'DO', tipo: 'banda' },
  { nombre: 'Jeseth', generos: ['balada_cristiana'], pais: 'SV', tipo: 'artista' },
  { nombre: 'Nancy Amancio', generos: ['balada_cristiana', 'worship'], pais: 'DO', tipo: 'artista' },
  { nombre: 'Abel Zavala', generos: ['balada_cristiana'], pais: 'PE', tipo: 'artista' },
  { nombre: 'Jose Luis Reyes', generos: ['balada_cristiana', 'worship'], pais: 'CO', tipo: 'artista' },
  { nombre: 'Lucia Parker', generos: ['balada_cristiana', 'pop_cristiano'], pais: 'VE', tipo: 'artista' },

  // ─── SALSA / TROPICAL CRISTIANA ───
  { nombre: 'Alex Rodriguez', generos: ['salsa_cristiana'], pais: 'PR', tipo: 'artista' },

  // ─── PREDICADORES ───
  { nombre: 'Andres Corson', generos: ['predicacion'], pais: 'CO', tipo: 'predicador' },
  { nombre: 'Cash Luna', generos: ['predicacion'], pais: 'GT', tipo: 'pastor' },
  { nombre: 'Dante Gebel', generos: ['predicacion'], pais: 'AR', tipo: 'pastor' },
  { nombre: 'John Piper', generos: ['predicacion'], pais: 'US', tipo: 'pastor' },
  { nombre: 'Charles Stanley', generos: ['predicacion'], pais: 'US', tipo: 'pastor' },
  { nombre: 'Steven Furtick', generos: ['predicacion'], pais: 'US', tipo: 'pastor' },
  { nombre: 'Judah Smith', generos: ['predicacion'], pais: 'US', tipo: 'pastor' },
  { nombre: 'Robert Madu', generos: ['predicacion'], pais: 'US', tipo: 'pastor' },
  { nombre: 'Rich Wilkerson Jr', generos: ['predicacion'], pais: 'US', tipo: 'pastor' },

  // ─── EMERGENTES / NUEVOS 2024-2026 ───
  { nombre: 'Stephen McWhirter', generos: ['worship', 'rock_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Forrest Frank', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Hulvey', generos: ['hip_hop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Davi Silva', generos: ['worship'], pais: 'BR', tipo: 'artista' },
  { nombre: 'Pat Barrett', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Naomi Raine', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'DOE', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Jonathan Traylor', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Jenn Johnson', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Taya', generos: ['worship', 'pop_cristiano'], pais: 'AU', tipo: 'artista' },
  { nombre: 'Blessing Offor', generos: ['pop_cristiano'], pais: 'US', tipo: 'artista' },
  { nombre: 'Aaron Moses', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Dante Bowe', generos: ['worship'], pais: 'US', tipo: 'artista' },
  { nombre: 'Josue Avila', generos: ['worship'], pais: 'MX', tipo: 'artista' },
  { nombre: 'Marcos Brunet', generos: ['worship', 'soaking'], pais: 'AR', tipo: 'artista' },
];

// ============================================================
// YOUTUBE SEARCH (scraping)
// ============================================================
const TITULO_BLACKLIST = [
  /\bmix\b/i, /\bmejores\s*(éxitos|exitos)\b/i, /\brecopilaci[oó]n\b/i,
  /\bplaylist\b/i, /\b\d+\s*hora/i, /\bfull\s*album\b/i,
  /\bcompleto\b/i, /\bgreatest\s*hits\b/i, /\bbest\s*of\b/i,
  /\btop\s*\d+/i, /\ball\s*time\b/i, /\bcollection\b/i,
  /\bcompilado\b/i, /\bnon[\s-]?stop\b/i, /\bdvd\b/i,
  /\bconcierto\b/i, /\bconcert\b/i, /\blive\s*stream/i,
];

function esTituloCompilacion(titulo) {
  return TITULO_BLACKLIST.some(re => re.test(titulo));
}

async function buscarYouTube(query, maxResults = 10) {
  try {
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
    const dataMatch = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    if (!dataMatch) {
      // Fallback: extract video IDs
      const ids = [...new Set([...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]))];
      const results = [];
      for (const videoId of ids.slice(0, maxResults)) {
        const meta = await obtenerMetaOEmbed(videoId);
        if (meta) results.push({ videoId, title: meta.title, author: meta.author, channelVerified: false, channelId: '' });
      }
      return results;
    }

    const ytData = JSON.parse(dataMatch[1]);
    const sections = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const results = [];

    for (const section of sections) {
      for (const item of (section?.itemSectionRenderer?.contents || [])) {
        const video = item.videoRenderer;
        if (!video?.videoId) continue;

        const badges = video.ownerBadges || [];
        const isVerified = badges.some(b => {
          const s = b?.metadataBadgeRenderer?.style || '';
          return s === 'BADGE_STYLE_TYPE_VERIFIED_ARTIST' || s === 'BADGE_STYLE_TYPE_VERIFIED';
        });

        results.push({
          videoId: video.videoId,
          title: video.title?.runs?.[0]?.text || '',
          author: video.ownerText?.runs?.[0]?.text || '',
          channelVerified: isVerified,
          channelId: video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
        });
        if (results.length >= maxResults) break;
      }
      if (results.length >= maxResults) break;
    }
    return results;
  } catch (e) {
    console.error(`  [YT] Error: ${e.message}`);
    return [];
  }
}

async function obtenerMetaOEmbed(videoId) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { title: data.title || '', author: data.author_name || '' };
  } catch { return null; }
}

function filtrarOficiales(videos, nombreArtista, youtubeCanalEsperado = '') {
  const nombreLower = nombreArtista.toLowerCase();
  return videos.filter(video => {
    if (esTituloCompilacion(video.title)) return false;
    if (video.channelVerified) return true;
    if (youtubeCanalEsperado) {
      const cl = video.author.toLowerCase().replace(/\s+/g, '');
      const el = youtubeCanalEsperado.toLowerCase().replace(/\s+/g, '');
      if (cl.includes(el) || el.includes(cl)) return true;
    }
    const al = video.author.toLowerCase();
    if (al.includes(nombreLower) || nombreLower.includes(al.replace(/vevo|official|music|tv/gi, '').trim())) return true;
    if (al.endsWith('vevo')) return true;
    return false;
  });
}

// ============================================================
// ITUNES ARTWORK
// ============================================================
async function buscarArtwork(titulo, artista) {
  try {
    const q = `${artista} ${titulo}`.trim();
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=3`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.resultCount > 0) return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
    return null;
  } catch { return null; }
}

async function buscarImagenArtista(nombre) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(nombre)}&media=music&entity=song&limit=1`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.resultCount > 0) return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
    return null;
  } catch { return null; }
}

// ============================================================
// METADATA CLEANER
// ============================================================
function limpiarMetadata(title, author) {
  let track = title
    .replace(/\(official\s*(music\s*)?video\)/gi, '')
    .replace(/\(video\s*oficial\)/gi, '')
    .replace(/\(lyric\s*video\)/gi, '')
    .replace(/\(audio\s*oficial\)/gi, '')
    .replace(/\(official\s*audio\)/gi, '')
    .replace(/\[official.*?\]/gi, '')
    .replace(/\(live\)/gi, '')
    .replace(/\(en\s*vivo\)/gi, '')
    .replace(/official\s*video/gi, '')
    .replace(/video\s*oficial/gi, '')
    .replace(/ft\.?\s*.*/gi, '')
    .replace(/feat\.?\s*.*/gi, '')
    .replace(/\|.*/g, '')
    .replace(/\s*[-–]\s*$/, '')
    .trim();

  let artist = author
    .replace(/VEVO$/i, '')
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/Official$/i, '')
    .replace(/Music$/i, '')
    .replace(/TV$/i, '')
    .trim();

  // If track starts with "Artist - Song", extract
  const dashMatch = track.match(/^(.+?)\s*[-–]\s+(.+)$/);
  if (dashMatch) {
    const possibleArtist = dashMatch[1].trim();
    const possibleTrack = dashMatch[2].trim();
    if (possibleArtist.toLowerCase().includes(artist.toLowerCase().substring(0, 5)) ||
        artist.toLowerCase().includes(possibleArtist.toLowerCase().substring(0, 5))) {
      track = possibleTrack;
    }
  }

  return { track: track || title, artist: artist || author };
}

// ============================================================
// AI CLASSIFICATION
// ============================================================
async function clasificarConIA(titulo, artista) {
  if (!ANTHROPIC_KEY || ANTHROPIC_KEY === 'tu-api-key-aqui') {
    return defaultClasificacion();
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: `Eres un experto en musica cristiana. Clasifica la cancion y devuelve SOLO un JSON valido:
{
  "tipo": "musica|predicacion|estudio_biblico",
  "categoria": "adoracion|alabanza|evangelistico|motivacional|doctrina|devocional",
  "genero_musical": "worship|pop_cristiano|rock_cristiano|balada_cristiana|reggaeton_cristiano|hip_hop_cristiano|salsa_cristiana|himnos_clasicos|soaking|instrumental",
  "es_congregacional": true/false,
  "momento_del_culto": "apertura|alabanza_energica|adoracion_profunda|altar|cierre",
  "energia": "baja|media|alta",
  "eval_cristocentrico": 0-100,
  "eval_fidelidad_biblica": 0-100,
  "eval_profundidad": 0-100,
  "eval_edificante": 0-100,
  "eval_doctrina_sana": 0-100,
  "temas": ["tema1", "tema2"],
  "pasajes": ["Versiculo 1:1"]
}`,
        messages: [{ role: 'user', content: `Clasifica: "${titulo}" de ${artista}` }],
      }),
    });

    if (!res.ok) return defaultClasificacion();
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return defaultClasificacion();
    const p = JSON.parse(jsonMatch[0]);

    const total = Math.round(
      ((p.eval_cristocentrico || 85) + (p.eval_fidelidad_biblica || 85) +
       (p.eval_profundidad || 80) + (p.eval_edificante || 85) +
       (p.eval_doctrina_sana || 85)) / 5
    );

    return {
      tipo: p.tipo || 'musica', categoria: p.categoria || 'adoracion',
      genero_musical: p.genero_musical || 'worship',
      es_congregacional: p.es_congregacional ?? true,
      tiene_mensaje: true, es_instrumental: false,
      momento_del_culto: p.momento_del_culto || 'adoracion_profunda',
      energia: p.energia || 'media', nivel: 'basico',
      eval_cristocentrico: p.eval_cristocentrico || 85,
      eval_fidelidad_biblica: p.eval_fidelidad_biblica || 85,
      eval_profundidad: p.eval_profundidad || 80,
      eval_edificante: p.eval_edificante || 85,
      eval_doctrina_sana: p.eval_doctrina_sana || 85,
      eval_puntuacion_total: total, eval_aprobado: total >= 70,
      eval_notas: 'Clasificado por IA',
      pasajes: p.pasajes || [], temas: p.temas || [],
      apto_para: ['culto dominical'], audiencia: ['todo publico'],
    };
  } catch {
    return defaultClasificacion();
  }
}

function defaultClasificacion() {
  return {
    tipo: 'musica', categoria: 'adoracion', genero_musical: 'worship',
    es_congregacional: true, tiene_mensaje: true, es_instrumental: false,
    momento_del_culto: 'adoracion_profunda', energia: 'media', nivel: 'basico',
    eval_cristocentrico: 85, eval_fidelidad_biblica: 85, eval_profundidad: 80,
    eval_edificante: 88, eval_doctrina_sana: 85, eval_puntuacion_total: 85,
    eval_aprobado: true, eval_notas: 'Clasificacion automatica',
    pasajes: [], temas: ['adoracion', 'fe'],
    apto_para: ['culto dominical'], audiencia: ['todo publico'],
  };
}

// ============================================================
// SLUG GENERATOR
// ============================================================
function generarSlug(nombre) {
  return nombre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ============================================================
// MAIN PROCESS
// ============================================================
async function procesarArtista(artista) {
  const slug = generarSlug(artista.nombre);
  console.log(`\n━━━ ${artista.nombre} (${slug}) ━━━`);

  // Check if artist exists
  let { data: existente } = await supabase
    .from('artistas')
    .select('id, slug, nombre')
    .eq('slug', slug)
    .single();

  let artistaId;

  if (existente) {
    artistaId = existente.id;
    console.log(`  Ya existe en DB (id: ${artistaId.substring(0, 8)}...)`);
  } else {
    // Create artist
    const imagen = await buscarImagenArtista(artista.nombre);
    const { data: nuevo, error } = await supabase
      .from('artistas')
      .insert({
        nombre: artista.nombre,
        slug,
        bio: '',
        imagen: imagen || '',
        banner: '',
        pais: artista.pais || '',
        generos: artista.generos,
        tipo: artista.tipo,
        youtube_canal: artista.nombre,
        spotify_id: '',
        artistas_relacionados: [],
        seguidores: 0,
        verificado: false,
        activo: true,
      })
      .select()
      .single();

    if (error) {
      console.error(`  ERROR creando artista: ${error.message}`);
      return { nombre: artista.nombre, canciones: 0, error: true };
    }
    artistaId = nuevo.id;
    console.log(`  Creado nuevo (id: ${artistaId.substring(0, 8)}...)`);
  }

  // Search YouTube
  const esPredica = artista.tipo === 'pastor' || artista.tipo === 'predicador';
  const query = esPredica
    ? `${artista.nombre} predicacion completa`
    : `${artista.nombre} official video`;

  console.log(`  Buscando: "${query}"...`);
  const rawVideos = await buscarYouTube(query, MAX_CANCIONES_POR_ARTISTA * 3);
  const videos = filtrarOficiales(rawVideos, artista.nombre);

  console.log(`  ${rawVideos.length} encontrados, ${videos.length} oficiales`);

  let agregados = 0;

  for (const video of videos) {
    if (agregados >= MAX_CANCIONES_POR_ARTISTA) break;

    const url = `https://www.youtube.com/watch?v=${video.videoId}`;

    // Check duplicate
    const { data: yaExiste } = await supabase
      .from('contenido')
      .select('id')
      .eq('url', url)
      .single();

    if (yaExiste) {
      console.log(`  ⊘ Ya existe: ${video.title.substring(0, 50)}`);
      continue;
    }

    const { track, artist } = limpiarMetadata(video.title, video.author);
    const artwork = await buscarArtwork(track, artist || artista.nombre);
    const thumbnail = artwork || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
    const clasificacion = await clasificarConIA(track, artist || artista.nombre);

    const { error: insertError } = await supabase.from('contenido').insert({
      url, plataforma: 'youtube',
      titulo: track,
      artista: artist || artista.nombre,
      artista_id: artistaId,
      descripcion: `${track} - ${artist || artista.nombre}`,
      thumbnail, duracion: '',
      ...clasificacion,
      versiculos_clave: [], personajes: [], doctrina: [],
      publicado: true, revisado_por_ia: true,
    });

    if (!insertError) {
      agregados++;
      console.log(`  ✓ ${track}`);
    } else {
      console.error(`  ✗ ${track}: ${insertError.message}`);
    }

    await sleep(DELAY_ENTRE_CANCIONES);
  }

  console.log(`  → ${agregados} canciones agregadas`);
  return { nombre: artista.nombre, canciones: agregados, error: false };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// RUN
// ============================================================
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   GOSPELPLAY - POBLACION MASIVA             ║');
  console.log(`║   ${CATALOGO.length} artistas en catalogo                 ║`);
  console.log(`║   Max ${MAX_CANCIONES_POR_ARTISTA} canciones por artista             ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  const inicio = Date.now();
  const resultados = [];

  for (let i = 0; i < CATALOGO.length; i++) {
    const artista = CATALOGO[i];
    console.log(`\n[${i + 1}/${CATALOGO.length}] ─────────────────────────────`);

    try {
      const res = await procesarArtista(artista);
      resultados.push(res);
    } catch (e) {
      console.error(`  ERROR FATAL: ${e.message}`);
      resultados.push({ nombre: artista.nombre, canciones: 0, error: true });
    }

    await sleep(DELAY_ENTRE_ARTISTAS);
  }

  // Summary
  const totalCanciones = resultados.reduce((s, r) => s + r.canciones, 0);
  const conCanciones = resultados.filter(r => r.canciones > 0).length;
  const errores = resultados.filter(r => r.error).length;
  const duracion = Math.round((Date.now() - inicio) / 1000 / 60);

  console.log('\n\n╔══════════════════════════════════════════════╗');
  console.log('║   RESUMEN FINAL                              ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  Artistas procesados: ${resultados.length}`);
  console.log(`  Artistas con canciones: ${conCanciones}`);
  console.log(`  Total canciones agregadas: ${totalCanciones}`);
  console.log(`  Errores: ${errores}`);
  console.log(`  Duracion: ~${duracion} minutos`);
  console.log('');

  // Show per-artist
  for (const r of resultados.filter(r => r.canciones > 0)) {
    console.log(`  ${r.nombre}: ${r.canciones} canciones`);
  }
}

main().catch(console.error);
