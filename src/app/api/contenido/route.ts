import { NextRequest, NextResponse } from 'next/server';
import { todoContenido, guiasEstudio } from '@/lib/datos-ejemplo';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const tipo = searchParams.get('tipo') || '';
  const categoria = searchParams.get('categoria') || '';
  const pasaje = searchParams.get('pasaje') || '';
  const congregacional = searchParams.get('congregacional') === 'true';

  let resultados = [...todoContenido];

  // Filtro por búsqueda de texto
  if (query) {
    const q = query.toLowerCase();
    resultados = resultados.filter(c =>
      c.titulo.toLowerCase().includes(q) ||
      c.artista.toLowerCase().includes(q) ||
      c.contenidoBiblico.temas.some(t => t.toLowerCase().includes(q)) ||
      c.contenidoBiblico.pasajes.some(p => p.toLowerCase().includes(q)) ||
      c.contenidoBiblico.versiculosClave.some(v => v.toLowerCase().includes(q))
    );
  }

  // Filtro por tipo
  if (tipo) {
    resultados = resultados.filter(c => c.clasificacion.tipo === tipo);
  }

  // Filtro por categoría
  if (categoria) {
    resultados = resultados.filter(c => c.clasificacion.categoria === categoria);
  }

  // Filtro por pasaje bíblico
  if (pasaje) {
    const p = pasaje.toLowerCase();
    resultados = resultados.filter(c =>
      c.contenidoBiblico.pasajes.some(pas => pas.toLowerCase().includes(p))
    );
  }

  // Filtro congregacional
  if (congregacional) {
    resultados = resultados.filter(c => c.clasificacion.esCongreacional);
  }

  // Buscar guías de estudio relacionadas
  const guiasRelacionadas = query
    ? guiasEstudio.filter(g =>
        g.pasajePrincipal.toLowerCase().includes(query.toLowerCase()) ||
        g.temasRelacionados.some(t => t.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return NextResponse.json({
    contenido: resultados,
    guias: guiasRelacionadas,
    total: resultados.length,
  });
}
