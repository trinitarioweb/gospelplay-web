#!/usr/bin/env node
/**
 * VERIFICACION TOTAL CON IA
 *
 * Pasa TODOS los artistas por Claude IA para verificar
 * si son realmente artistas cristianos conocidos.
 * Los que no pasen, se eliminan con su contenido.
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
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Batch verification - send 15 artists at once to save API calls
async function verificarLote(artistas) {
  const listaTexto = artistas.map((a, i) =>
    `${i + 1}. "${a.nombre}" (generos: ${(a.generos || []).join(', ')}, tipo: ${a.tipo || '?'}, pais: ${a.pais || '?'}, canciones: ${a.titulos?.join('; ') || 'N/A'})`
  ).join('\n');

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
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Eres un experto en musica cristiana mundial (español, ingles, portugues, etc).
Verifica si cada artista es REALMENTE un artista/banda de musica cristiana, gospel o worship CONOCIDO.

APROBAR si: hace musica cristiana como identidad principal, es predicador/pastor conocido, tiene trayectoria real.
RECHAZAR si: artista secular, nombre generico sin artista real, proyecto random/amateur, metal pagano/ocultista, no es artista de musica, duplicado de otro.

Se estricto. Si no conoces al artista, rechazalo.

Responde SOLO con un JSON array:
[{"n": 1, "ok": true, "razon": "breve"}, ...]

Artistas:
${listaTexto}`
        }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`  API error: ${res.status} - ${errBody.substring(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error(`  Parse error: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   VERIFICACION TOTAL DE ARTISTAS CON IA          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  if (!ANTHROPIC_KEY) {
    console.error('❌ Necesitas ANTHROPIC_API_KEY');
    process.exit(1);
  }

  // Get ALL artists
  const { data: todosArtistas, error } = await supabase
    .from('artistas')
    .select('id, nombre, generos, tipo, pais')
    .order('nombre');

  if (error || !todosArtistas) {
    console.error('Error obteniendo artistas:', error);
    return;
  }

  console.log(`Total artistas a verificar: ${todosArtistas.length}\n`);

  // Get content titles for each artist (for context)
  for (const artista of todosArtistas) {
    const { data: contenido } = await supabase
      .from('contenido')
      .select('titulo')
      .eq('artista_id', artista.id)
      .limit(3);
    artista.titulos = (contenido || []).map(c => c.titulo);
  }

  // Process in batches of 15
  const BATCH_SIZE = 15;
  const aprobados = [];
  const rechazados = [];
  const errores = [];

  for (let i = 0; i < todosArtistas.length; i += BATCH_SIZE) {
    const lote = todosArtistas.slice(i, i + BATCH_SIZE);
    const loteNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalLotes = Math.ceil(todosArtistas.length / BATCH_SIZE);

    process.stdout.write(`[Lote ${loteNum}/${totalLotes}] Verificando ${lote.map(a => a.nombre).join(', ').substring(0, 80)}... `);

    const resultados = await verificarLote(lote);

    if (!resultados) {
      console.log('ERROR - saltando lote');
      errores.push(...lote.map(a => a.nombre));
      await sleep(2000);
      continue;
    }

    let okCount = 0;
    let noCount = 0;

    for (const r of resultados) {
      const idx = (r.n || r.num || 0) - 1;
      if (idx < 0 || idx >= lote.length) continue;

      const artista = lote[idx];
      if (r.ok) {
        aprobados.push({ nombre: artista.nombre, razon: r.razon });
        okCount++;
      } else {
        rechazados.push({ id: artista.id, nombre: artista.nombre, razon: r.razon });
        noCount++;
      }
    }

    // Handle artists not in response (if API missed some)
    const respondidos = new Set(resultados.map(r => (r.n || r.num || 0) - 1));
    for (let j = 0; j < lote.length; j++) {
      if (!respondidos.has(j)) {
        errores.push(lote[j].nombre);
      }
    }

    console.log(`✓${okCount} ✗${noCount}`);
    await sleep(1200); // Rate limit
  }

  // ── REPORT ──
  console.log('\n' + '═'.repeat(50));
  console.log(`APROBADOS: ${aprobados.length}`);
  console.log(`RECHAZADOS: ${rechazados.length}`);
  console.log(`ERRORES (no verificados): ${errores.length}`);
  console.log('═'.repeat(50));

  console.log('\n❌ RECHAZADOS:');
  for (const r of rechazados) {
    console.log(`  ✗ ${r.nombre}: ${r.razon}`);
  }

  if (errores.length > 0) {
    console.log('\n⚠️  NO VERIFICADOS (se mantienen):');
    for (const e of errores) {
      console.log(`  ? ${e}`);
    }
  }

  // Save report before deleting
  const report = {
    fecha: new Date().toISOString(),
    aprobados: aprobados.length,
    rechazados: rechazados.length,
    errores: errores.length,
    detalle_rechazados: rechazados,
    detalle_aprobados: aprobados,
  };
  writeFileSync(resolve(__dirname, 'verificacion-report.json'), JSON.stringify(report, null, 2));
  console.log('\n📄 Reporte guardado en scripts/verificacion-report.json');

  // ── DELETE REJECTED ──
  if (rechazados.length > 0) {
    console.log(`\n🗑️  Eliminando ${rechazados.length} artistas rechazados...`);

    let deletedArtists = 0;
    let deletedContent = 0;

    for (const r of rechazados) {
      // Count content
      const { count } = await supabase
        .from('contenido')
        .select('id', { count: 'exact', head: true })
        .eq('artista_id', r.id);

      // Delete content
      if (count > 0) {
        await supabase.from('contenido').delete().eq('artista_id', r.id);
        deletedContent += count;
      }

      // Delete artist
      const { error: delErr } = await supabase.from('artistas').delete().eq('id', r.id);
      if (!delErr) deletedArtists++;
    }

    console.log(`  Artistas eliminados: ${deletedArtists}`);
    console.log(`  Contenido eliminado: ${deletedContent}`);
  }

  // Final count
  const { count: finalArtistas } = await supabase.from('artistas').select('id', { count: 'exact', head: true });
  const { count: finalContenido } = await supabase.from('contenido').select('id', { count: 'exact', head: true });

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   RESULTADO FINAL                                ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Artistas verificados: ${finalArtistas}`);
  console.log(`  Contenido total: ${finalContenido}`);
}

main().catch(console.error);
