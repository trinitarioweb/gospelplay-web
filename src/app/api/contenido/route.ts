import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - buscar contenido
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const tipo = searchParams.get('tipo') || '';

  let q = supabase
    .from('contenido')
    .select('*')
    .eq('publicado', true)
    .eq('eval_aprobado', true);

  if (tipo) q = q.eq('tipo', tipo);
  if (query.trim()) {
    q = q.or(`titulo.ilike.%${query}%,artista.ilike.%${query}%`);
  }

  const { data, error } = await q.order('eval_puntuacion_total', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contenido: data || [], total: (data || []).length });
}

// POST - guardar contenido nuevo (aprobado por IA)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('contenido')
      .insert({
        url: body.url,
        plataforma: body.plataforma || 'youtube',
        titulo: body.titulo,
        artista: body.artista,
        descripcion: body.descripcion || '',
        duracion: body.duracion || '',
        thumbnail: body.thumbnail || '',
        tipo: body.clasificacion.tipo,
        categoria: body.clasificacion.categoria,
        genero_musical: body.clasificacion.generoMusical,
        es_congregacional: body.clasificacion.esCongreacional || false,
        tiene_mensaje: body.clasificacion.tieneMensaje || false,
        es_instrumental: body.clasificacion.esInstrumental || false,
        momento_del_culto: body.clasificacion.momentoDelCulto,
        energia: body.clasificacion.energia || 'media',
        nivel: body.clasificacion.nivel || 'basico',
        eval_cristocentrico: body.evaluacion.cristocentrico,
        eval_fidelidad_biblica: body.evaluacion.fidelidadBiblica,
        eval_profundidad: body.evaluacion.profundidad,
        eval_edificante: body.evaluacion.edificante,
        eval_doctrina_sana: body.evaluacion.doctrinaSana,
        eval_puntuacion_total: body.evaluacion.puntuacionTotal,
        eval_aprobado: body.evaluacion.aprobado,
        eval_notas: body.evaluacion.notas || '',
        pasajes: body.contenidoBiblico?.pasajes || [],
        versiculos_clave: body.contenidoBiblico?.versiculosClave || [],
        temas: body.contenidoBiblico?.temas || [],
        personajes: body.contenidoBiblico?.personajes || [],
        doctrina: body.contenidoBiblico?.doctrina || [],
        apto_para: body.aptoPara || [],
        audiencia: body.audiencia || [],
        publicado: true,
        revisado_por_ia: true,
        creado_por: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error guardando contenido:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, contenido: data });
  } catch (error) {
    console.error('Error en POST /api/contenido:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
