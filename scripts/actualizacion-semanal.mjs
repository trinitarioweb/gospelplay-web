#!/usr/bin/env node
/**
 * ACTUALIZACION SEMANAL - GospelPlay
 *
 * Corre cada lunes via GitHub Actions. Hace 3 cosas:
 * 1. Busca canciones NUEVAS de artistas existentes (nuevos lanzamientos)
 * 2. Descubre 10-20 artistas nuevos via Last.fm
 * 3. Limpia contenido que ya no funciona en YouTube
 *
 * Diseñado para correr en ~30 min max.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local if running locally
try {
  const { readFileSync } = await import('fs');
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const LASTFM_KEY = process.env.LASTFM_API_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Faltan SUPABASE_URL o SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MAX_NUEVAS_POR_ARTISTA = 3;
const MAX_ARTISTAS_NUEVOS = 15;
const DELAY = 1500;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const log = [];
function logMsg(msg) { console.log(msg); log.push(msg); }

// ============================================================
// YOUTUBE SEARCH
// ============================================================
const TITULO_BLACKLIST = [
  /\bmix\b/i, /\bmejores\s*(éxitos|exitos)\b/i, /\brecopilaci[oó]n\b/i,
  /\bplaylist\b/i, /\b\d+\s*hora/i, /\bfull\s*album\b/i,
  /\bcompleto\b/i, /\bgreatest\s*hits\b/i, /\bbest\s*of\b/i,
  /\btop\s*\d+/i, /\bcollection\b/i, /\bnon[\s-]?stop\b/i,
];

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
    if (!dataMatch) return [];

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
          return s.includes('VERIFIED');
        });
        results.push({
          videoId: video.videoId,
          title: video.title?.runs?.[0]?.text || '',
          author: video.ownerText?.runs?.[0]?.text || '',
          channelVerified: isVerified,
        });
        if (results.length >= maxResults) break;
      }
      if (results.length >= maxResults) break;
    }
    return results;
  } catch { return []; }
}

function filtrarOficiales(videos, nombreArtista) {
  const nombreLower = nombreArtista.toLowerCase();
  return videos.filter(video => {
    if (TITULO_BLACKLIST.some(re => re.test(video.title))) return false;
    if (video.channelVerified) return true;
    const al = video.author.toLowerCase();
    if (al.includes(nombreLower) || nombreLower.includes(al.replace(/vevo|official|music|tv/gi, '').trim())) return true;
    return false;
  });
}

function limpiarTitulo(title, author) {
  let track = title
    .replace(/\(official\s*(music\s*)?video\)/gi, '')
    .replace(/\(video\s*oficial\)/gi, '')
    .replace(/\(lyric\s*video\)/gi, '')
    .replace(/\(audio\s*oficial\)/gi, '')
    .replace(/\(official\s*audio\)/gi, '')
    .replace(/\[official.*?\]/gi, '')
    .replace(/\(live\)/gi, '').replace(/\(en\s*vivo\)/gi, '')
    .replace(/ft\.?\s*.*/gi, '').replace(/feat\.?\s*.*/gi, '')
    .replace(/\|.*/g, '').replace(/\s*[-–]\s*$/, '').trim();

  let artist = author.replace(/VEVO$/i, '').replace(/\s*-\s*Topic$/i, '')
    .replace(/Official$/i, '').replace(/Music$/i, '').trim();

  const dashMatch = track.match(/^(.+?)\s*[-–]\s+(.+)$/);
  if (dashMatch) {
    const pa = dashMatch[1].trim();
    if (pa.toLowerCase().includes(artist.toLowerCase().substring(0, 5))) {
      track = dashMatch[2].trim();
    }
  }
  return { track: track || title, artist: artist || author };
}

async function buscarArtwork(titulo, artista) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(`${artista} ${titulo}`)}&media=music&entity=song&limit=3`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.resultCount > 0) return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
    return null;
  } catch { return null; }
}

// ============================================================
// LAST.FM
// ============================================================
async function lastfmSimilar(artistName, limit = 10) {
  if (!LASTFM_KEY) return [];
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json&limit=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.similarartists?.artist || []).map(a => a.name);
  } catch { return []; }
}

async function lastfmTags(artistName) {
  if (!LASTFM_KEY) return [];
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.toptags?.tag || []).map(t => t.name.toLowerCase());
  } catch { return []; }
}

function esTagCristiano(tags) {
  const kw = ['christian', 'gospel', 'worship', 'ccm', 'praise', 'cristiano', 'alabanza', 'adoracion'];
  return tags.some(t => kw.some(k => t.includes(k)));
}

// ============================================================
// AI CLASSIFICATION (optional)
// ============================================================
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
        messages: [{ role: 'user', content: `Clasifica esta cancion cristiana. Responde SOLO JSON:
{"tipo":"musica","categoria":"adoracion","genero_musical":"worship","es_congregacional":true,"momento_del_culto":"adoracion_profunda","energia":"media","eval_cristocentrico":85,"eval_fidelidad_biblica":85,"eval_profundidad":80,"eval_edificante":85,"eval_doctrina_sana":85,"temas":["adoracion"],"pasajes":[]}

