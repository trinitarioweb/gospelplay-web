#!/usr/bin/env node
/**
 * LIMPIEZA DE ARTISTAS DESCUBIERTOS
 *
 * Revisa artistas agregados por el script de descubrimiento,
 * verifica con IA si son realmente artistas cristianos,
 * y elimina los que no deben estar.
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
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// ARTISTAS OBVIAMENTE MAL INCLUIDOS (revisión manual)
// ============================================================
const ELIMINAR_SEGURO = [
  // No son artistas de musica / no son cristianos
  'Altadena',                    // Barrio de LA, metió noticias de incendios
  'The Recovering Catholic',     // Anti-religioso
  'Electronic Soapbox',          // No es artista cristiano
  'Mr. Weaverface',              // Random
  'Red Tips',                    // Random
  'Romance Sideral',             // No cristiano
  'The Gravity Show',            // Random
  'Freakshift Dialect',          // Random
  'marjane-',                    // Random
  'ziggybeats',                  // Random
  'Perlla',                      // Pop brasileño secular
  'Shivali',                     // Random
  'Paul Budde',                  // No es artista de musica
  'Roger Hoffman',               // Compositor secular
  'Sarza the South',             // Random
  'Definitely D',                // Random
  'Nesk Only',                   // Random
  'Battz',                       // Random
  '2metro',                      // Random
  'Lee Vasi',                    // Random
  'Michael Zopf',                // Random
  'Off Road Minivan',            // Random
  'PBnJ Band',                   // Random
  'The Dry Leaf Project',        // Random
  'The Northern Conspiracy',     // Random
  'The Ineloquent',              // Random
  'Theories Of Gabriela',        // Random
  'Caesura Surrender',           // Random
  'TRANSBOARD',                  // Random
  'TwinTip',                     // Random
  'V*enna',                      // Random
  'VIP',                         // Demasiado genérico
  'wise crash',                  // Random
  'Eclipse rock',                // Random
  'Bob Young Band',              // Random
  'The Dry Leaf Project',        // Random
  'Rage of Angels',              // NWOBHM secular
  'No Resolve',                  // Banda secular
  'Eduardo Mano e Os Tapetes Voadores', // Random brasileño
  'Sam Cooke',                   // Soul clásico secular (sí hizo gospel pero no es su identidad)
  'Parable',                     // Demasiado genérico
  'Harmony',                     // Demasiado genérico
  'One4All',                     // Random
  'Onitsha',                     // Random
  'Retain',                      // Random
  'The Way',                     // Demasiado genérico
  'Sondae',                      // Random
  'Tylynn',                      // Random
  'Young C',                     // Random
  'Diana Baciu',                 // Random
  'Emerson A.S.',                // Random
  'Gilbert Morales Zayas',       // Random
  'David Potter',                // Random
  'Antoine Bradford',            // Random
  'Jervis Campbell',             // Random
  'Kris Morris',                 // Random
  'Dave Mendoza',                // Random
  'Stephen Stanley',             // Random
  'Don Ready',                   // Random
  'Joe Christmas',               // No cristiano, indie rock
  'Audiovision',                 // Power metal secular sueco
  'Perry & the Poor Boys',       // Random
  'Perry and the Poor Boys',     // Duplicado
  'Gio.',                        // Random
  'Red Tips',                    // Random
  'Sarah Drizen',                // Random
  'Har Megiddo',                 // Black metal, no cristiano
  'Fr. Andrew Stephen Damick and Ancient Faith Radio', // Es un podcast, no artista
  'feeds@ancientfaith.com (Fr. Andrew Stephen Damick and Ancient Faith Radio)', // Duplicado podcast
  'Hanjo Gäbler',                // Random alemán
  'Ruth Mixter',                 // Random
  'Steve Taylor & The Danielson Foil', // Nombre incorrecto
  'Randy Adams Band',            // Random
  'Strings & Heart',             // Random
  'Kosmos Express',              // Random
  'Holy Blood',                  // Black/death metal ucraniano, cuestionable
  'Pneuma',                      // Demasiado genérico
  '100 Portraits',               // Random
  'Anguidara',                   // Random
  'Coffey Anderson',             // Country secular
  'Chris Staples',               // Indie secular
  'City Harbor',                 // Ya no existe
  'Andy Cherry',                 // Random
  'Hopeful.',                    // Random
];

// Duplicados (ya existen con otro nombre en el catálogo original)
const DUPLICADOS = [
  'for KING & COUNTRY',     // Ya existe como 'for KING AND COUNTRY'
  'Shane & Shane',           // Ya existe como 'Shane and Shane'
  'Hillsong Young & Free',  // Ya existe como 'Hillsong Young and Free'
  'Christine D\'Clario',    // Ya existe como 'Christine DClario'
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// VERIFICACION CON IA para artistas dudosos
// ============================================================
async function verificarConIA(nombre, contenidoTitulos) {
  if (!ANTHROPIC_KEY) return null;

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
        max_tokens: 300,
        system: 'Eres experto en musica cristiana. Responde SOLO con JSON: {"es_artista_cristiano": true/false, "es_artista_real": true/false, "razon": "breve"}. Un artista cristiano real es alguien que hace musica cristiana/gospel/worship como su identidad principal. No incluyas artistas seculares que hicieron una cancion cristiana.',
        messages: [{
          role: 'user',
          content: `Artista: "${nombre}"\nContenido en la DB: ${contenidoTitulos.slice(0, 5).join(', ')}\n\n¿Es un artista cristiano real y conocido?`
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
// MAIN
// ============================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   LIMPIEZA DE ARTISTAS DESCUBIERTOS              ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  let totalEliminados = 0;
  let totalCancionesEliminadas = 0;

  // ── FASE 1: Eliminar los obviamente malos ──
  console.log('🗑️  FASE 1: Eliminando artistas obviamente incorrectos...');
  console.log('─'.repeat(50));

  const toDelete = [...ELIMINAR_SEGURO, ...DUPLICADOS];

  for (const nombre of toDelete) {
    // Find artist
    const { data: artista } = await supabase
      .from('artistas')
      .select('id, nombre')
      .ilike('nombre', nombre)
      .single();

    if (!artista) continue;

    // Count content
    const { count } = await supabase
      .from('contenido')
      .select('id', { count: 'exact', head: true })
      .eq('artista_id', artista.id);

    // Delete content first
    if (count > 0) {
      await supabase.from('contenido').delete().eq('artista_id', artista.id);
      totalCancionesEliminadas += count;
    }

    // Delete artist
    const { error } = await supabase.from('artistas').delete().eq('id', artista.id);
    if (!error) {
      totalEliminados++;
      console.log(`  ✗ ${artista.nombre} (${count || 0} canciones eliminadas)`);
    }
  }

  console.log(`\n  Fase 1: ${totalEliminados} artistas eliminados, ${totalCancionesEliminadas} canciones\n`);

  // ── FASE 2: Verificar contenido sospechoso ──
  console.log('🔍 FASE 2: Verificando contenido sospechoso...');
  console.log('─'.repeat(50));

  // Get all artists and their content
  const { data: todosArtistas } = await supabase
    .from('artistas')
    .select('id, nombre')
    .order('created_at', { ascending: false })
    .limit(450);

  let verificados = 0;
  let eliminadosFase2 = 0;

  for (const artista of todosArtistas || []) {
    // Get content for this artist
    const { data: contenido } = await supabase
      .from('contenido')
      .select('id, titulo, artista')
      .eq('artista_id', artista.id);

    if (!contenido || contenido.length === 0) continue;

    // Check if content titles match the artist (simple heuristic)
    const artistaLower = artista.nombre.toLowerCase();
    const titulosNoRelacionados = contenido.filter(c => {
      const tituloLower = c.titulo.toLowerCase();
      const artistaContenido = (c.artista || '').toLowerCase();
      // If the content artist doesn't match at all
      return !artistaContenido.includes(artistaLower.substring(0, 5)) &&
             !artistaLower.includes(artistaContenido.substring(0, 5)) &&
             !tituloLower.includes(artistaLower.substring(0, 5));
    });

    // If more than 60% of content doesn't match, flag it
    if (titulosNoRelacionados.length > contenido.length * 0.6 && contenido.length >= 3) {
      const titulos = contenido.map(c => c.titulo);

      // Verify with AI
      const resultado = await verificarConIA(artista.nombre, titulos);
      verificados++;

      if (resultado && (!resultado.es_artista_cristiano || !resultado.es_artista_real)) {
        // Delete content
        await supabase.from('contenido').delete().eq('artista_id', artista.id);
        // Delete artist
        await supabase.from('artistas').delete().eq('id', artista.id);
        eliminadosFase2++;
        totalEliminados++;
        totalCancionesEliminadas += contenido.length;
        console.log(`  ✗ ${artista.nombre}: ${resultado.razon} (${contenido.length} canciones)`);
      } else if (resultado) {
        console.log(`  ✓ ${artista.nombre}: ${resultado.razon}`);
      }

      await sleep(500);
    }
  }

  console.log(`\n  Fase 2: ${eliminadosFase2} artistas eliminados (${verificados} verificados con IA)\n`);

  // ── FASE 3: Limpiar contenido que NO es musica ──
  console.log('🧹 FASE 3: Limpiando contenido no-musical...');
  console.log('─'.repeat(50));

  // Find content that looks like news, tutorials, reactions, etc.
  const contentBlacklist = [
    'incendio', 'fuego', 'noticias', 'breaking', 'news',
    'tutorial', 'unboxing', 'reaction', 'reaccion',
    'entrevista completa', 'documental', 'behind the scenes',
    'como hacer', 'how to', 'review', 'reseña',
    'abandonar', 'leaving the church', 'shocking truth',
    'why i left', 'por qué dejé',
  ];

  let contenidoLimpiado = 0;

  for (const keyword of contentBlacklist) {
    const { data: malos } = await supabase
      .from('contenido')
      .select('id, titulo, artista')
      .ilike('titulo', `%${keyword}%`);

    if (malos && malos.length > 0) {
      for (const malo of malos) {
        await supabase.from('contenido').delete().eq('id', malo.id);
        contenidoLimpiado++;
        console.log(`  ✗ "${malo.titulo}" (${malo.artista})`);
      }
    }
  }

  console.log(`\n  Fase 3: ${contenidoLimpiado} contenidos no-musicales eliminados\n`);

  // ── RESUMEN ──
  // Count remaining
  const { count: totalArtistas } = await supabase
    .from('artistas')
    .select('id', { count: 'exact', head: true });

  const { count: totalContenido } = await supabase
    .from('contenido')
    .select('id', { count: 'exact', head: true });

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   RESUMEN DE LIMPIEZA                            ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Artistas eliminados: ${totalEliminados}`);
  console.log(`  Contenido eliminado: ${totalCancionesEliminadas + contenidoLimpiado}`);
  console.log(`  Artistas restantes: ${totalArtistas}`);
  console.log(`  Contenido restante: ${totalContenido}`);
}

main().catch(console.error);
