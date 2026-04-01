#!/usr/bin/env node
/**
 * SCRIPT DE DESCUBRIMIENTO DE ARTISTAS - GospelPlay
 *
 * Usa Last.fm API para descubrir artistas similares a los que ya tenemos,
 * filtra por contenido cristiano, verifica con IA, busca en YouTube y pobla la DB.
 *
 * Ejecutar: node scripts/descubrir-artistas.mjs
 *
 * Necesitas: LASTFM_API_KEY en .env.local o como variable de entorno
 * Obtener gratis en: https://www.last.fm/api/account/create
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {}

// ============================================================
// CONFIG
// ============================================================
const SUPABASE_URL = 'https://unuxjxryyxdfmngdhnju.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yt669oTk8lGBgANprEoCXA_H9JKJauq';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const LASTFM_KEY = process.env.LASTFM_API_KEY || '';

const MAX_SIMILAR_PER_SEED = 15;       // Cuantos similares traer por semilla
const MAX_CANCIONES_POR_ARTISTA = 5;   // Canciones a buscar por artista nuevo
const DELAY_ENTRE_REQUESTS = 1500;     // Rate limit Last.fm
const DELAY_ENTRE_ARTISTAS = 2000;
const DELAY_ENTRE_CANCIONES = 800;
const MAX_DESCUBIERTOS = 500;          // Limite total de artistas a descubrir

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// SEMILLAS - Artistas base para descubrimiento
// Organizados por genero para generar busquedas variadas
// ============================================================
const SEMILLAS = [
  // Worship EN
  'Hillsong Worship', 'Elevation Worship', 'Bethel Music', 'Maverick City Music',
  'Chris Tomlin', 'Kari Jobe', 'Phil Wickham', 'Matt Redman', 'Jesus Culture',
  'Passion', 'CityAlight', 'Shane and Shane', 'Leeland', 'Upperroom',
  'Brandon Lake', 'Brooke Ligertwood', 'Vertical Worship',
  // Worship ES
  'Marcos Witt', 'Jesus Adrian Romero', 'Miel San Marcos', 'Su Presencia',
  'Barak', 'Christine DClario', 'Montesanto', 'Generacion 12', 'Averly Morillo',
  'Kairo Worship', 'Marco Barrientos', 'Julio Melgar',
  // Pop cristiano
  'Lauren Daigle', 'for KING AND COUNTRY', 'Casting Crowns', 'MercyMe',
  'TobyMac', 'We The Kingdom', 'Newsboys', 'Tauren Wells', 'Danny Gokey',
  'Forrest Frank', 'Anne Wilson',
  // Rock cristiano
  'Skillet', 'Switchfoot', 'Needtobreathe', 'Tenth Avenue North', 'Red',
  'Thousand Foot Krutch', 'Kutless',
  // Hip-hop cristiano
  'Lecrae', 'NF', 'KB', 'Andy Mineo', 'Trip Lee',
  'Redimi2', 'Funky', 'Jay Kalyl',
  // Balada / otros ES
  'Lilly Goodman', 'Tercer Cielo', 'Alex Campos', 'Evan Craft',
  // Gospel / Soul
  'Tasha Cobbs Leonard', 'Sinach', 'Don Moen', 'Chandler Moore',
  'Kirk Franklin', 'Israel Houghton',
];

// Tags que indican artista cristiano en Last.fm
const CHRISTIAN_TAGS = new Set([
  'christian', 'christian rock', 'christian metal', 'christian hip-hop',
  'christian rap', 'ccm', 'contemporary christian', 'worship', 'praise',
  'gospel', 'christian pop', 'christian alternative', 'praise and worship',
  'christian hardcore', 'christian punk', 'christian indie', 'christian soul',
  'christian r&b', 'cristiano', 'musica cristiana', 'adoracion', 'alabanza',
  'gospel music', 'christian music', 'hillsong', 'jesus', 'faith',
  'christian electronic', 'christian country',
]);

// Artistas ya conocidos que no son cristianos (falsos positivos comunes)
const BLACKLIST = new Set([
  'u2', 'coldplay', 'mumford & sons', 'the fray', 'onerepublic',
  'imagine dragons', 'twenty one pilots', 'lifehouse', 'creed',
  'p.o.d.', 'flyleaf', 'evanescence', 'paramore', 'linkin park',
  'eminem', 'kanye west', 'justin bieber', 'ed sheeran',
]);

// ============================================================
// LAST.FM API
// ============================================================
async function lastfmRequest(method, params = {}) {
  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.searchParams.set('method', method);
  url.searchParams.set('api_key', LASTFM_KEY);
  url.searchParams.set('format', 'json');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`  [Last.fm] Error: ${e.message}`);
    return null;
  }
}

async function obtenerSimilares(artistName) {
  const data = await lastfmRequest('artist.getsimilar', {
    artist: artistName,
    limit: String(MAX_SIMILAR_PER_SEED),
  });
  if (!data?.similarartists?.artist) return [];
  return data.similarartists.artist.map(a => ({
    nombre: a.name,
    match: parseFloat(a.match) || 0,
    mbid: a.mbid || '',
  }));
}

async function obtenerTagsArtista(artistName) {
  const data = await lastfmRequest('artist.gettoptags', { artist: artistName });
  if (!data?.toptags?.tag) return [];
  return data.toptags.tag.map(t => ({
    nombre: t.name.toLowerCase(),
    count: parseInt(t.count) || 0,
  }));
}

async function obtenerInfoArtista(artistName) {
  const data = await lastfmRequest('artist.getinfo', { artist: artistName });
  if (!data?.artist) return null;
  const a = data.artist;
  return {
    nombre: a.name,
    bio: a.bio?.summary?.replace(/<[^>]*>/g, '').trim() || '',
    listeners: parseInt(a.stats?.listeners) || 0,
    playcount: parseInt(a.stats?.playcount) || 0,
    tags: (a.tags?.tag || []).map(t => t.name.toLowerCase()),
    image: a.image?.find(i => i.size === 'extralarge')?.['#text'] || '',
  };
}

async function obtenerTopTracks(artistName, limit = 10) {
  const data = await lastfmRequest('artist.gettoptracks', {
    artist: artistName,
    limit: String(limit),
  });
  if (!data?.toptracks?.track) return [];
  return data.toptracks.track.map(t => ({
    nombre: t.name,
    playcount: parseInt(t.playcount) || 0,
    listeners: parseInt(t.listeners) || 0,
  }));
}

// Buscar artistas por tag en Last.fm
async function buscarPorTag(tag, limit = 50) {
  const data = await lastfmRequest('tag.gettopartists', {
    tag,
    limit: String(limit),
  });
  if (!data?.topartists?.artist) return [];
  return data.topartists.artist.map(a => ({
    nombre: a.name,
    mbid: a.mbid || '',
  }));
}

// ============================================================
// CHRISTIAN ARTIST VERIFICATION
// ============================================================
function esCristianoPorTags(tags) {
  let christianScore = 0;
  let totalWeight = 0;

  for (const tag of tags) {
    const name = tag.nombre || tag;
    const weight = tag.count || 50;
    totalWeight += weight;

    if (CHRISTIAN_TAGS.has(name)) {
      christianScore += weight;
    }
    // Partial matches
    if (name.includes('christian') || name.includes('worship') ||
        name.includes('gospel') || name.includes('praise') ||
        name.includes('cristiano') || name.includes('ccm')) {
      christianScore += weight * 0.8;
    }
  }

  return totalWeight > 0 ? (christianScore / totalWeight) > 0.15 : false;
}

async function verificarCristianoConIA(artistName, bio, tags) {
  if (!ANTHROPIC_KEY) return { esCristiano: false, generos: [], pais: '', tipo: 'artista' };

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
        max_tokens: 500,
        system: `Eres un experto en musica cristiana. Determina si un artista es cristiano/gospel y clasifícalo. Responde SOLO con JSON valido:
{
  "es_cristiano": true/false,
  "confianza": 0-100,
  "generos": ["worship", "pop_cristiano", "rock_cristiano", etc],
  "pais": "XX",
  "tipo": "artista|banda|ministerio",
  "razon": "breve explicacion"
}
Generos validos: worship, pop_cristiano, rock_cristiano, hip_hop_cristiano, reggaeton_cristiano, balada_cristiana, salsa_cristiana, himnos_clasicos, soaking, instrumental, gospel_soul, gospel_contemporaneo`,
        messages: [{
          role: 'user',
          content: `Artista: "${artistName}"\nBio: "${bio?.substring(0, 300) || 'N/A'}"\nTags: ${tags.join(', ')}\n\n¿Es artista de musica cristiana/gospel?`
        }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

// ============================================================
// YOUTUBE SEARCH (reutilizado de poblar-masivo.mjs)
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

function filtrarOficiales(videos, nombreArtista) {
  const nombreLower = nombreArtista.toLowerCase();
  return videos.filter(video => {
    if (esTituloCompilacion(video.title)) return false;
    if (video.channelVerified) return true;
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
// METADATA & CLASSIFICATION
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

async function clasificarConIA(titulo, artista) {
  if (!ANTHROPIC_KEY) return defaultClasificacion();

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
      eval_notas: 'Clasificado por IA (descubrimiento)',
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

function generarSlug(nombre) {
  return nombre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// FASE 1: DESCUBRIMIENTO via Last.fm
// ============================================================
async function descubrirArtistas() {
  console.log('\n🔍 FASE 1: DESCUBRIMIENTO DE ARTISTAS via Last.fm');
  console.log('─'.repeat(50));

  // Obtener artistas que ya existen en la DB
  const { data: existentes } = await supabase.from('artistas').select('nombre, slug');
  const existentesSet = new Set((existentes || []).map(a => a.nombre.toLowerCase()));
  console.log(`  ${existentesSet.size} artistas ya en la DB`);

  const descubiertos = new Map(); // nombre_lower -> { nombre, fuente, match, tags }

  // 1a. Buscar similares para cada semilla
  console.log(`\n  Buscando similares para ${SEMILLAS.length} semillas...`);
  for (let i = 0; i < SEMILLAS.length; i++) {
    const semilla = SEMILLAS[i];
    process.stdout.write(`  [${i + 1}/${SEMILLAS.length}] ${semilla}... `);

    const similares = await obtenerSimilares(semilla);
    let nuevos = 0;

    for (const sim of similares) {
      const key = sim.nombre.toLowerCase();
      if (existentesSet.has(key)) continue;
      if (BLACKLIST.has(key)) continue;
      if (descubiertos.has(key)) {
        // Actualizar match si es mayor
        const existing = descubiertos.get(key);
        if (sim.match > existing.match) existing.match = sim.match;
        existing.fuentes.push(semilla);
        continue;
      }
      descubiertos.set(key, {
        nombre: sim.nombre,
        match: sim.match,
        fuentes: [semilla],
        mbid: sim.mbid,
      });
      nuevos++;
    }

    console.log(`${similares.length} similares, ${nuevos} nuevos`);
    await sleep(DELAY_ENTRE_REQUESTS);

    if (descubiertos.size >= MAX_DESCUBIERTOS * 2) break; // Tenemos suficientes candidatos
  }

  // 1b. Buscar por tags cristianos directamente
  console.log(`\n  Buscando por tags cristianos directamente...`);
  const tagsBuscar = ['christian rock', 'christian metal', 'christian hip-hop', 'worship', 'ccm',
    'gospel', 'christian pop', 'praise and worship', 'christian alternative', 'christian indie',
    'musica cristiana', 'christian r&b', 'christian soul', 'christian electronic'];

  for (const tag of tagsBuscar) {
    process.stdout.write(`  Tag: "${tag}"... `);
    const artistas = await buscarPorTag(tag, 30);
    let nuevos = 0;

    for (const a of artistas) {
      const key = a.nombre.toLowerCase();
      if (existentesSet.has(key) || BLACKLIST.has(key)) continue;
      if (!descubiertos.has(key)) {
        descubiertos.set(key, {
          nombre: a.nombre,
          match: 0.5,
          fuentes: [`tag:${tag}`],
          mbid: a.mbid,
        });
        nuevos++;
      }
    }

    console.log(`${artistas.length} artistas, ${nuevos} nuevos`);
    await sleep(DELAY_ENTRE_REQUESTS);
  }

  console.log(`\n  Total candidatos descubiertos: ${descubiertos.size}`);
  return descubiertos;
}

// ============================================================
// FASE 2: FILTRAR ARTISTAS CRISTIANOS
// ============================================================
async function filtrarCristianos(descubiertos) {
  console.log('\n🎯 FASE 2: VERIFICACION DE ARTISTAS CRISTIANOS');
  console.log('─'.repeat(50));

  const verificados = [];
  const candidatos = [...descubiertos.values()]
    .sort((a, b) => {
      // Priorizar: mas fuentes > mayor match > tag directo
      const aScore = a.fuentes.length * 2 + a.match;
      const bScore = b.fuentes.length * 2 + b.match;
      return bScore - aScore;
    })
    .slice(0, MAX_DESCUBIERTOS * 1.5); // Evaluar mas de los que necesitamos

  console.log(`  Evaluando ${candidatos.length} candidatos...`);

  for (let i = 0; i < candidatos.length; i++) {
    if (verificados.length >= MAX_DESCUBIERTOS) break;

    const candidato = candidatos[i];
    process.stdout.write(`  [${i + 1}/${candidatos.length}] ${candidato.nombre}... `);

    // Obtener tags de Last.fm
    const tags = await obtenerTagsArtista(candidato.nombre);
    await sleep(DELAY_ENTRE_REQUESTS);

    const tagNames = tags.map(t => t.nombre);

    // Quick filter: check if tags indicate Christian
    const esCristianoPorTag = esCristianoPorTags(tags);

    // If tags clearly indicate Christian, or if came from a Christian tag search
    const vieneDeTagCristiano = candidato.fuentes.some(f => f.startsWith('tag:'));

    if (esCristianoPorTag || vieneDeTagCristiano) {
      // Fast path: tags confirm it
      const info = await obtenerInfoArtista(candidato.nombre);
      await sleep(DELAY_ENTRE_REQUESTS);

      // Use AI to classify genre and type
      const iaResult = await verificarCristianoConIA(
        candidato.nombre,
        info?.bio || '',
        tagNames
      );
      await sleep(DELAY_ENTRE_REQUESTS);

      if (iaResult && iaResult.es_cristiano && iaResult.confianza >= 60) {
        verificados.push({
          nombre: info?.nombre || candidato.nombre,
          generos: iaResult.generos || ['worship'],
          pais: iaResult.pais || '',
          tipo: iaResult.tipo || 'artista',
          listeners: info?.listeners || 0,
          bio: info?.bio || '',
          fuentes: candidato.fuentes,
          confianza: iaResult.confianza,
          razon: iaResult.razon,
        });
        console.log(`✓ ${iaResult.confianza}% (${iaResult.generos.join(', ')})`);
      } else {
        console.log(`✗ IA dice no cristiano`);
      }
    } else if (candidato.fuentes.length >= 3) {
      // Many sources suggest this artist - verify with AI even if tags don't confirm
      const info = await obtenerInfoArtista(candidato.nombre);
      await sleep(DELAY_ENTRE_REQUESTS);

      const iaResult = await verificarCristianoConIA(
        candidato.nombre,
        info?.bio || '',
        tagNames
      );
      await sleep(DELAY_ENTRE_REQUESTS);

      if (iaResult && iaResult.es_cristiano && iaResult.confianza >= 75) {
        verificados.push({
          nombre: info?.nombre || candidato.nombre,
          generos: iaResult.generos || ['worship'],
          pais: iaResult.pais || '',
          tipo: iaResult.tipo || 'artista',
          listeners: info?.listeners || 0,
          bio: info?.bio || '',
          fuentes: candidato.fuentes,
          confianza: iaResult.confianza,
          razon: iaResult.razon,
        });
        console.log(`✓ ${iaResult.confianza}% (multi-source)`);
      } else {
        console.log(`✗ No confirmado`);
      }
    } else {
      console.log(`⊘ Tags no cristianos, pocas fuentes`);
    }
  }

  // Sort verified: by listeners (popularity) to get a nice mix
  verificados.sort((a, b) => b.listeners - a.listeners);

  console.log(`\n  Artistas cristianos verificados: ${verificados.length}`);

  // Show breakdown by tier
  const famosos = verificados.filter(a => a.listeners > 500000);
  const intermedios = verificados.filter(a => a.listeners > 50000 && a.listeners <= 500000);
  const gemas = verificados.filter(a => a.listeners <= 50000);

  console.log(`    Famosos (>500k listeners): ${famosos.length}`);
  console.log(`    Intermedios (50k-500k): ${intermedios.length}`);
  console.log(`    Gemas ocultas (<50k): ${gemas.length}`);

  return verificados;
}

// ============================================================
// FASE 3: POBLAR DATABASE
// ============================================================
async function poblarDatabase(artistas) {
  console.log('\n📥 FASE 3: POBLANDO DATABASE');
  console.log('─'.repeat(50));

  const resultados = [];

  for (let i = 0; i < artistas.length; i++) {
    const artista = artistas[i];
    const slug = generarSlug(artista.nombre);

    console.log(`\n[${i + 1}/${artistas.length}] ━━━ ${artista.nombre} (${slug}) ━━━`);
    console.log(`  Generos: ${artista.generos.join(', ')} | Pais: ${artista.pais || '??'} | Listeners: ${artista.listeners.toLocaleString()}`);
    console.log(`  Confianza: ${artista.confianza}% | Razon: ${artista.razon || 'N/A'}`);

    // Check if artist already exists (might have been added between phases)
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
      const imagen = await buscarImagenArtista(artista.nombre);

      const { data: nuevo, error } = await supabase
        .from('artistas')
        .insert({
          nombre: artista.nombre,
          slug,
          bio: artista.bio?.substring(0, 500) || '',
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
        resultados.push({ nombre: artista.nombre, canciones: 0, error: true });
        continue;
      }
      artistaId = nuevo.id;
      console.log(`  Creado nuevo (id: ${artistaId.substring(0, 8)}...)`);
    }

    // Search YouTube for songs
    const query = `${artista.nombre} official video`;
    console.log(`  Buscando: "${query}"...`);
    const rawVideos = await buscarYouTube(query, MAX_CANCIONES_POR_ARTISTA * 3);
    const videos = filtrarOficiales(rawVideos, artista.nombre);

    console.log(`  ${rawVideos.length} encontrados, ${videos.length} oficiales`);

    let agregados = 0;

    for (const video of videos) {
      if (agregados >= MAX_CANCIONES_POR_ARTISTA) break;

      const url = `https://www.youtube.com/watch?v=${video.videoId}`;

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
    resultados.push({ nombre: artista.nombre, canciones: agregados, error: false, listeners: artista.listeners });

    await sleep(DELAY_ENTRE_ARTISTAS);
  }

  return resultados;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   GOSPELPLAY - DESCUBRIMIENTO DE ARTISTAS       ║');
  console.log('║   Motor de descubrimiento via Last.fm + IA      ║');
  console.log('╚══════════════════════════════════════════════════╝');

  if (!LASTFM_KEY) {
    console.error('\n❌ ERROR: Necesitas configurar LASTFM_API_KEY');
    console.error('   Obten una gratis en: https://www.last.fm/api/account/create');
    console.error('   Luego agrega LASTFM_API_KEY=tu-key en .env.local');
    process.exit(1);
  }

  if (!ANTHROPIC_KEY) {
    console.warn('\n⚠️  ADVERTENCIA: Sin ANTHROPIC_API_KEY la verificacion sera menos precisa');
  }

  const inicio = Date.now();

  // Fase 1: Descubrir
  const descubiertos = await descubrirArtistas();

  // Fase 2: Filtrar
  const verificados = await filtrarCristianos(descubiertos);

  if (verificados.length === 0) {
    console.log('\n❌ No se encontraron artistas nuevos para agregar.');
    return;
  }

  // Fase 3: Poblar
  const resultados = await poblarDatabase(verificados);

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  const totalCanciones = resultados.reduce((s, r) => s + r.canciones, 0);
  const conCanciones = resultados.filter(r => r.canciones > 0).length;
  const errores = resultados.filter(r => r.error).length;
  const duracion = Math.round((Date.now() - inicio) / 1000 / 60);

  console.log('\n\n╔══════════════════════════════════════════════════╗');
  console.log('║   RESUMEN FINAL - DESCUBRIMIENTO                ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Candidatos evaluados: ${descubiertos.size}`);
  console.log(`  Artistas verificados: ${verificados.length}`);
  console.log(`  Artistas con canciones: ${conCanciones}`);
  console.log(`  Total canciones agregadas: ${totalCanciones}`);
  console.log(`  Errores: ${errores}`);
  console.log(`  Duracion: ~${duracion} minutos`);

  // Top artistas por canciones
  console.log('\n  🎵 Top artistas descubiertos:');
  const top = resultados
    .filter(r => r.canciones > 0)
    .sort((a, b) => b.canciones - a.canciones)
    .slice(0, 20);

  for (const r of top) {
    const tier = r.listeners > 500000 ? '⭐' : r.listeners > 50000 ? '🎤' : '💎';
    console.log(`  ${tier} ${r.nombre}: ${r.canciones} canciones (${r.listeners?.toLocaleString() || '?'} listeners)`);
  }

  console.log('\n  ⭐ = Famoso  🎤 = Intermedio  💎 = Gema oculta');
}

main().catch(console.error);
