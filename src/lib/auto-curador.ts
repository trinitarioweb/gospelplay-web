// ===== MOTOR DE AUTO-GESTIÓN DE GOSPELPLAY =====
// Este módulo maneja la curación automática de contenido:
// 1. Descubre contenido nuevo (Spotify/YouTube)
// 2. Lo clasifica con IA teológica
// 3. Genera guías de estudio automáticas
// 4. Analiza tendencias
// 5. Publica solo lo que pasa el filtro teológico

// ===== PROMPT PARA GENERAR GUÍAS DE ESTUDIO =====

const PROMPT_GUIA_ESTUDIO = `Eres un teólogo cristiano evangélico experto en hermenéutica bíblica.
Tu trabajo es crear guías de estudio bíblico completas para una porción de la Escritura.

DEBES responder ÚNICAMENTE con un JSON válido.

Para la porción bíblica dada, genera:
1. Contexto histórico y literario del pasaje
2. Versículos clave con explicación breve
3. Temas principales que se abordan
4. Preguntas de reflexión para grupo pequeño
5. Aplicación práctica para la vida diaria
6. Pasajes conectados en el resto de la Biblia
7. Temas relacionados para seguir estudiando

Sé cristocéntrico: siempre conecta el pasaje con Cristo y el evangelio.`;

const PROMPT_ANALIZAR_TENDENCIAS = `Eres un analista de contenido cristiano.
Basándote en los datos proporcionados, identifica:
1. Temas más buscados esta semana
2. Contenido con mayor engagement
3. Vacíos de contenido (temas sin suficiente material)
4. Recomendaciones de contenido a buscar

Responde en JSON.`;

// ===== TIPOS DEL AUTO-CURADOR =====

export interface TareaAutoGestion {
  id: string;
  tipo: 'descubrir' | 'clasificar' | 'generar_guia' | 'analizar_tendencias' | 'publicar';
  estado: 'pendiente' | 'procesando' | 'completado' | 'error';
  descripcion: string;
  resultado?: string;
  fechaCreacion: string;
  fechaCompletado?: string;
}

export interface EstadisticasBot {
  contenidoAnalizado: number;
  contenidoAprobado: number;
  contenidoRechazado: number;
  guiasGeneradas: number;
  ultimaEjecucion: string;
  tendenciasDetectadas: string[];
  vaciosContenido: string[];
}

export interface GuiaBiblicaGenerada {
  pasaje: string;
  titulo: string;
  contexto: string;
  versiculosClave: { cita: string; explicacion: string }[];
  temasMainales: string[];
  preguntasReflexion: string[];
  aplicacionPractica: string[];
  pasajesConectados: string[];
  temasRelacionados: string[];
}

// ===== FUNCIONES DEL AUTO-CURADOR =====

export async function generarGuiaBiblica(pasaje: string): Promise<GuiaBiblicaGenerada | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'tu-api-key-aqui') {
    return guiaBiblicaEjemplo(pasaje);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: PROMPT_GUIA_ESTUDIO,
        messages: [{
          role: 'user',
          content: `Genera una guía de estudio bíblico completa para: ${pasaje}

Responde con este JSON:
{
  "pasaje": "${pasaje}",
  "titulo": "Título descriptivo del estudio",
  "contexto": "Contexto histórico y literario (2-3 párrafos)",
  "versiculosClave": [
    { "cita": "Libro Cap:Vers", "explicacion": "Explicación breve" }
  ],
  "temasMainales": ["tema1", "tema2"],
  "preguntasReflexion": ["¿Pregunta 1?", "¿Pregunta 2?"],
  "aplicacionPractica": ["Aplicación 1", "Aplicación 2"],
  "pasajesConectados": ["Libro Cap:Vers"],
  "temasRelacionados": ["tema1", "tema2"]
}`
        }],
      }),
    });

    if (!response.ok) return guiaBiblicaEjemplo(pasaje);

    const data = await response.json();
    return JSON.parse(data.content[0].text);
  } catch {
    return guiaBiblicaEjemplo(pasaje);
  }
}

export async function analizarTendencias(
  busquedasRecientes: string[],
  contenidoPopular: { titulo: string; likes: number; temas: string[] }[]
): Promise<{
  temasTrending: string[];
  vaciosContenido: string[];
  recomendaciones: string[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'tu-api-key-aqui') {
    return {
      temasTrending: ['gracia', 'salvación', 'Espíritu Santo', 'fe', 'oración'],
      vaciosContenido: ['Apocalipsis', 'Levítico', 'profetas menores', 'matrimonio cristiano'],
      recomendaciones: [
        'Buscar más estudios sobre Apocalipsis',
        'Agregar contenido sobre matrimonio cristiano',
        'Más música en géneros urbanos (reggaetón, trap cristiano)',
        'Contenido para niños y adolescentes',
      ],
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: PROMPT_ANALIZAR_TENDENCIAS,
        messages: [{
          role: 'user',
          content: `Analiza estas tendencias:

Búsquedas recientes: ${JSON.stringify(busquedasRecientes)}
Contenido popular: ${JSON.stringify(contenidoPopular)}

Responde con: { "temasTrending": [...], "vaciosContenido": [...], "recomendaciones": [...] }`
        }],
      }),
    });

    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return JSON.parse(data.content[0].text);
  } catch {
    return {
      temasTrending: ['gracia', 'salvación', 'fe'],
      vaciosContenido: ['Apocalipsis', 'profetas menores'],
      recomendaciones: ['Agregar más estudios expositivos'],
    };
  }
}

