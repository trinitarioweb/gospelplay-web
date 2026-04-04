// ===== RUNPOD SERVERLESS CLIENT =====
// Conecta tu Next.js app con ComfyUI corriendo en RunPod

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY!;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID!;
const RUNPOD_BASE = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}`;

// ===== JUGADORES =====

export const JUGADORES_COLOMBIA: Record<string, {
  nombre: string;
  numero: string;
  refImage: string;
  posicion: string;
}> = {
  james:    { nombre: "James Rodriguez",  numero: "10", refImage: "james_rodriguez_ref.png",  posicion: "Mediocampista" },
  diaz:     { nombre: "Luis Diaz",        numero: "7",  refImage: "luis_diaz_ref.png",        posicion: "Extremo" },
  falcao:   { nombre: "Radamel Falcao",   numero: "9",  refImage: "falcao_ref.png",           posicion: "Delantero" },
  cuadrado: { nombre: "Juan Cuadrado",    numero: "11", refImage: "cuadrado_ref.png",         posicion: "Mediocampista" },
  ospina:   { nombre: "David Ospina",     numero: "1",  refImage: "ospina_ref.png",           posicion: "Portero" },
  arias:    { nombre: "Santiago Arias",    numero: "4",  refImage: "arias_ref.png",            posicion: "Lateral" },
};

// ===== API FUNCTIONS =====

interface RunPodResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  output?: {
    image_base64?: string;
    error?: string;
    jugador?: string;
    status?: string;
  };
  error?: string;
}

/** Inicia una generación en RunPod (async - retorna job ID) */
export async function iniciarGeneracion(
  imageBase64: string,
  jugadorId: string
): Promise<string> {
  const res = await fetch(`${RUNPOD_BASE}/run`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        image_base64: imageBase64,
        jugador: jugadorId,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`RunPod error: ${err}`);
  }

  const data = await res.json();
  return data.id; // Job ID
}

/** Consulta el estado de un job en RunPod */
export async function consultarEstado(jobId: string): Promise<{
  status: 'pending' | 'running' | 'completed' | 'error';
  imageBase64?: string;
  error?: string;
}> {
  const res = await fetch(`${RUNPOD_BASE}/status/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
    },
  });

  if (!res.ok) {
    return { status: 'pending' };
  }

  const data: RunPodResponse = await res.json();

  switch (data.status) {
    case 'COMPLETED':
      if (data.output?.error) {
        return { status: 'error', error: data.output.error };
      }
      return {
        status: 'completed',
        imageBase64: data.output?.image_base64,
      };
    case 'FAILED':
    case 'CANCELLED':
      return { status: 'error', error: data.error || 'Job failed' };
    case 'IN_PROGRESS':
      return { status: 'running' };
    default:
      return { status: 'pending' };
  }
}

/** Inicia generación y espera resultado (sync) - útil para testing */
export async function generarSync(
  imageBase64: string,
  jugadorId: string
): Promise<string> {
  const res = await fetch(`${RUNPOD_BASE}/runsync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        image_base64: imageBase64,
        jugador: jugadorId,
      },
    }),
  });

  if (!res.ok) throw new Error(`RunPod error: ${await res.text()}`);

  const data: RunPodResponse = await res.json();

  if (data.output?.image_base64) {
    return data.output.image_base64;
  }

  throw new Error(data.output?.error || 'No se generó imagen');
}
