import { supabase } from './supabase';
import type { Contenido, ClasificacionIA, EvaluacionTeologica, ContenidoBiblico, GuiaEstudio, Comunidad, Playlist, PlaylistItem, Artista } from '@/types/content';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filaAArtista(row: any): Artista {
  return {
    id: row.id,
    nombre: row.nombre,
    slug: row.slug,
    imagen: row.imagen || '',
    banner: row.banner || '',
    bio: row.bio || '',
    pais: row.pais || '',
    generos: row.generos || [],
    tipo: row.tipo || 'artista',
    youtube_canal: row.youtube_canal || '',
    spotify_id: row.spotify_id || '',
    artistas_relacionados: row.artistas_relacionados || [],
    seguidores: row.seguidores || 0,
    verificado: row.verificado || false,
  };
}

// ===== QUERIES DE ARTISTAS =====

export async function obtenerArtistas(): Promise<Artista[]> {
  const { data, error } = await supabase
    .from('artistas')
    .select('*')
    .eq('activo', true)
    .order('seguidores', { ascending: false });

  if (error) { console.error('Error obteniendo artistas:', error); return []; }
  return (data || []).map(filaAArtista);
}

export async function obtenerArtistaPorSlug(slug: string): Promise<Artista | null> {
  const { data, error } = await supabase
    .from('artistas')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  const artista = filaAArtista(data);

  // Get their content
  const { data: contenido } = await supabase
    .from('contenido')
    .select('*')
    .eq('artista_id', data.id)
    .eq('publicado', true)
    .eq('eval_aprobado', true)
    .order('likes', { ascending: false });

  artista.canciones = (contenido || []).map(filaAContenido);
  return artista;
}

export async function obtenerArtistasRelacionados(slugs: string[]): Promise<Artista[]> {
  if (!slugs.length) return [];
  const { data, error } = await supabase
    .from('artistas')
    .select('*')
    .in('slug', slugs)
    .eq('activo', true);

  if (error) return [];
  return (data || []).map(filaAArtista);
}

export async function obtenerArtistasPorGenero(genero: string): Promise<Artista[]> {
  const { data, error } = await supabase
    .from('artistas')
    .select('*')
    .contains('generos', [genero])
    .eq('activo', true)
    .order('seguidores', { ascending: false });

  if (error) return [];
  return (data || []).map(filaAArtista);
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

// ===== QUERIES DE PLAYLISTS =====

export async function obtenerPlaylists(): Promise<Playlist[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select('*, playlist_items(count)')
    .order('created_at', { ascending: false });

  if (error) { console.error('Error obteniendo playlists:', error); return []; }
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    nombre: row.nombre as string,
    descripcion: (row.descripcion as string) || '',
    imagen: (row.imagen as string) || '',
    es_publica: (row.es_publica as boolean) ?? true,
    items: [],
    created_at: row.created_at as string,
    _itemCount: ((row.playlist_items as Array<{ count: number }>)?.[0]?.count) || 0,
  })) as (Playlist & { _itemCount: number })[];
}

export async function obtenerPlaylist(id: string): Promise<Playlist | null> {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) { console.error('Error obteniendo playlist:', error); return null; }

  const { data: items, error: itemsError } = await supabase
    .from('playlist_items')
    .select('*, contenido(*)')
    .eq('playlist_id', id)
    .order('orden', { ascending: true });

  if (itemsError) { console.error('Error obteniendo items de playlist:', itemsError); }

  const playlistItems: PlaylistItem[] = (items || []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    contenido: filaAContenido(item.contenido),
    orden: item.orden as number,
  }));

  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    imagen: data.imagen || '',
    es_publica: data.es_publica ?? true,
    items: playlistItems,
    created_at: data.created_at,
  };
}

export async function crearPlaylist(nombre: string, descripcion: string): Promise<Playlist | null> {
  const { data, error } = await supabase
    .from('playlists')
    .insert({ nombre, descripcion })
    .select()
    .single();

  if (error || !data) { console.error('Error creando playlist:', error); return null; }

  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    imagen: data.imagen || '',
    es_publica: data.es_publica ?? true,
    items: [],
    created_at: data.created_at,
  };
}

export async function agregarAPlaylist(playlistId: string, contenidoId: string): Promise<boolean> {
  // Get current max order
  const { data: existing } = await supabase
    .from('playlist_items')
    .select('orden')
    .eq('playlist_id', playlistId)
    .order('orden', { ascending: false })
    .limit(1);

  const nextOrden = existing && existing.length > 0 ? (existing[0].orden as number) + 1 : 0;

  const { error } = await supabase
    .from('playlist_items')
    .insert({ playlist_id: playlistId, contenido_id: contenidoId, orden: nextOrden });

  if (error) { console.error('Error agregando a playlist:', error); return false; }
  return true;
}

export async function eliminarDePlaylist(playlistId: string, contenidoId: string): Promise<boolean> {
  const { error } = await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('contenido_id', contenidoId);

  if (error) { console.error('Error eliminando de playlist:', error); return false; }
  return true;
}

export async function eliminarPlaylist(id: string): Promise<boolean> {
  // Delete items first
  await supabase.from('playlist_items').delete().eq('playlist_id', id);

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', id);

  if (error) { console.error('Error eliminando playlist:', error); return false; }
  return true;
}
