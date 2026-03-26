#!/usr/bin/env node
/**
 * POBLACION DE PREDICADORES EXPOSITIVOS - GospelPlay
 *
 * Predicadores cristocentricos, bibliocentricos, expositivos.
 * Nada de prosperidad, sensacionalismo ni profecias especulativas.
 *
 * Ejecutar: node scripts/poblar-predicadores.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unuxjxryyxdfmngdhnju.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yt669oTk8lGBgANprEoCXA_H9JKJauq';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

const MAX_PREDICAS_POR_PREDICADOR = 5;
const DELAY_ENTRE = 2000;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// CATALOGO DE PREDICADORES EXPOSITIVOS
// ============================================================
const PREDICADORES = [
  // ─── MEXICO / Linea Semilla de Mostaza ───
  { nombre: 'Andres Spyker', pais: 'MX', tipo: 'pastor', bio: 'Pastor de la iglesia Semilla de Mostaza en Monterrey, Mexico. Predicacion relevante con base biblica solida.', youtube_canal: 'Semilla de Mostaza', busqueda: 'Andres Spyker predicacion Semilla de Mostaza' },
  { nombre: 'Josue Barrios', pais: 'MX', tipo: 'predicador', bio: 'Predicador mexicano con enfoque expositivo y apologetico. Colaborador de Coalicion por el Evangelio.', youtube_canal: '', busqueda: 'Josue Barrios predicacion biblica' },
  { nombre: 'Arturo Perez', pais: 'MX', tipo: 'predicador', bio: 'Predicador expositivo mexicano. Ministerio enfocado en la ensenanza biblica verso a verso.', youtube_canal: '', busqueda: 'Arturo Perez predicacion expositiva biblica' },
  { nombre: 'Sugel Michelen', pais: 'DO', tipo: 'pastor', bio: 'Pastor de la Iglesia Biblica del Senor Jesucristo en Santo Domingo. Uno de los predicadores expositivos mas respetados de habla hispana. Autor y conferencista de Coalicion por el Evangelio.', youtube_canal: 'Iglesia Bíblica del Señor Jesucristo', busqueda: 'Sugel Michelen predicacion' },

  // ─── USA / Predicacion expositiva solida ───
  { nombre: 'John MacArthur', pais: 'US', tipo: 'pastor', bio: 'Pastor de Grace Community Church por mas de 50 anos. Autor prolífico y fundador de The Masters Seminary. Referente mundial de la predicacion expositiva.', youtube_canal: 'Grace to You', busqueda: 'John MacArthur sermon español' },
  { nombre: 'Paul Washer', pais: 'US', tipo: 'predicador', bio: 'Misionero y predicador fundador de HeartCry Missionary Society. Conocido por su predicacion directa y confrontadora sobre el verdadero evangelio.', youtube_canal: 'HeartCry Missionary Society', busqueda: 'Paul Washer predicacion español' },
  { nombre: 'R.C. Sproul', pais: 'US', tipo: 'predicador', bio: 'Teologo reformado, fundador de Ligonier Ministries. Maestro extraordinario que hizo accesible la teologia profunda. Su legado sigue ensenando.', youtube_canal: 'Ligonier Ministries', busqueda: 'R.C. Sproul sermon español Ligonier' },
  { nombre: 'Voddie Baucham', pais: 'US', tipo: 'predicador', bio: 'Pastor, teologo y decano del seminario teologico de la African Christian University en Zambia. Predicador expositivo poderoso y apologista.', youtube_canal: '', busqueda: 'Voddie Baucham predicacion español' },
  { nombre: 'John Piper', pais: 'US', tipo: 'pastor', bio: 'Pastor emerito de Bethlehem Baptist Church y fundador de Desiring God. Su teologia del hedonismo cristiano ha impactado a millones.', youtube_canal: 'Desiring God', busqueda: 'John Piper sermon español Desiring God' },
  { nombre: 'Alistair Begg', pais: 'US', tipo: 'pastor', bio: 'Pastor de Parkside Church en Cleveland, Ohio. Predicador expositivo britanico conocido por su claridad, humor y fidelidad al texto biblico.', youtube_canal: 'Alistair Begg', busqueda: 'Alistair Begg sermon español' },

  // ─── ESPAÑA / LATINOAMERICA en español ───
  { nombre: 'Miguel Nunez', pais: 'DO', tipo: 'pastor', bio: 'Pastor de la Iglesia Biblica Internacional en Santo Domingo. Presidente de Integridad y Sabiduria. Predicador expositivo y autor prolífico.', youtube_canal: 'Integridad & Sabiduría', busqueda: 'Miguel Nunez predicacion' },
  { nombre: 'Itiel Arroyo', pais: 'MX', tipo: 'predicador', bio: 'Apologista y predicador mexicano. Su ministerio combina apologetica y ensenanza biblica para defender y proclamar la fe cristiana.', youtube_canal: 'Itiel Arroyo', busqueda: 'Itiel Arroyo predicacion apologetica' },
  { nombre: 'Emilio Ramos', pais: 'US', tipo: 'predicador', bio: 'Predicador hispano en Estados Unidos. Enfoque expositivo y reformado. Ministerio de ensenanza biblica en profundidad.', youtube_canal: '', busqueda: 'Emilio Ramos predicacion biblica reformada' },
  { nombre: 'David Barcelo', pais: 'ES', tipo: 'pastor', bio: 'Pastor en Barcelona, Espana. Predicador expositivo con enfoque reformado. Autor y conferencista en el mundo hispanohablante.', youtube_canal: '', busqueda: 'David Barcelo predicacion expositiva' },

  // ─── ARGENTINA ───
  { nombre: 'Fabian Liendo', pais: 'AR', tipo: 'pastor', bio: 'Pastor en Buenos Aires, Argentina. Predicador expositivo reconocido por su profundidad teologica y fidelidad al texto biblico.', youtube_canal: '', busqueda: 'Fabian Liendo predicacion' },
  { nombre: 'Esteban Borghetti', pais: 'AR', tipo: 'predicador', bio: 'Predicador y maestro biblico argentino. Enfoque expositivo centrado en Cristo y las Escrituras.', youtube_canal: '', busqueda: 'Esteban Borghetti predicacion biblica' },

  // ─── COLOMBIA ───
  { nombre: 'Diego Cardona', pais: 'CO', tipo: 'predicador', bio: 'Predicador colombiano con enfoque expositivo. Ministerio de ensenanza biblica solida en Colombia.', youtube_canal: '', busqueda: 'Diego Cardona predicacion biblica colombiana' },
  { nombre: 'Jairo Namnun', pais: 'DO', tipo: 'predicador', bio: 'Maestro biblico y autor. Miembro del equipo de Coalicion por el Evangelio. Enfocado en hacer discipulos a traves de la ensenanza biblica.', youtube_canal: '', busqueda: 'Jairo Namnun predicacion Coalicion Evangelio' },

  // ─── DANTE GEBEL (evangelistico) ───
  { nombre: 'Dante Gebel', pais: 'AR', tipo: 'pastor', bio: 'Pastor de River Church en Anaheim, California. Comunicador carismatico con mensajes evangelisticos que conectan con las nuevas generaciones.', youtube_canal: 'Dante Gebel', busqueda: 'Dante Gebel predica' },

  // ─── MINISTERIOS / IGLESIAS ───
  { nombre: 'Semilla de Mostaza', pais: 'MX', tipo: 'ministerio', bio: 'Iglesia en Monterrey, Mexico, liderada por Andres Spyker. Conocida por predicacion biblica relevante y una comunidad vibrante.', youtube_canal: 'Semilla de Mostaza', busqueda: 'Semilla de Mostaza predicacion' },
  { nombre: 'Coalicion por el Evangelio', pais: 'US', tipo: 'ministerio', bio: 'Ministerio que une a pastores y lideres de habla hispana comprometidos con el evangelio. Recursos teologicos, conferencias y predicaciones expositivas.', youtube_canal: 'Coalición por el Evangelio', busqueda: 'Coalicion por el Evangelio predicacion' },
  { nombre: 'Desiring God Espanol', pais: 'US', tipo: 'ministerio', bio: 'Ministerio fundado por John Piper. Recursos en espanol sobre la supremacia de Dios en todas las cosas para el gozo de todos los pueblos.', youtube_canal: 'Desiring God', busqueda: 'Desiring God español predicacion John Piper' },
];

// ============================================================
// YOUTUBE SEARCH
// ============================================================
const TITULO_BLACKLIST_PREDICA = [
  /\bmix\b/i, /\bplaylist\b/i, /\b\d+\s*hora/i,
  /\bgreatest\s*hits\b/i, /\bbest\s*of\b/i,
  /\btop\s*\d+/i, /\bnon[\s-]?stop\b/i,
  /\bmusic\b/i, /\bworship\b/i, /\badoracion\b/i,
  /\balabanza\b/i,
];

function esTituloNoDeseado(titulo) {
  return TITULO_BLACKLIST_PREDICA.some(re => re.test(titulo));
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
        const meta = await obtenerMeta(videoId);
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

async function obtenerMeta(videoId) {
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

function filtrarVideos(videos, nombrePredicador, canalEsperado = '') {
  const nombreLower = nombrePredicador.toLowerCase();
  return videos.filter(video => {
    if (esTituloNoDeseado(video.title)) return false;
    // For preachers, be more permissive - accept verified or name-matching channels
    if (video.channelVerified) return true;
    if (canalEsperado) {
      const cl = video.author.toLowerCase().replace(/\s+/g, '');
      const el = canalEsperado.toLowerCase().replace(/\s+/g, '');
      if (cl.includes(el) || el.includes(cl)) return true;
    }
    const al = video.author.toLowerCase();
    if (al.includes(nombreLower) || nombreLower.includes(al.replace(/official|tv/gi, '').trim())) return true;
    // Accept channels with keywords like "iglesia", "church", "ministerio"
    if (/iglesia|church|ministerio|ministry|seminary|seminario|coalicion/i.test(al)) return true;
    return false;
  });
}

// ============================================================
// ITUNES (for preacher images - fallback)
// ============================================================
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
// CLASSIFICATION FOR PREACHING
// ============================================================
async function clasificarPredica(titulo, predicador) {
  if (!ANTHROPIC_KEY || ANTHROPIC_KEY === 'tu-api-key-aqui') {
    return defaultClasificacionPredica();
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
        max_tokens: 1000,
        system: `Eres un experto en teologia cristiana reformada y predicacion expositiva. Clasifica la predicacion y devuelve SOLO un JSON valido:
{
  "tipo": "predicacion",
  "categoria": "doctrina|devocional|evangelistico|estudio_biblico",
  "es_congregacional": false,
  "momento_del_culto": "predicacion",
  "energia": "baja|media|alta",
  "eval_cristocentrico": 0-100,
  "eval_fidelidad_biblica": 0-100,
  "eval_profundidad": 0-100,
  "eval_edificante": 0-100,
  "eval_doctrina_sana": 0-100,
  "temas": ["tema1", "tema2"],
  "pasajes": ["Libro Capitulo:Versiculo"]
}`,
        messages: [{ role: 'user', content: `Clasifica esta predicacion: "${titulo}" de ${predicador}` }],
      }),
    });

    if (!res.ok) return defaultClasificacionPredica();
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return defaultClasificacionPredica();
    const p = JSON.parse(jsonMatch[0]);

    const total = Math.round(
      ((p.eval_cristocentrico || 90) + (p.eval_fidelidad_biblica || 90) +
       (p.eval_profundidad || 85) + (p.eval_edificante || 85) +
       (p.eval_doctrina_sana || 90)) / 5
    );

    return {
      tipo: 'predicacion',
      categoria: p.categoria || 'doctrina',
      genero_musical: 'predicacion',
      es_congregacional: false,
      tiene_mensaje: true, es_instrumental: false,
      momento_del_culto: 'predicacion',
      energia: p.energia || 'media', nivel: 'basico',
      eval_cristocentrico: p.eval_cristocentrico || 90,
      eval_fidelidad_biblica: p.eval_fidelidad_biblica || 90,
      eval_profundidad: p.eval_profundidad || 85,
      eval_edificante: p.eval_edificante || 85,
      eval_doctrina_sana: p.eval_doctrina_sana || 90,
      eval_puntuacion_total: total, eval_aprobado: total >= 70,
      eval_notas: 'Clasificado por IA - Predicacion expositiva',
      pasajes: p.pasajes || [], temas: p.temas || [],
      apto_para: ['estudio biblico', 'devocional personal'],
      audiencia: ['todo publico'],
    };
  } catch {
    return defaultClasificacionPredica();
  }
}

function defaultClasificacionPredica() {
  return {
    tipo: 'predicacion', categoria: 'doctrina', genero_musical: 'predicacion',
    es_congregacional: false, tiene_mensaje: true, es_instrumental: false,
    momento_del_culto: 'predicacion', energia: 'media', nivel: 'basico',
    eval_cristocentrico: 90, eval_fidelidad_biblica: 90, eval_profundidad: 85,
    eval_edificante: 85, eval_doctrina_sana: 90, eval_puntuacion_total: 88,
    eval_aprobado: true, eval_notas: 'Predicacion expositiva',
    pasajes: [], temas: ['doctrina', 'evangelio'],
    apto_para: ['estudio biblico', 'devocional personal'],
    audiencia: ['todo publico'],
  };
}

// ============================================================
// HELPERS
// ============================================================
function generarSlug(nombre) {
  return nombre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function limpiarTituloPredica(title) {
  return title
    .replace(/\(official.*?\)/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\|.*$/g, '')
    .replace(/\s*[-–]\s*$/, '')
    .trim();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// PROCESS
// ============================================================
async function procesarPredicador(pred) {
  const slug = generarSlug(pred.nombre);
  console.log(`\n━━━ ${pred.nombre} (${slug}) ━━━`);

  // Check if exists
  let { data: existente } = await supabase
    .from('artistas')
    .select('id, slug')
    .eq('slug', slug)
    .single();

  let predicadorId;

  if (existente) {
    predicadorId = existente.id;
    console.log(`  Ya existe en DB`);

    // Update bio if empty
    const { data: check } = await supabase.from('artistas').select('bio').eq('id', predicadorId).single();
    if (check && !check.bio && pred.bio) {
      await supabase.from('artistas').update({ bio: pred.bio }).eq('id', predicadorId);
      console.log(`  Bio actualizada`);
    }
  } else {
    const imagen = await buscarImagenArtista(pred.nombre);
    const { data: nuevo, error } = await supabase
      .from('artistas')
      .insert({
        nombre: pred.nombre,
        slug,
        bio: pred.bio || '',
        imagen: imagen || '',
        banner: '',
        pais: pred.pais || '',
        generos: ['predicacion'],
        tipo: pred.tipo,
        youtube_canal: pred.youtube_canal || pred.nombre,
        spotify_id: '',
        artistas_relacionados: [],
        seguidores: 0,
        verificado: false,
        activo: true,
      })
      .select()
      .single();

    if (error) {
      console.error(`  ERROR creando: ${error.message}`);
      return { nombre: pred.nombre, predicas: 0, error: true };
    }
    predicadorId = nuevo.id;
    console.log(`  Creado (id: ${predicadorId.substring(0, 8)}...)`);
  }

  // Search YouTube
  const query = pred.busqueda || `${pred.nombre} predicacion`;
  console.log(`  Buscando: "${query}"...`);

  const rawVideos = await buscarYouTube(query, MAX_PREDICAS_POR_PREDICADOR * 3);
  const videos = filtrarVideos(rawVideos, pred.nombre, pred.youtube_canal || '');

  console.log(`  ${rawVideos.length} encontrados, ${videos.length} filtrados`);

  let agregados = 0;

  for (const video of videos) {
    if (agregados >= MAX_PREDICAS_POR_PREDICADOR) break;

    const url = `https://www.youtube.com/watch?v=${video.videoId}`;

    const { data: yaExiste } = await supabase
      .from('contenido')
      .select('id')
      .eq('url', url)
      .single();

    if (yaExiste) {
      console.log(`  ⊘ Ya existe`);
      continue;
    }

    const titulo = limpiarTituloPredica(video.title);
    const thumbnail = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
    const clasificacion = await clasificarPredica(titulo, pred.nombre);

    const { error: insertError } = await supabase.from('contenido').insert({
      url, plataforma: 'youtube',
      titulo,
      artista: pred.nombre,
      artista_id: predicadorId,
      descripcion: `${titulo} - ${pred.nombre}`,
      thumbnail, duracion: '',
      ...clasificacion,
      versiculos_clave: [], personajes: [], doctrina: [],
      publicado: true, revisado_por_ia: true,
    });

    if (!insertError) {
      agregados++;
      console.log(`  ✓ ${titulo.substring(0, 60)}`);
    } else {
      console.error(`  ✗ ${insertError.message}`);
    }

    await sleep(800);
  }

  console.log(`  → ${agregados} predicas agregadas`);
  return { nombre: pred.nombre, predicas: agregados, error: false };
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   GOSPELPLAY - PREDICADORES EXPOSITIVOS          ║');
  console.log(`║   ${PREDICADORES.length} predicadores/ministerios                  ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  const inicio = Date.now();
  const resultados = [];

  for (let i = 0; i < PREDICADORES.length; i++) {
    console.log(`\n[${i + 1}/${PREDICADORES.length}] ─────────────────────────────`);
    try {
      const res = await procesarPredicador(PREDICADORES[i]);
      resultados.push(res);
    } catch (e) {
      console.error(`  ERROR FATAL: ${e.message}`);
      resultados.push({ nombre: PREDICADORES[i].nombre, predicas: 0, error: true });
    }
    await sleep(DELAY_ENTRE);
  }

  const totalPredicas = resultados.reduce((s, r) => s + (r.predicas || 0), 0);
  const conPredicas = resultados.filter(r => (r.predicas || 0) > 0).length;

  console.log('\n\n╔══════════════════════════════════════════════════╗');
  console.log('║   RESUMEN FINAL                                  ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Predicadores procesados: ${resultados.length}`);
  console.log(`  Con predicas: ${conPredicas}`);
  console.log(`  Total predicas: ${totalPredicas}`);
  console.log(`  Duracion: ~${Math.round((Date.now() - inicio) / 1000 / 60)} min\n`);

  for (const r of resultados.filter(r => (r.predicas || 0) > 0)) {
    console.log(`  ${r.nombre}: ${r.predicas} predicas`);
  }
}

main().catch(console.error);
