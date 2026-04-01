#!/usr/bin/env node
/**
 * VERIFICACION DE ARTISTAS CON LAST.FM (sin IA)
 *
 * Usa Last.fm tags + lógica local para verificar artistas.
 * No requiere créditos de API de Anthropic.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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
// ARTISTAS 100% CONFIRMADOS (no verificar, mantener siempre)
// ============================================================
const CONFIRMADOS = new Set([
  // Worship ES
  'marcos witt', 'jesus adrian romero', 'danilo montero', 'miel san marcos',
  'su presencia', 'barak', 'christine dclario', 'alex campos', 'evan craft',
  'marco barrientos', 'julio melgar', 'coalo zamorano', 'generacion 12',
  'montesanto', 'averly morillo', 'living', 'twice musica', 'kairo worship',
  'alfareros', 'new wine', 'xtreme kids', 'samuel hernandez', 'un corazon',
  'marcela gandara', 'ingrid rosario',
  // Worship EN
  'hillsong worship', 'elevation worship', 'bethel music', 'maverick city music',
  'chris tomlin', 'kari jobe', 'cityalight', 'phil wickham', 'brandon lake',
  'brooke ligertwood', 'hillsong united', 'hillsong young and free',
  'jesus culture', 'passion', 'matt redman', 'sinach', 'don moen',
  'tasha cobbs leonard', 'chandler moore', 'upperroom', 'shane and shane',
  'leeland', 'vertical worship',
  // Pop cristiano
  'lauren daigle', 'for king and country', 'casting crowns', 'tobymac',
  'mercyme', 'matthew west', 'cory asbury', 'anne wilson', 'we the kingdom',
  'cain', 'newsboys', 'danny gokey', 'tauren wells', 'riley clemmons',
  'terrian', 'blanca', 'jordan feliz', 'katy nichole', 'forrest frank',
  'blessing offor',
  // Rock
  'skillet', 'switchfoot', 'rojo', 'rescate', 'needtobreathe',
  'tenth avenue north', 'red', 'kutless', 'thousand foot krutch', 'disciple',
  // Hip-hop
  'lecrae', 'nf', 'redimi2', 'funky', 'alex zurdo', 'manny montes',
  'jay kalyl', 'musiko', 'indiomar', 'almighty', 'ander bock', 'kb',
  'andy mineo', 'trip lee', 'social club misfits', 'niko eme', 'lizzy parra',
  'lil silvio y el vega',
  // Reggaeton
  'daddy yankee', 'farruko',
  // Balada
  'marcos vidal', 'lilly goodman', 'tercer cielo', 'jeseth', 'nancy amancio',
  'abel zavala', 'jose luis reyes', 'lucia parker',
  // Predicadores
  'andres corson', 'cash luna', 'dante gebel', 'john piper',
  'charles stanley', 'steven furtick', 'judah smith', 'robert madu',
  'rich wilkerson jr', 'paul washer',
  // Emergentes
  'stephen mcwhirter', 'hulvey', 'davi silva', 'pat barrett',
  'naomi raine', 'doe', 'jonathan traylor', 'jenn johnson', 'taya',
  'aaron moses', 'dante bowe', 'josue avila', 'marcos brunet',
  // Conocidos descubiertos
  'hillsong chapel', 'elevation rhythm', 'anberlin', 'relient k',
  'jars of clay', 'jeremy camp', 'michael w. smith', 'third day',
  'kirk franklin', 'mary mary', 'dc talk', 'david crowder band',
  'stryper', 'fireflight', 'demon hunter', 'pillar', 'hawk nelson',
  'the afters', 'sanctus real', 'big daddy weave', 'building 429',
  'audio adrenaline', 'steven curtis chapman', 'rebecca st. james',
  'francesca battistelli', 'mandisa', 'zach williams', 'crowder',
  'cody carnes', 'matt maher', 'chris mcclarney', 'rend collective',
  'housefires', 'planetshakers', 'darlene zschech', 'tim hughes',
  'kim walker-smith', 'kristian stanfill', 'delirious?',
  'ron kenoly', 'fred hammond', 'donnie mcclurkin', 'cece winans',
  'yolanda adams', 'tamela mann', 'tye tribbett', 'william mcdowell',
  'travis greene', 'todd dulaney', 'jonathan mcreynolds', 'tasha layton',
  'we are messengers', 'colton dixon', 'sidewalk prophets', 'ben fuller',
  'ryan stevenson', 'danny gokey', 'brandon heath', 'britt nicole',
  'jamie grace', 'rachael lampa', 'sandi patty', 'keith green',
  'marvin sapp', 'hezekiah walker', 'jason gray', 'selah',
  'lincoln brewster', 'sonicflood', 'point of grace', 'michael w. smith',
  'keith & kristyn getty', 'kings kaleidoscope', 'josh garrels',
  'audrey assad', 'sandra mccracken', 'fernando ortega',
  'charity gayle', 'anna golden', 'montell fish',
  // Brasileños conocidos
  'aline barros', 'fernandinho', 'gabriela rocha', 'diante do trono',
  'fernanda brum', 'cassiane', 'bruna karla', 'thalles roberto',
  'rosa de saron', 'oficina g3', 'eyshila',
  // Latinos conocidos
  'annette moreno', 'julissa', 'daniel calveti', 'juan carlos alvarado',
  'edgar lira', 'pablo olivares', 'harold guerra', 'ericson alexander molano',
  'rené gonzález', 'fernel monroy', 'su presencia worship',
  'gateway worship', 'esperanza de vida', 'peregrinos y extranjeros',
  'en espíritu y en verdad', 'vino nuevo', 'kyosko',
  // Gospel conocidos
  'kirk franklin and the family', 'fred hammond & radical for christ',
  'anthony brown & group therapy', 'koryn hawthorne', 'jonathan nelson',
  'smokie norful', 'micah stampley', 'william murphy', 'benjamin dube',
  'mercy chinwo', 'ada ehi', 'joyous celebration', 'ntokozo mbambo',
  'israel & new breed',
  // Otros conocidos
  'all sons & daughters', 'anointed', 'unspoken', 'cochren & co.',
  'jon foreman', 'kj-52', 'tedashii', '1k phew', '116 clique',
  'andy gullahorn', 'john mark mcmillan', 'sovereign grace music',
  'vineyard music', 'maranatha! music', 'gateway worship español',
  'red rocks worship', 'seu worship', 'mosaic msc', 'desperation band',
  'new life worship', 'united pursuit band', 'enter the worship circle',
  'anthem lights', 'caleb and kelsey',
  // Más conocidos
  'jackie hill perry', 'dan bremnes', 'micah tyler', 'jordan st. cyr',
  'leanna crawford', 'elle limebear', 'tiffany hudson', 'austin french',
  'chris august', 'laura story', 'meredith andrews', 'kerrie roberts',
  'josh wilson', 'jonny diaz', 'joy williams', 'beckah shae',
  'kathy troccoli', 'margaret becker', 'clay crosse', 'steve green',
  'colton dixon', 'hollyn', 'group 1 crew',
  'falling up', 'decyfer down', 'ashes remain', 'seventh day slumber',
  'nine lashes', 'spoken', 'barren cross', 'guardian', 'bloodgood',
  'sacred warrior', 'holy soldier', 'whitecross', 'bride',
  'theocracy', 'tourniquet', 'mortification', 'golden resurrection',
  'stryper', 'daniel amos', 'steve taylor',
  'all star united', 'plus one', 'zoegirl', 'purenrg',
  '4him', 'newsong', 'royal tailor', 'hawk nelson',
  'seventh avenue', 'mainstay',
  'lz7', 'limoblaze', 'whatuprg', 'nobigdyl.', 'ty brasel',
  'swoope', 's.o.', 'braille', 'r-swift', 'json',
  'gospel gangstaz', 'pro', 'ambassador',
  'casey j', 'vicki yohe', 'juanita bynum', 'kim burrell',
  'daryl coley', 'shirley murdock', 'maurette brown clark',
  'kurt carr & the kurt carr singers',
  'pastor t.l. barrett and the youth for christ choir',
  'soulfire revolution', 'we as human', 'house of heroes',
  'the echoing green', 'joy electric', 'mortal',
  'david leonard', 'benjamin william hastings',
  'kleber lucas', 'leonardo gonçalves', 'laura souguellis',
  'ludmila ferber', 'voz da verdade',
]);

// Artistas que sabemos que NO son cristianos o son basura
const ELIMINAR = new Set([
  // Ya eliminados en la limpieza anterior pero por si quedaron
  'altadena', 'the recovering catholic', 'electronic soapbox',
  'mr. weaverface', 'red tips', 'romance sideral', 'the gravity show',
  'freakshift dialect', 'marjane-', 'ziggybeats', 'perlla', 'shivali',
  'paul budde', 'roger hoffman', 'sarza the south', 'definitely d',
  'nesk only', 'battz', '2metro', 'lee vasi', 'michael zopf',
  'off road minivan', 'pbnj band', 'the dry leaf project',
  'the northern conspiracy', 'the ineloquent', 'theories of gabriela',
  'caesura surrender', 'transboard', 'twintip', 'v*enna', 'vip',
  'wise crash', 'eclipse rock', 'bob young band', 'rage of angels',
  'no resolve', 'eduardo mano e os tapetes voadores', 'sam cooke',
  'parable', 'harmony', 'one4all', 'onitsha', 'retain', 'the way',
  'sondae', 'tylynn', 'young c', 'diana baciu', 'emerson a.s.',
  'gilbert morales zayas', 'david potter', 'antoine bradford',
  'jervis campbell', 'kris morris', 'dave mendoza', 'stephen stanley',
  'don ready', 'joe christmas', 'audiovision', 'perry & the poor boys',
  'perry and the poor boys', 'gio.', 'sarah drizen', 'har megiddo',
  'hanjo gäbler', 'ruth mixter', 'randy adams band', 'strings & heart',
  'kosmos express', 'holy blood', 'pneuma', '100 portraits', 'anguidara',
  'coffey anderson', 'chris staples', 'city harbor', 'andy cherry',
  'hopeful.',
  // Duplicados
  'for king & country', 'shane & shane', 'hillsong young & free',
  "christine d'clario",
  // Más para eliminar
  'feeds@ancientfaith.com (fr. andrew stephen damick and ancient faith radio)',
  'fr. andrew stephen damick and ancient faith radio',
  'steve taylor & the danielson foil',
  'reenukumar - official y timothy sharan',
  'josh garrels & mason jar music', // duplicado de josh garrels
  'kirk franklin and the family', // duplicado de kirk franklin
  'fred hammond & radical for christ', // duplicado
  'redimi2oficial', // duplicado de redimi2
  'música cristiana', // genérico
  'lirikeotv', // canal de youtube, no artista
  'nacho', // artista secular venezolano
  'sunday service choir', // proyecto de kanye west
  'the staple singers', // grupo secular de soul/R&B
  'sounds of blackness', // más secular que cristiano
  'world worship', // genérico
  'david & carrie grant', // más TV que música cristiana
]);

// Tags cristianos en Last.fm
const CHRISTIAN_TAGS = [
  'christian', 'christian rock', 'christian metal', 'christian hip-hop',
  'christian rap', 'ccm', 'contemporary christian', 'worship', 'praise',
  'gospel', 'christian pop', 'christian alternative', 'praise and worship',
  'christian hardcore', 'christian punk', 'christian indie', 'christian soul',
  'christian r&b', 'cristiano', 'musica cristiana', 'adoracion', 'alabanza',
  'gospel music', 'christian music', 'christian electronic', 'christian country',
  'christian dance', 'unblack metal', 'white metal',
];

async function getLastfmTags(artistName) {
  if (!LASTFM_KEY) return [];
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.toptags?.tag || []).map(t => t.name.toLowerCase());
  } catch { return []; }
}

async function getLastfmInfo(artistName) {
  if (!LASTFM_KEY) return null;
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.artist) return null;
    return {
      listeners: parseInt(data.artist.stats?.listeners) || 0,
      tags: (data.artist.tags?.tag || []).map(t => t.name.toLowerCase()),
    };
  } catch { return null; }
}

function hasChristianTag(tags) {
  return tags.some(t => CHRISTIAN_TAGS.some(ct => t.includes(ct) || ct.includes(t)));
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   VERIFICACION CON LAST.FM + LISTA CURADA        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Get all artists
  const { data: todosArtistas } = await supabase
    .from('artistas')
    .select('id, nombre, generos, tipo')
    .order('nombre');

  console.log(`Total artistas: ${todosArtistas.length}\n`);

  let eliminados = 0;
  let cancionesEliminadas = 0;
  let aprobados = 0;
  let verificadosLastfm = 0;
  const noVerificados = [];

  for (let i = 0; i < todosArtistas.length; i++) {
    const artista = todosArtistas[i];
    const nombreLower = artista.nombre.toLowerCase();

    // 1. Check if in confirmed list → keep
    if (CONFIRMADOS.has(nombreLower)) {
      aprobados++;
      continue;
    }

    // 2. Check if in delete list → remove
    if (ELIMINAR.has(nombreLower)) {
      const { count } = await supabase
        .from('contenido')
        .select('id', { count: 'exact', head: true })
        .eq('artista_id', artista.id);

      await supabase.from('contenido').delete().eq('artista_id', artista.id);
      await supabase.from('artistas').delete().eq('id', artista.id);
      eliminados++;
      cancionesEliminadas += (count || 0);
      console.log(`  ✗ ${artista.nombre} (${count || 0} canciones) - lista negra`);
      continue;
    }

    // 3. Check Last.fm tags
    const tags = await getLastfmTags(artista.nombre);
    await sleep(300);

    if (hasChristianTag(tags)) {
      aprobados++;
      verificadosLastfm++;
      continue;
    }

    // 4. If no Christian tags, check info for more context
    const info = await getLastfmInfo(artista.nombre);
    await sleep(300);

    if (info && hasChristianTag(info.tags)) {
      aprobados++;
      verificadosLastfm++;
      continue;
    }

    // 5. If artist has tipo = predicador/pastor, keep them
    if (['predicador', 'pastor'].includes(artista.tipo)) {
      aprobados++;
      continue;
    }

    // 6. Check if the artist's genres in our DB are Christian
    const generos = (artista.generos || []).map(g => g.toLowerCase());
    const hasChristianGenre = generos.some(g =>
      g.includes('worship') || g.includes('cristian') || g.includes('gospel') ||
      g.includes('predicacion') || g.includes('ccm')
    );

    // If they have Christian genre AND some Last.fm listeners, probably OK
    if (hasChristianGenre && info && info.listeners > 1000) {
      aprobados++;
      continue;
    }

    // 7. If very few listeners OR no tags at all → suspicious
    if (!info || info.listeners < 500) {
      // Check content count
      const { count } = await supabase
        .from('contenido')
        .select('id', { count: 'exact', head: true })
        .eq('artista_id', artista.id);

      // Delete unknown artists with low presence
      await supabase.from('contenido').delete().eq('artista_id', artista.id);
      await supabase.from('artistas').delete().eq('id', artista.id);
      eliminados++;
      cancionesEliminadas += (count || 0);
      console.log(`  ✗ ${artista.nombre} (${count || 0} canciones) - desconocido/sin presencia`);
      continue;
    }

    // 8. Has listeners but no Christian tags → probably not Christian
    noVerificados.push({ nombre: artista.nombre, listeners: info?.listeners || 0, tags: tags.slice(0, 5) });
    // Delete these too - if Last.fm doesn't have Christian tags, probably not Christian
    const { count } = await supabase
      .from('contenido')
      .select('id', { count: 'exact', head: true })
      .eq('artista_id', artista.id);

    await supabase.from('contenido').delete().eq('artista_id', artista.id);
    await supabase.from('artistas').delete().eq('id', artista.id);
    eliminados++;
    cancionesEliminadas += (count || 0);
    console.log(`  ✗ ${artista.nombre} (${count || 0} canciones) - sin tags cristianos [${tags.slice(0, 3).join(', ')}]`);
  }

  // Final count
  const { count: finalArtistas } = await supabase.from('artistas').select('id', { count: 'exact', head: true });
  const { count: finalContenido } = await supabase.from('contenido').select('id', { count: 'exact', head: true });

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   RESULTADO FINAL                                ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Aprobados (lista confirmada): ${aprobados - verificadosLastfm}`);
  console.log(`  Aprobados (Last.fm tags): ${verificadosLastfm}`);
  console.log(`  Eliminados: ${eliminados}`);
  console.log(`  Canciones eliminadas: ${cancionesEliminadas}`);
  console.log(`  ─────────────────────────`);
  console.log(`  Artistas finales: ${finalArtistas}`);
  console.log(`  Contenido final: ${finalContenido}`);

  if (noVerificados.length > 0) {
    console.log('\n  Artistas eliminados con listeners pero sin tags cristianos:');
    for (const a of noVerificados) {
      console.log(`    - ${a.nombre} (${a.listeners.toLocaleString()} listeners) [${a.tags.join(', ')}]`);
    }
  }
}

main().catch(console.error);
