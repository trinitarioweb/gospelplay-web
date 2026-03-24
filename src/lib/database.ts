import { supabase } from './supabase';
import type { Contenido, ClasificacionIA, EvaluacionTeologica, ContenidoBiblico, GuiaEstudio, Comunidad } from '@/types/content';

// ===== HELPERS: convertir filas de DB a tipos de la app =====

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filaAContenido(row: any): Contenido {
  return {
    id: row.id,
    url: row.url,
    plataforma: row.plataforma,
    titulo: row.titulo,
    artista: row.artista,
    descripcion: row.descripcion || '',
    duracion: row.duracion || '',
    thumbnail: row.thumbnail || '',
    clasificacion: {
      tipo: row.tipo,
      categoria: row.categoria,
      generoMusical: row.genero_musical,
      esCongreacional: row.es_congregacional,
      tieneMensaje: row.tiene_mensaje,
      esInstrumental: row.es_instrumental || false,
      momentoDelCulto: row.momento_del_culto,
      energia: row.energia,
      nivel: row.nivel,
    },
    evaluacion: {
      cristocentrico: row.eval_cristocentrico,
      fidelidadBiblica: row.eval_fidelidad_biblica,
      profundidad: row.eval_profundidad,
      edificante: row.eval_edificante,
      doctrinaSana: row.eval_doctrina_sana,
      puntuacionTotal: row.eval_puntuacion_total,
      aprobado: row.eval_aprobado,
      notas: row.eval_notas || '',
    },
    contenidoBiblico: {
      pasajes: row.pasajes || [],
      versiculosClave: row.versiculos_clave || [],
      temas: row.temas || [],
      personajes: row.personajes || [],
      doctrina: row.doctrina || [],
    },
    aptoPara: row.apto_para || [],
    audiencia: row.audiencia || [],
    likes: row.likes || 0,
    guardados: row.guardados || 0,
    compartidos: row.compartidos || 0,
    creadoPor: row.creado_por || 'sistema',
    fechaCreacion: row.created_at,
    revisadoPorIA: row.revisado_por_ia,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filaAGuia(row: any): GuiaEstudio {
  return {
    id: row.id,
    pasajePrincipal: row.pasaje_principal,
    titulo: row.titulo,
    contexto: row.contexto || '',
    versiculosClave: row.versiculos_clave || [],
    pasos: [], // se llenan aparte
    temasRelacionados: row.temas_relacionados || [],
    pasajesConectados: row.pasajes_conectados || [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filaAComunidad(row: any): Comunidad {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion || '',
    imagen: row.imagen || '⛪',
    miembros: row.miembros_count?.[0]?.count || 0,
    online: Math.floor(Math.random() * 50) + 5, // simulado por ahora
    tipo: row.tipo,
  };
}

// ===== QUERIES DE CONTENIDO =====

export async function obtenerMusica() {
  const { data, error } = await supabase
    .from('contenido')
    .select('*')
    .eq('tipo', 'musica')
    .eq('publicado', true)
    .eq('eval_aprobado', true)
    .order('eval_puntuacion_total', { ascending: false });

  if (error) { console.error('Error obteniendo música:', error); return []; }
  return (data || []).map(filaAContenido);
}

export async function obtenerEnsenanzas() {
  const { data, error } = await supabase
    .from('contenido')
    .select('*')
    .in('tipo', ['predicacion', 'podcast'])
    .eq('publicado', true)
    .eq('eval_aprobado', true)
    .order('eval_puntuacion_total', { ascending: false });

  if (error) { console.error('Error obteniendo enseñanzas:', error); return []; }
  return (data || []).map(filaAContenido);
}

export async function obtenerEstudios() {
  const { data, error } = await supabase
    .from('contenido')
    .select('*')
    .eq('tipo', 'estudio_biblico')
    .eq('publicado', true)
    .eq('eval_aprobado', true)
    .order('eval_puntuacion_total', { ascending: false });

  if (error) { console.error('Error obteniendo estudios:', error); return []; }
  return (data || []).map(filaAContenido);
}

export async function obtenerTodoContenido() {
  const { data, error } = await supabase
    .from('contenido')
    .select('*')
    .eq('publicado', true)
    .eq('eval_aprobado', true)
    .order('eval_puntuacion_total', { ascending: false });

  if (error) { console.error('Error obteniendo contenido:', error); return []; }
  return (data || []).map(filaAContenido);
}

export async function buscarContenido(query: string, filtros?: {
  tipo?: string;
  congregacional?: boolean;
}) {
  let q = supabase
    .from('contenido')
    .select('*')
    .eq('publicado', true)
    .eq('eval_aprobado', true);

  if (filtros?.tipo) q = q.eq('tipo', filtros.tipo);
  if (filtros?.congregacional) q = q.eq('es_congregacional', true);

  if (query.trim()) {
    // Buscar en título, artista, temas, pasajes
    q = q.or(`titulo.ilike.%${query}%,artista.ilike.%${query}%,temas.cs.{${query}},pasajes.cs.{${query}}`);
  }

  const { data, error } = await q.order('eval_puntuacion_total', { ascending: false });
  if (error) { console.error('Error buscando:', error); return []; }
  return (data || []).map(filaAContenido);
}

// ===== QUERIES DE GUÍAS =====

export async function obtenerGuias() {
  const { data, error } = await supabase
    .from('guias_estudio')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('Error obteniendo guías:', error); return []; }

  // Para cada guía, obtener sus pasos con contenido
  const guias: GuiaEstudio[] = [];
  for (const row of data || []) {
    const guia = filaAGuia(row);

    const { data: pasos } = await supabase
      .from('guia_pasos')
      .select('*, contenido(*)')
      .eq('guia_id', row.id)
      .order('orden', { ascending: true });

    guia.pasos = (pasos || []).map((p) => ({
      orden: p.orden,
      titulo: p.titulo,
      descripcion: p.descripcion || '',
      contenido: p.contenido ? filaAContenido(p.contenido) : null as unknown as Contenido,
    }));

    guias.push(guia);
  }

  return guias;
}

// ===== QUERIES DE COMUNIDADES =====

export async function obtenerComunidades() {
  const { data, error } = await supabase
    .from('comunidades')
    .select('*, miembros_count:comunidad_miembros(count)')
    .order('created_at', { ascending: false });

  if (error) { console.error('Error obteniendo comunidades:', error); return []; }
  return (data || []).map(filaAComunidad);
}

// ===== QUERIES DEL BOT =====

export async function obtenerBotLog() {
  const { data, error } = await supabase
    .from('bot_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) { console.error('Error obteniendo bot log:', error); return []; }
  return data || [];
}

export async function obtenerEstadisticas() {
  const { count: total } = await supabase.from('contenido').select('*', { count: 'exact', head: true });
  const { count: aprobados } = await supabase.from('contenido').select('*', { count: 'exact', head: true }).eq('eval_aprobado', true);
  const { count: guias } = await supabase.from('guias_estudio').select('*', { count: 'exact', head: true });

  return {
    contenidoAnalizado: total || 0,
    contenidoAprobado: aprobados || 0,
    contenidoRechazado: (total || 0) - (aprobados || 0),
    guiasGeneradas: guias || 0,
  };
}

// ===== ACCIONES =====

export async function toggleFavorito(usuarioId: string, contenidoId: string) {
  // Verificar si ya existe
  const { data: existe } = await supabase
    .from('favoritos')
    .select('id')
    .eq('usuario_id', usuarioId)
    .eq('contenido_id', contenidoId)
    .single();

  if (existe) {
    await supabase.from('favoritos').delete().eq('id', existe.id);
    return false; // quitó favorito
  } else {
    await supabase.from('favoritos').insert({ usuario_id: usuarioId, contenido_id: contenidoId });
    return true; // agregó favorito
  }
}

export async function obtenerFavoritos(usuarioId: string) {
  const { data, error } = await supabase
    .from('favoritos')
    .select('contenido_id')
    .eq('usuario_id', usuarioId);

  if (error) return new Set<string>();
  return new Set((data || []).map(f => f.contenido_id));
}

export async function registrarBusqueda(query: string, resultados: number) {
  await supabase.from('busquedas').insert({ query, resultados });
}