// ===== SIMULACIÓN DE AUTO-GESTIÓN =====

export function obtenerEstadisticasBot(): EstadisticasBot {
  return {
    contenidoAnalizado: 847,
    contenidoAprobado: 623,
    contenidoRechazado: 224,
    guiasGeneradas: 156,
    ultimaEjecucion: new Date().toISOString(),
    tendenciasDetectadas: ['gracia', 'salvación', 'Espíritu Santo', 'identidad en Cristo', 'oración'],
    vaciosContenido: ['Apocalipsis', 'profetas menores', 'matrimonio cristiano', 'finanzas bíblicas'],
  };
}

export function obtenerTareasRecientes(): TareaAutoGestion[] {
  const ahora = new Date();
  return [
    {
      id: 't1', tipo: 'descubrir', estado: 'completado',
      descripcion: 'Escaneó 50 videos nuevos en YouTube sobre "adoración 2024"',
      resultado: '12 aprobados, 38 rechazados',
      fechaCreacion: new Date(ahora.getTime() - 3600000).toISOString(),
      fechaCompletado: new Date(ahora.getTime() - 3000000).toISOString(),
    },
    {
      id: 't2', tipo: 'clasificar', estado: 'completado',
      descripcion: 'Clasificó 12 contenidos nuevos con IA teológica',
      resultado: '10 publicados, 2 requieren revisión manual',
      fechaCreacion: new Date(ahora.getTime() - 2700000).toISOString(),
      fechaCompletado: new Date(ahora.getTime() - 2400000).toISOString(),
    },
    {
      id: 't3', tipo: 'generar_guia', estado: 'completado',
      descripcion: 'Generó guía de estudio para Filipenses 4',
      resultado: 'Guía publicada con 4 contenidos relacionados',
      fechaCreacion: new Date(ahora.getTime() - 1800000).toISOString(),
      fechaCompletado: new Date(ahora.getTime() - 1200000).toISOString(),
    },
    {
      id: 't4', tipo: 'analizar_tendencias', estado: 'completado',
      descripcion: 'Analizó tendencias de la última semana',
      resultado: 'Tema trending: "identidad en Cristo" (+340% búsquedas)',
      fechaCreacion: new Date(ahora.getTime() - 900000).toISOString(),
      fechaCompletado: new Date(ahora.getTime() - 600000).toISOString(),
    },
    {
      id: 't5', tipo: 'descubrir', estado: 'procesando',
      descripcion: 'Buscando nuevas predicaciones sobre "Espíritu Santo" en YouTube...',
      fechaCreacion: new Date(ahora.getTime() - 300000).toISOString(),
    },
  ];
}

// ===== GUÍA DE EJEMPLO (sin API key) =====

function guiaBiblicaEjemplo(pasaje: string): GuiaBiblicaGenerada {
  return {
    pasaje,
    titulo: `Estudio de ${pasaje}`,
    contexto: `${pasaje} es un pasaje fundamental de las Escrituras que nos enseña verdades profundas sobre el carácter de Dios y su plan de salvación. Este estudio te guiará verso por verso para entender el contexto histórico, el significado original y la aplicación para tu vida hoy.`,
    versiculosClave: [
      { cita: `${pasaje}:1`, explicacion: 'Verso de apertura que establece el contexto del pasaje.' },
      { cita: `${pasaje} (verso central)`, explicacion: 'El corazón del mensaje de este pasaje.' },
    ],
    temasMainales: ['amor de Dios', 'fe', 'obediencia', 'gracia'],
    preguntasReflexion: [
      '¿Qué te enseña este pasaje sobre el carácter de Dios?',
      '¿Cómo se conecta este pasaje con el evangelio de Cristo?',
      '¿Qué cambio práctico puedes hacer esta semana basado en esta enseñanza?',
      '¿Hay alguna promesa en este pasaje que puedas reclamar hoy?',
    ],
    aplicacionPractica: [
      'Medita en el versículo clave durante esta semana',
      'Comparte lo aprendido con alguien de tu grupo pequeño',
      'Ora basándote en las verdades de este pasaje',
    ],
    pasajesConectados: ['Romanos 8:28', 'Efesios 2:8-9', 'Juan 3:16'],
    temasRelacionados: ['salvación', 'gracia', 'fe', 'esperanza'],
  };
}
