#!/usr/bin/env node
/**
 * RE-ETIQUETAR contenido con IA
 * Actualiza temas, pasajes, genero_musical, categoria para contenido
 * que tiene clasificacion generica o incompleta.
 *
 * Ejecutar: node scripts/reetiquetar.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unuxjxryyxdfmngdhnju.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yt669oTk8lGBgANprEoCXA_H9JKJauq';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function clasificarConIA(titulo, artista, tipo) {
  const esPredica = tipo === 'predicacion';

  const systemPrompt = esPredica
    ? `Eres un experto en teologia cristiana reformada. Clasifica esta predicacion y devuelve SOLO un JSON valido:
{
  "categoria": "doctrina|devocional|evangelistico|estudio_biblico",
  "genero_musical": "predicacion",
  "energia": "baja|media|alta",
  "momento_del_culto": "predicacion",
  "eval_cristocentrico": 0-100,
  "eval_fidelidad_biblica": 0-100,
  "eval_profundidad": 0-100,
  "eval_edificante": 0-100,
  "eval_doctrina_sana": 0-100,
  "temas": ["tema1", "tema2", "tema3"],
  "pasajes": ["Libro Capitulo:Versiculo"]
}`
    : `Eres un experto en musica cristiana. Clasifica esta cancion y devuelve SOLO un JSON valido:
{
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
  "temas": ["tema1", "tema2", "tema3"],
  "pasajes": ["Libro Capitulo:Versiculo"]
}`;

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
        system: systemPrompt,
        messages: [{ role: 'user', content: `Clasifica: "${titulo}" de ${artista}` }],
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   RE-ETIQUETAR CONTENIDO CON IA                  ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Get content that needs re-classification:
  // - temas is empty or generic ['adoracion', 'fe']
  // - pasajes is empty
  // - eval_notas contains 'automatica' (default classification)
  const { data: contenido, error } = await supabase
    .from('contenido')
    .select('id, titulo, artista, tipo, temas, pasajes, eval_notas, genero_musical, categoria')
    .eq('publicado', true)
    .order('created_at', { ascending: true });

  if (error || !contenido) {
    console.error('Error obteniendo contenido:', error?.message);
    return;
  }

  // Filter content that needs re-tagging
  const pendientes = contenido.filter(c => {
    const temas = c.temas || [];
    const pasajes = c.pasajes || [];
    // Generic default tags
    if (temas.length <= 2 && temas.includes('adoracion') && temas.includes('fe')) return true;
    if (temas.length <= 2 && temas.includes('adoración') && temas.includes('fe')) return true;
    // Empty
    if (temas.length === 0) return true;
    if (pasajes.length === 0) return true;
    // Default classification note
    if ((c.eval_notas || '').includes('automatica') || (c.eval_notas || '').includes('Clasificación automática')) return true;
    // Predica defaults
    if (temas.length <= 2 && temas.includes('doctrina') && temas.includes('evangelio')) return true;
    return false;
  });

  console.log(`Total contenido: ${contenido.length}`);
  console.log(`Pendientes de re-etiquetar: ${pendientes.length}\n`);

  let actualizados = 0;
  let errores = 0;

  for (let i = 0; i < pendientes.length; i++) {
    const c = pendientes[i];
    process.stdout.write(`[${i + 1}/${pendientes.length}] ${c.titulo.substring(0, 45).padEnd(45)} `);

    const clasificacion = await clasificarConIA(c.titulo, c.artista, c.tipo);

    if (!clasificacion) {
      console.log('✗ Sin respuesta IA');
      errores++;
      await sleep(500);
      continue;
    }

    // Build update object - only update fields that improved
    const update = {};

    if (clasificacion.temas && clasificacion.temas.length > 0) {
      update.temas = clasificacion.temas;
    }
    if (clasificacion.pasajes && clasificacion.pasajes.length > 0) {
      update.pasajes = clasificacion.pasajes;
    }
    if (clasificacion.genero_musical) {
      update.genero_musical = clasificacion.genero_musical;
    }
    if (clasificacion.categoria) {
      update.categoria = clasificacion.categoria;
    }
    if (clasificacion.energia) {
      update.energia = clasificacion.energia;
    }
    if (clasificacion.momento_del_culto) {
      update.momento_del_culto = clasificacion.momento_del_culto;
    }
    if (clasificacion.es_congregacional !== undefined) {
      update.es_congregacional = clasificacion.es_congregacional;
    }
    // Update scores
    if (clasificacion.eval_cristocentrico) update.eval_cristocentrico = clasificacion.eval_cristocentrico;
    if (clasificacion.eval_fidelidad_biblica) update.eval_fidelidad_biblica = clasificacion.eval_fidelidad_biblica;
    if (clasificacion.eval_profundidad) update.eval_profundidad = clasificacion.eval_profundidad;
    if (clasificacion.eval_edificante) update.eval_edificante = clasificacion.eval_edificante;
    if (clasificacion.eval_doctrina_sana) update.eval_doctrina_sana = clasificacion.eval_doctrina_sana;

    if (update.eval_cristocentrico) {
      const total = Math.round(
        ((update.eval_cristocentrico || 85) + (update.eval_fidelidad_biblica || 85) +
         (update.eval_profundidad || 80) + (update.eval_edificante || 85) +
         (update.eval_doctrina_sana || 85)) / 5
      );
      update.eval_puntuacion_total = total;
      update.eval_aprobado = total >= 70;
    }

    update.eval_notas = 'Clasificado por IA';

    const { error: updateError } = await supabase
      .from('contenido')
      .update(update)
      .eq('id', c.id);

    if (!updateError) {
      actualizados++;
      const tags = (clasificacion.temas || []).slice(0, 3).join(', ');
      const verse = (clasificacion.pasajes || [])[0] || '-';
      console.log(`✓ [${tags}] ${verse}`);
    } else {
      console.log(`✗ ${updateError.message}`);
      errores++;
    }

    await sleep(400);
  }

  console.log(`\n━━━ RESUMEN ━━━`);
  console.log(`  Actualizados: ${actualizados}`);
  console.log(`  Errores: ${errores}`);
}

main().catch(console.error);
