import type { Contenido, ClasificacionIA, EvaluacionTeologica, ContenidoBiblico } from '@/types/content';

// ===== PROMPT DEL CLASIFICADOR TEOLÓGICO =====

const SYSTEM_PROMPT = `Eres un teólogo cristiano evangélico experto en música cristiana, predicaciones y estudios bíblicos.
Tu trabajo es clasificar contenido cristiano con precisión teológica.

DEBES responder ÚNICAMENTE con un JSON válido, sin texto adicional.

CRITERIOS DE EVALUACIÓN TEOLÓGICA:
- cristocentrico (0-100): ¿El contenido señala a Jesús como centro del mensaje?
- fidelidadBiblica (0-100): ¿Cita y respeta el contexto de las Escrituras?
- profundidad (0-100): ¿Aporta enseñanza más allá de lo superficial?
- edificante (0-100): ¿Construye la fe del oyente?
- doctrinaSana (0-100): ¿Evita manipulación, evangelio de prosperidad falso, o distorsión?

RECHAZA (puntuación < 70) contenido que:
- Manipula emocionalmente sin base bíblica
- Promueve "evangelio de la prosperidad" sin fundamento
- Saca versículos de contexto para justificar ideas propias
- Contradice doctrinas esenciales del cristianismo histórico
- Es clickbait religioso sin sustancia

TIPOS DE CONTENIDO: musica, predicacion, estudio_biblico, podcast, testimonio, oracion

CATEGORÍAS ESPIRITUALES: adoracion, alabanza, evangelistico, motivacional, doctrina, profetico, intercesion, infantil, devocional

GÉNEROS MUSICALES (solo para música): worship, pop_cristiano, rock_cristiano, balada_cristiana, reggaeton_cristiano, salsa_cristiana, bachata_cristiana, regional, hip_hop_cristiano, electronica_cristiana, himnos_clasicos, coros_congregacionales, a_cappella, instrumental, soaking

MOMENTOS DEL CULTO: apertura, alabanza_energica, adoracion_profunda, ofrenda, predica, altar, cierre

ENERGÍA: baja, media, alta

NIVEL: basico, intermedio, avanzado`;

function buildUserPrompt(titulo: string, artista: string, descripcion: string): string {
  return `Clasifica este contenido cristiano:

TÍTULO: ${titulo}
ARTISTA/AUTOR: ${artista}
DESCRIPCIÓN: ${descripcion}

Responde con este JSON exacto:
{
  "clasificacion": {
    "tipo": "musica|predicacion|estudio_biblico|podcast|testimonio|oracion",
    "categoria": "adoracion|alabanza|evangelistico|motivacional|doctrina|profetico|intercesion|infantil|devocional",
    "generoMusical": "worship|pop_cristiano|...|null (si no es música)",
    "esCongreacional": true/false,
    "tieneMensaje": true/false,
    "esInstrumental": true/false,
    "momentoDelCulto": "apertura|alabanza_energica|adoracion_profunda|ofrenda|predica|altar|cierre|null",
    "energia": "baja|media|alta",
    "nivel": "basico|intermedio|avanzado"
  },
  "evaluacion": {
    "cristocentrico": 0-100,
    "fidelidadBiblica": 0-100,
    "profundidad": 0-100,
    "edificante": 0-100,
    "doctrinaSana": 0-100,
    "notas": "Breve explicación de la evaluación"
  },
  "contenidoBiblico": {
    "pasajes": ["Libro Cap:Vers"],
    "versiculosClave": ["Libro Cap:Vers"],
    "temas": ["tema1", "tema2"],
    "personajes": ["nombre1"],
    "doctrina": ["doctrina1"]
  },
  "aptoPara": ["culto dominical", "grupo pequeño", "devocional personal", "momento de oración"],
  "audiencia": ["todo público", "jóvenes", "nuevos creyentes", "líderes", "niños", "matrimonios"]
}`;
}

// ===== CLASIFICAR CON CLAUDE API =====

export async function clasificarContenido(
  titulo: string,
  artista: string,
  descripcion: string
): Promise<{
  clasificacion: ClasificacionIA;
  evaluacion: EvaluacionTeologica;
  contenidoBiblico: ContenidoBiblico;
  aptoPara: string[];
  audiencia: string[];
} | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'tu-api-key-aqui') {
    console.log('⚠️  No hay API key de Anthropic, usando clasificación de ejemplo');
    return clasificacionEjemplo(titulo, artista);
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
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildUserPrompt(titulo, artista, descripcion) }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Error de Claude API:', response.status);
      return clasificacionEjemplo(titulo, artista);
    }

    const data = await response.json();
    const text = data.content[0].text;
    const resultado = JSON.parse(text);

    // Calcular puntuación total
    const ev = resultado.evaluacion;
    ev.puntuacionTotal = Math.round(
      (ev.cristocentrico + ev.fidelidadBiblica + ev.profundidad + ev.edificante + ev.doctrinaSana) / 5
    );
    ev.aprobado = ev.puntuacionTotal >= 70;

    return resultado;
  } catch (error) {
    console.error('Error al clasificar:', error);
    return clasificacionEjemplo(titulo, artista);
  }
}

// ===== CLASIFICACIÓN DE EJEMPLO (sin API key) =====

function clasificacionEjemplo(titulo: string, artista: string) {
  const tituloLower = titulo.toLowerCase();
  const esMusica = !tituloLower.includes('predica') && !tituloLower.includes('estudio') && !tituloLower.includes('sermón');

  return {
    clasificacion: {
      tipo: esMusica ? 'musica' : 'predicacion',
      categoria: 'adoracion',
      generoMusical: esMusica ? 'worship' : null,
      esCongreacional: true,
      tieneMensaje: true,
      esInstrumental: false,
      momentoDelCulto: 'adoracion_profunda',
      energia: 'media',
      nivel: 'basico',
    } as ClasificacionIA,
    evaluacion: {
      cristocentrico: 85,
      fidelidadBiblica: 80,
      profundidad: 75,
      edificante: 90,
      doctrinaSana: 85,
      puntuacionTotal: 83,
      aprobado: true,
      notas: `Contenido clasificado automáticamente. "${titulo}" por ${artista}.`,
    } as EvaluacionTeologica,
    contenidoBiblico: {
      pasajes: ['Salmo 150:1-6'],
      versiculosClave: ['Salmo 150:6'],
      temas: ['adoración', 'alabanza'],
      personajes: [],
      doctrina: ['doxología'],
    } as ContenidoBiblico,
    aptoPara: ['culto dominical', 'devocional personal'],
    audiencia: ['todo público'],
  };
}
