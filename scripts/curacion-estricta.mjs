#!/usr/bin/env node
/**
 * CURACIÓN ESTRICTA DEL CATÁLOGO
 *
 * Enfoque whitelist: solo se quedan artistas que:
 * 1. Estén en la lista CONFIRMADOS (artistas cristianos conocidos)
 * 2. Tengan tags cristianos FUERTES en Last.fm (top 3 tags)
 *
 * Todo lo demás se elimina. También limpia contenido basura.
 *
 * Genera SQL para ejecutar en Supabase SQL Editor.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const SUPABASE_URL = 'https://unuxjxryyxdfmngdhnju.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yt669oTk8lGBgANprEoCXA_H9JKJauq';
const LASTFM_KEY = process.env.LASTFM_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// ARTISTAS 100% CONFIRMADOS - LA WHITELIST MAESTRA
// ============================================================
const CONFIRMADOS = new Set([
  // ── WORSHIP ESPAÑOL ──
  'marcos witt', 'jesus adrian romero', 'danilo montero', 'miel san marcos',
  'su presencia', 'barak', 'christine dclario', 'alex campos', 'evan craft',
  'marco barrientos', 'julio melgar', 'coalo zamorano', 'generacion 12',
  'montesanto', 'averly morillo', 'living', 'twice musica', 'kairo worship',
  'alfareros', 'new wine', 'xtreme kids', 'samuel hernandez', 'un corazon',
  'marcela gandara', 'ingrid rosario', 'marcos brunet', 'josue avila',
  'su presencia worship', 'gateway worship español', 'vino nuevo',
  'en espíritu y en verdad', 'esperanza de vida', 'peregrinos y extranjeros',
  'annette moreno', 'julissa', 'daniel calveti', 'juan carlos alvarado',
  'edgar lira', 'pablo olivares', 'harold guerra', 'ericson alexander molano',
  'rené gonzález', 'fernel monroy', 'marcos vidal', 'lilly goodman',
  'tercer cielo', 'jeseth', 'nancy amancio', 'abel zavala', 'jose luis reyes',
  'lucia parker', 'kyosko', 'rescate', 'rojo',

  // ── WORSHIP INGLÉS ──
  'hillsong worship', 'elevation worship', 'bethel music', 'maverick city music',
  'chris tomlin', 'kari jobe', 'cityalight', 'phil wickham', 'brandon lake',
  'brooke ligertwood', 'hillsong united', 'hillsong young and free',
  'jesus culture', 'passion', 'matt redman', 'sinach', 'don moen',
  'tasha cobbs leonard', 'chandler moore', 'upperroom', 'shane and shane',
  'leeland', 'vertical worship', 'hillsong chapel', 'elevation rhythm',
  'darlene zschech', 'tim hughes', 'kim walker-smith', 'kristian stanfill',
  'ron kenoly', 'lincoln brewster', 'sonicflood', 'chris mcclarney',
  'cody carnes', 'matt maher', 'rend collective', 'housefires',
  'planetshakers', 'red rocks worship', 'mosaic msc', 'desperation band',
  'new life worship', 'united pursuit band', 'vineyard music',
  'maranatha! music', 'sovereign grace music', 'gateway worship',
  'all sons & daughters', 'john mark mcmillan', 'david leonard',
  'benjamin william hastings', 'pat barrett', 'charity gayle',
  'anna golden', 'keith & kristyn getty', 'kings kaleidoscope',
  'josh garrels', 'audrey assad', 'sandra mccracken', 'fernando ortega',
  'enter the worship circle', 'sean feucht',

  // ── POP / CCM ──
  'lauren daigle', 'for king and country', 'casting crowns', 'tobymac',
  'mercyme', 'matthew west', 'cory asbury', 'anne wilson', 'we the kingdom',
  'cain', 'newsboys', 'danny gokey', 'tauren wells', 'riley clemmons',
  'terrian', 'blanca', 'jordan feliz', 'katy nichole', 'forrest frank',
  'blessing offor', 'steven curtis chapman', 'rebecca st. james',
  'francesca battistelli', 'mandisa', 'zach williams', 'crowder',
  'we are messengers', 'colton dixon', 'sidewalk prophets', 'ben fuller',
  'ryan stevenson', 'brandon heath', 'britt nicole', 'jamie grace',
  'rachael lampa', 'sandi patty', 'keith green', 'jason gray', 'selah',
  'point of grace', 'michael w. smith', 'josh wilson', 'jonny diaz',
  'joy williams', 'beckah shae', 'kathy troccoli', 'clay crosse',
  'steve green', 'hollyn', 'tasha layton', 'dan bremnes', 'micah tyler',
  'jordan st. cyr', 'leanna crawford', 'elle limebear', 'austin french',
  'chris august', 'laura story', 'meredith andrews', 'kerrie roberts',
  'anthem lights', 'caleb and kelsey', 'montell fish',
  'newsong', 'royal tailor', 'all star united', 'plus one', 'zoegirl',
  '4him', 'group 1 crew', 'unspoken', 'cochren & co.',

  // ── ROCK / METAL CRISTIANO ──
  'skillet', 'switchfoot', 'needtobreathe', 'tenth avenue north', 'red',
  'kutless', 'thousand foot krutch', 'disciple', 'anberlin', 'relient k',
  'jars of clay', 'jeremy camp', 'third day', 'david crowder band',
  'stryper', 'fireflight', 'demon hunter', 'pillar', 'hawk nelson',
  'the afters', 'sanctus real', 'big daddy weave', 'building 429',
  'audio adrenaline', 'falling up', 'decyfer down', 'ashes remain',
  'seventh day slumber', 'nine lashes', 'spoken', 'barren cross',
  'guardian', 'bloodgood', 'sacred warrior', 'holy soldier', 'whitecross',
  'bride', 'theocracy', 'tourniquet', 'mortification', 'golden resurrection',
  'daniel amos', 'steve taylor', 'we as human', 'house of heroes',
  'the echoing green', 'joy electric', 'mortal', 'soulfire revolution',
  'delirious?', 'jon foreman',

  // ── HIP-HOP / RAP CRISTIANO ──
  'lecrae', 'nf', 'redimi2', 'funky', 'alex zurdo', 'manny montes',
  'jay kalyl', 'musiko', 'indiomar', 'almighty', 'ander bock', 'kb',
  'andy mineo', 'trip lee', 'social club misfits', 'niko eme', 'lizzy parra',
  'lil silvio y el vega', 'kj-52', 'tedashii', '1k phew', '116 clique',
  'limoblaze', 'whatuprg', 'nobigdyl.', 'ty brasel', 'swoope',
  's.o.', 'braille', 'r-swift', 'json', 'gospel gangstaz', 'pro',
  'ambassador', 'lz7', 'hulvey',

  // ── REGGAETON CRISTIANO ──
  'daddy yankee', 'farruko',

  // ── GOSPEL / SOUL ──
  'kirk franklin', 'fred hammond', 'mary mary', 'dc talk',
  'cece winans', 'yolanda adams', 'tamela mann', 'tye tribbett',
  'william mcdowell', 'travis greene', 'todd dulaney',
  'jonathan mcreynolds', 'marvin sapp', 'hezekiah walker',
  'donnie mcclurkin', 'casey j', 'vicki yohe', 'juanita bynum',
  'kim burrell', 'daryl coley', 'shirley murdock',
  'maurette brown clark', 'kurt carr', 'smokie norful',
  'micah stampley', 'william murphy', 'anthony brown',
  'koryn hawthorne', 'jonathan nelson', 'anointed',

  // ── GOSPEL AFRICANO ──
  'benjamin dube', 'mercy chinwo', 'ada ehi', 'joyous celebration',
  'ntokozo mbambo', 'israel & new breed',

  // ── BRASILEÑOS ──
  'aline barros', 'fernandinho', 'gabriela rocha', 'diante do trono',
  'fernanda brum', 'cassiane', 'bruna karla', 'thalles roberto',
  'rosa de saron', 'oficina g3', 'eyshila', 'kleber lucas',
  'leonardo gonçalves', 'laura souguellis', 'ludmila ferber',
  'voz da verdade', 'davi silva', 'seu worship',

  // ── PREDICADORES ──
  'andres corson', 'cash luna', 'dante gebel', 'john piper',
  'charles stanley', 'steven furtick', 'judah smith', 'robert madu',
  'rich wilkerson jr', 'paul washer',

  // ── EMERGENTES CONFIRMADOS ──
  'stephen mcwhirter', 'naomi raine', 'doe', 'jonathan traylor',
  'jenn johnson', 'taya', 'aaron moses', 'dante bowe',
  'jackie hill perry', 'tiffany hudson',

  // ── RESCATADOS (verificados manualmente) ──
  'dj jireh', 'dj tony foxx', 'bani muñoz', 'andy gullahorn',
  'emmanuel y linda', 'semilla de mostaza', 'dj pv',
  'alvaro lopez & res-q band', 'jacobo ramos', 'jaime murrell',
  'jeremy riddle', 'david scarpeta', 'emir sensini',
  'miguel cassina', 'ricardo rodriguez', 'samy galí',
  'luigi castro', 'leonel tuchez', 'marco lópez', 'marcos yaroide',
  'rocio crooke', 'madiel lara', 'ada romero', 'miguel balboa',
]);

// Tags que confirman artista cristiano
const CHRISTIAN_TAGS = new Set([
  'christian', 'christian rock', 'christian metal', 'christian hip-hop',
  'christian rap', 'ccm', 'contemporary christian', 'worship', 'praise',
  'gospel', 'christian pop', 'christian alternative', 'praise and worship',
  'christian hardcore', 'christian punk', 'christian indie', 'christian soul',
  'christian r&b', 'cristiano', 'musica cristiana', 'adoracion', 'alabanza',
  'gospel music', 'christian music', 'christian electronic', 'christian country',
  'unblack metal', 'white metal', 'christian edm', 'christian dance',
  'gospel-reggae', 'gospel reggae', 'christian reggae',
]);

// Palabras en títulos de contenido que indican basura
const TITULO_BASURA = [
  'noticias', 'news report', 'tutorial', 'entrevista con', 'interview with',
  'behind the scenes', 'unboxing', 'reaction', 'reaccion', 'podcast',
  'conferencia de prensa', 'press conference', 'detras de camaras',
  'gameplay', 'official trailer', 'rueda de prensa', 'full documentary',
  'how to make', 'como hacer', 'diy', 'clase de', 'curso de', 'leccion de',
];

async function getLastfmTopTags(artistName) {
  if (!LASTFM_KEY) return [];
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const tags = data?.toptags?.tag || [];
    // Return only tags with count > 30 (significant tags)
    return tags
      .filter(t => t.count > 30)
      .map(t => t.name.toLowerCase());
  } catch {
    return [];
  }
}

function hasChristianTagInTop(tags, topN = 3) {
  const topTags = tags.slice(0, topN);
  return topTags.some(tag => CHRISTIAN_TAGS.has(tag));
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   CURACIÓN ESTRICTA DEL CATÁLOGO                ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  if (!LASTFM_KEY) {
    console.error('❌ Necesitas LASTFM_API_KEY en .env.local');
    process.exit(1);
  }

  // 1. Obtener TODOS los artistas
  const { data: artistas, error } = await supabase
    .from('artistas')
    .select('id, nombre, generos, tipo, pais')
    .order('nombre');

  if (error || !artistas) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total artistas en DB: ${artistas.length}\n`);

  const mantener = [];
  const eliminar = [];
  const verificarLastfm = [];

  // 2. Clasificar: confirmados vs pendientes
  for (const a of artistas) {
    const nombreLower = a.nombre.toLowerCase().trim();
    if (CONFIRMADOS.has(nombreLower)) {
      mantener.push({ ...a, razon: 'CONFIRMADO (whitelist)' });
    } else {
      verificarLastfm.push(a);
    }
  }

  console.log(`✅ Confirmados por whitelist: ${mantener.length}`);
  console.log(`🔍 Pendientes de verificar en Last.fm: ${verificarLastfm.length}\n`);

  // 3. Verificar pendientes con Last.fm (estricto)
  let checked = 0;
  for (const a of verificarLastfm) {
    checked++;
    process.stdout.write(`  [${checked}/${verificarLastfm.length}] ${a.nombre.substring(0, 40).padEnd(40)} `);

    const tags = await getLastfmTopTags(a.nombre);

    if (tags.length === 0) {
      // Sin tags = desconocido en Last.fm = eliminar
      eliminar.push({ ...a, razon: 'No encontrado en Last.fm' });
      console.log('❌ Sin datos');
    } else if (hasChristianTagInTop(tags, 5)) {
      // Tag cristiano en top 5 = mantener
      mantener.push({ ...a, razon: `Last.fm tags: ${tags.slice(0, 5).join(', ')}` });
      console.log(`✅ ${tags.slice(0, 3).join(', ')}`);
    } else {
      // Tags pero ninguno cristiano en top 5 = eliminar
      eliminar.push({ ...a, razon: `Tags no cristianos: ${tags.slice(0, 5).join(', ')}` });
      console.log(`❌ ${tags.slice(0, 3).join(', ')}`);
    }

    await sleep(250); // Rate limit Last.fm
  }

  // 4. Limpiar contenido basura de artistas que se quedan
  console.log('\n\n🧹 Verificando contenido basura...');
  const mantenerIds = mantener.map(a => a.id);
  let contenidoBasura = [];

  for (const a of mantener) {
    const { data: contenido } = await supabase
      .from('contenido')
      .select('id, titulo')
      .eq('artista_id', a.id);

    if (!contenido) continue;

    for (const c of contenido) {
      const tituloLower = c.titulo.toLowerCase();
      const esBasura = TITULO_BASURA.some(kw => tituloLower.includes(kw));
      if (esBasura) {
        contenidoBasura.push({ id: c.id, titulo: c.titulo, artista: a.nombre });
      }
    }
  }

  // 5. REPORTE
  console.log('\n' + '═'.repeat(60));
  console.log(`\n✅ MANTENER: ${mantener.length} artistas`);
  console.log(`❌ ELIMINAR: ${eliminar.length} artistas`);
  console.log(`🧹 CONTENIDO BASURA: ${contenidoBasura.length} items\n`);

  console.log('── ARTISTAS A ELIMINAR ──');
  for (const a of eliminar) {
    console.log(`  ✗ ${a.nombre} → ${a.razon}`);
  }

  if (contenidoBasura.length > 0) {
    console.log('\n── CONTENIDO BASURA A ELIMINAR ──');
    for (const c of contenidoBasura) {
      console.log(`  🧹 [${c.artista}] ${c.titulo}`);
    }
  }

  // 6. Generar SQL
  const sqlLines = [];
  sqlLines.push('-- CURACIÓN ESTRICTA - Generado ' + new Date().toISOString());
  sqlLines.push('-- Artistas a eliminar: ' + eliminar.length);
  sqlLines.push('-- Contenido basura: ' + contenidoBasura.length);
  sqlLines.push('');

  if (eliminar.length > 0) {
    const ids = eliminar.map(a => `'${a.id}'`);

    // Split in chunks of 50 for SQL
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      sqlLines.push(`-- Eliminar contenido de artistas ${i + 1}-${i + chunk.length}`);
      sqlLines.push(`DELETE FROM contenido WHERE artista_id IN (${chunk.join(',')});`);
      sqlLines.push('');
    }

    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      sqlLines.push(`-- Eliminar artistas ${i + 1}-${i + chunk.length}`);
      sqlLines.push(`DELETE FROM artistas WHERE id IN (${chunk.join(',')});`);
      sqlLines.push('');
    }
  }

  if (contenidoBasura.length > 0) {
    const contentIds = contenidoBasura.map(c => `'${c.id}'`);
    sqlLines.push('-- Eliminar contenido basura de artistas buenos');
    for (let i = 0; i < contentIds.length; i += 50) {
      const chunk = contentIds.slice(i, i + 50);
      sqlLines.push(`DELETE FROM contenido WHERE id IN (${chunk.join(',')});`);
    }
    sqlLines.push('');
  }

  // Conteo final
  sqlLines.push('-- Verificar resultado:');
  sqlLines.push("SELECT 'Artistas' as tabla, count(*) as total FROM artistas");
  sqlLines.push('UNION ALL');
  sqlLines.push("SELECT 'Contenido', count(*) FROM contenido;");

  const sqlPath = resolve(__dirname, 'curacion-estricta.sql');
  writeFileSync(sqlPath, sqlLines.join('\n'));

  // Save detailed report
  const report = {
    fecha: new Date().toISOString(),
    mantener: mantener.map(a => ({ nombre: a.nombre, razon: a.razon })),
    eliminar: eliminar.map(a => ({ id: a.id, nombre: a.nombre, razon: a.razon })),
    contenidoBasura,
    resumen: {
      total_actual: artistas.length,
      mantener: mantener.length,
      eliminar: eliminar.length,
      contenido_basura: contenidoBasura.length,
    }
  };
  writeFileSync(resolve(__dirname, 'curacion-report.json'), JSON.stringify(report, null, 2));

  console.log(`\n📄 SQL generado: scripts/curacion-estricta.sql`);
  console.log(`📄 Reporte: scripts/curacion-report.json`);
  console.log('\n⚠️  Ejecuta el SQL en Supabase SQL Editor para aplicar los cambios.');
}

main().catch(console.error);