Cancion: "${titulo}" de ${artista}` }],
      }),
    });
    if (!res.ok) return defaultClasificacion();
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return defaultClasificacion();
    const p = JSON.parse(m[0]);
    const total = Math.round(((p.eval_cristocentrico||85)+(p.eval_fidelidad_biblica||85)+(p.eval_profundidad||80)+(p.eval_edificante||85)+(p.eval_doctrina_sana||85))/5);
    return { ...defaultClasificacion(), ...p, eval_puntuacion_total: total, eval_aprobado: total >= 70 };
  } catch { return defaultClasificacion(); }
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
  return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ============================================================
// TAREA 1: Nuevas canciones de artistas existentes
// ============================================================
async function buscarNuevasDeExistentes() {
  logMsg('\n📀 TAREA 1: Buscando nuevas canciones de artistas existentes...');

  const { data: artistas } = await supabase
    .from('artistas')
    .select('id, nombre, tipo')
    .eq('activo', true)
    .order('nombre');

  if (!artistas) return 0;

  // Pick random 50 artists to check (don't check all 400+ every week)
  const shuffled = artistas.sort(() => Math.random() - 0.5).slice(0, 50);
  let totalNuevas = 0;

  for (const artista of shuffled) {
    if (artista.tipo === 'pastor' || artista.tipo === 'predicador') continue;

    const query = `${artista.nombre} official music video 2025 2026`;
    const videos = await buscarYouTube(query, 8);
    const oficiales = filtrarOficiales(videos, artista.nombre);

    let agregadas = 0;
    for (const video of oficiales) {
      if (agregadas >= MAX_NUEVAS_POR_ARTISTA) break;
      const url = `https://www.youtube.com/watch?v=${video.videoId}`;

      const { data: existe } = await supabase.from('contenido').select('id').eq('url', url).single();
      if (existe) continue;

      const { track, artist } = limpiarTitulo(video.title, video.author);
      const artwork = await buscarArtwork(track, artist || artista.nombre);
      const thumbnail = artwork || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
      const clasificacion = await clasificarConIA(track, artist || artista.nombre);

      const { error } = await supabase.from('contenido').insert({
        url, plataforma: 'youtube', titulo: track,
        artista: artist || artista.nombre, artista_id: artista.id,
        descripcion: `${track} - ${artist || artista.nombre}`,
        thumbnail, duracion: '', ...clasificacion,
        versiculos_clave: [], personajes: [], doctrina: [],
        publicado: true, revisado_por_ia: true,
      });

      if (!error) {
        agregadas++;
        totalNuevas++;
        logMsg(`  ✓ ${artista.nombre}: ${track}`);
      }
      await sleep(500);
    }
    await sleep(DELAY);
  }

  logMsg(`  Total nuevas canciones: ${totalNuevas}`);
  return totalNuevas;
}

