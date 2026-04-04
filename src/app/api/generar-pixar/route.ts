import { NextRequest, NextResponse } from 'next/server';
import {
  iniciarGeneracion,
  consultarEstado,
  JUGADORES_COLOMBIA,
} from '@/lib/comfyui';

// POST /api/generar-pixar - Inicia generación
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const foto = formData.get('foto') as File | null;
    const jugadorId = formData.get('jugador') as string;

    if (!foto) {
      return NextResponse.json({ error: 'Falta la foto' }, { status: 400 });
    }

    const jugador = JUGADORES_COLOMBIA[jugadorId];
    if (!jugador) {
      return NextResponse.json(
        { error: 'Jugador no válido', disponibles: Object.keys(JUGADORES_COLOMBIA) },
        { status: 400 }
      );
    }

    // Convertir imagen a base64
    const buffer = Buffer.from(await foto.arrayBuffer());
    const imageBase64 = buffer.toString('base64');

    // Enviar a RunPod
    const jobId = await iniciarGeneracion(imageBase64, jugadorId);

    return NextResponse.json({
      jobId,
      jugador: jugador.nombre,
    });
  } catch (error) {
    console.error('Error generando imagen:', error);
    return NextResponse.json(
      { error: 'Error al iniciar generación', detalle: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/generar-pixar?id=<jobId> - Consultar estado
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('id');

  if (!jobId) {
    return NextResponse.json({ jugadores: JUGADORES_COLOMBIA });
  }

  try {
    const result = await consultarEstado(jobId);

    if (result.status === 'completed' && result.imageBase64) {
      // Retornar como data URL para mostrar directo en <img>
      return NextResponse.json({
        status: 'completed',
        image: `data:image/png;base64,${result.imageBase64}`,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error consultando estado', detalle: String(error) },
      { status: 500 }
    );
  }
}