// ============================================================
// TAREA 2: Descubrir artistas nuevos
// ============================================================
async function descubrirNuevos() {
  logMsg('\n🔍 TAREA 2: Descubriendo artistas nuevos via Last.fm...');

  if (!LASTFM_KEY) {
    logMsg('  Sin LASTFM_API_KEY, saltando descubrimiento');
    return 0;
  }

  // Get existing artist names
  const { data: existentes } = await supabase.from('artistas').select('nombre');
  const existentesSet = new Set((existentes || []).map(a => a.nombre.toLowerCase()));

  // Pick 10 random existing artists as seeds
  const seeds = (existentes || []).sort(() => Math.random() - 0.5).slice(0, 10);
  const candidatos = new Map();

  for (const seed of seeds) {
    const similares = await lastfmSimilar(seed.nombre, 10);
    for (const sim of similares) {
      if (existentesSet.has(sim.toLowerCase())) continue;
      if (!candidatos.has(sim.toLowerCase())) {
        candidatos.set(sim.toLowerCase(), { nombre: sim, fuentes: [seed.nombre] });
      } else {
        candidatos.get(sim.toLowerCase()).fuentes.push(seed.nombre);
      }
    }
    await sleep(DELAY);
  }

  // Verify Christian tags and add
  let agregados = 0;
  const sorted = [...candidatos.values()].sort((a, b) => b.fuentes.length - a.fuentes.length);

  for (const candidato of sorted) {
    if (agregados >= MAX_ARTISTAS_NUEVOS) break;

    const tags = await lastfmTags(candidato.nombre);
    await sleep(500);

    if (!esTagCristiano(tags)) continue;

    // Search YouTube
    const videos = await buscarYouTube(`${candidato.nombre} official video`, 10);
    const oficiales = filtrarOficiales(videos, candidato.nombre);
    if (oficiales.length === 0) continue;

    // Create artist
    const slug = generarSlug(candidato.nombre);
    const artworkImg = await buscarArtwork('', candidato.nombre);

    const { data: nuevo, error: artErr } = await supabase.from('artistas').insert({
      nombre: candidato.nombre, slug, bio: '', imagen: artworkImg || '',
      banner: '', pais: '', generos: ['worship'], tipo: 'artista',
      youtube_canal: candidato.nombre, spotify_id: '',
      artistas_relacionados: [], seguidores: 0, verificado: false, activo: true,
    }).select().single();

    if (artErr) continue;

    // Add songs
    let canciones = 0;
    for (const video of oficiales.slice(0, 3)) {
      const url = `https://www.youtube.com/watch?v=${video.videoId}`;
      const { data: existe } = await supabase.from('contenido').select('id').eq('url', url).single();
      if (existe) continue;

      const { track, artist } = limpiarTitulo(video.title, video.author);
      const artwork = await buscarArtwork(track, artist || candidato.nombre);
      const thumbnail = artwork || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
      const clasificacion = await clasificarConIA(track, artist || candidato.nombre);

      const { error } = await supabase.from('contenido').insert({
        url, plataforma: 'youtube', titulo: track,
        artista: artist || candidato.nombre, artista_id: nuevo.id,
        descripcion: `${track} - ${artist || candidato.nombre}`,
        thumbnail, duracion: '', ...clasificacion,
        versiculos_clave: [], personajes: [], doctrina: [],
        publicado: true, revisado_por_ia: true,
      });

      if (!error) canciones++;
      await sleep(500);
    }

    if (canciones > 0) {
      agregados++;
      logMsg(`  ✓ Nuevo: ${candidato.nombre} (${canciones} canciones) - similar a ${candidato.fuentes[0]}`);
    }
    await sleep(DELAY);
  }

  logMsg(`  Total artistas nuevos: ${agregados}`);
  return agregados;
}

// ============================================================
// TAREA 3: Limpiar contenido roto
// ============================================================
async function limpiarRoto() {
  logMsg('\n🧹 TAREA 3: Verificando contenido...');

  // Check a random sample of 50 videos
  const { data: muestra } = await supabase
    .from('contenido')
    .select('id, url, titulo')
    .eq('plataforma', 'youtube')
    .limit(50)
    .order('created_at', { ascending: true }); // Oldest first

  if (!muestra) return 0;

  let eliminados = 0;
  for (const item of muestra) {
    const videoId = item.url.match(/v=([a-zA-Z0-9_-]{11})/)?.[1];
    if (!videoId) continue;

    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${item.url}&format=json`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        await supabase.from('contenido').delete().eq('id', item.id);
        eliminados++;
        logMsg(`  ✗ Eliminado (video no disponible): ${item.titulo}`);
      }
    } catch {}
    await sleep(300);
  }

  logMsg(`  Contenido roto eliminado: ${eliminados}`);
  return eliminados;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const fecha = new Date().toISOString().split('T')[0];
  logMsg('╔══════════════════════════════════════════════════╗');
  logMsg('║   GOSPELPLAY - ACTUALIZACION SEMANAL             ║');
  logMsg(`║   ${fecha}                                        ║`);
  logMsg('╚══════════════════════════════════════════════════╝');

  const inicio = Date.now();

  const nuevasCanciones = await buscarNuevasDeExistentes();
  const nuevosArtistas = await descubrirNuevos();
  const contenidoRoto = await limpiarRoto();

  const { count: totalArtistas } = await supabase.from('artistas').select('id', { count: 'exact', head: true });
  const { count: totalContenido } = await supabase.from('contenido').select('id', { count: 'exact', head: true });
  const duracion = Math.round((Date.now() - inicio) / 1000 / 60);

  logMsg('\n╔══════════════════════════════════════════════════╗');
  logMsg('║   RESUMEN                                        ║');
  logMsg('╚══════════════════════════════════════════════════╝');
  logMsg(`  Nuevas canciones: ${nuevasCanciones}`);
  logMsg(`  Nuevos artistas: ${nuevosArtistas}`);
  logMsg(`  Contenido roto eliminado: ${contenidoRoto}`);
  logMsg(`  Total artistas: ${totalArtistas}`);
  logMsg(`  Total contenido: ${totalContenido}`);
  logMsg(`  Duracion: ${duracion} min`);

  // Save log
  writeFileSync(resolve(__dirname, 'actualizacion-semanal-log.txt'), log.join('\n'));
}

main().catch(e => {
  console.error('ERROR FATAL:', e);
  process.exit(1);
});
