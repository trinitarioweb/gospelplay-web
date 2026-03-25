import type { Contenido, ClasificacionIA, EvaluacionTeologica, ContenidoBiblico } from '@/types/content';

// ===== PROMPT DEL CLASIFICADOR TEOLÓGICO =====

const SYSTEM_PROMPT = `Eres un experto en música cristiana, predicaciones y estudios bíblicos con amplio conocimiento de artistas, bandas y predicadores cristianos de habla hispana y en inglés.

Tu trabajo es clasificar contenido cristiano con PRECISIÓN. Debes identificar correctamente el género musical basándote en el artista y el estilo conocido.

DEBES responder ÚNICAMENTE con un JSON válido, sin texto adicional, sin backticks, sin markdown.

ARTISTAS Y GÉNEROS CONOCIDOS (usa esto como referencia):
- Rock cristiano: Skillet, Switchfoot, Thousand Foot Krutch, Red, Decyfer Down, Kutless, Newsboys (rock), Rojo, Rescate, Kyosko, Cromosoma, Ángeles de Fuego
- Pop cristiano: Hillsong Young & Free, Lauren Daigle, Chris Tomlin, TobyMac, Casting Crowns, Julissa, Jesús Adrián Romero, Marcela Gándara
- Worship/Adoración: Hillsong Worship, Bethel Music, Elevation Worship, Miel San Marcos, Marco Barrientos, Marcos Witt, Christine D'Clario
- Reggaetón cristiano: Funky, Redimi2, Manny Montes, Alex Zurdo, Jaydan
- Hip hop cristiano: Lecrae, NF, Andy Mineo, Trip Lee, KB
- Balada cristiana: Danny Berrios, Roberto Orellana, Crystal Lewis
- Himnos clásicos: coros tradicionales, himnarios
- Soaking/Instrumental: música de fondo para oración

Si no conoces al artista, clasifica basándote en pistas del título (palabras como "rock", "metal", "rap", "reggaeton", "acústico", "en vivo", "live worship", etc.)

CRITERIOS DE EVALUACIÓN TEOLÓGICA:
- cristocentrico (0-100): ¿El contenido señala a Jesús como centro?
- fidelidadBiblica (0-100): ¿Cita y respeta el contexto bíblico?
- profundidad (0-100): ¿Aporta enseñanza sustancial?
- edificante (0-100): ¿Construye la fe?
- doctrinaSana (0-100): ¿Doctrina sana, sin manipulación?

RECHAZA (puntuación < 70) contenido que:
- Manipula emocionalmente sin base bíblica
- Promueve evangelio de prosperidad falso
- Saca versículos de contexto
- Contradice doctrinas esenciales del cristianismo
- Es clickbait religioso sin sustancia

TIPOS DE CONTENIDO: musica, predicacion, estudio_biblico, podcast, testimonio, oracion

CATEGORÍAS ESPIRITUALES: adoracion, alabanza, evangelistico, motivacional, doctrina, profetico, intercesion, infantil, devocional

GÉNEROS MUSICALES (solo para música): worship, pop_cristiano, rock_cristiano, balada_cristiana, reggaeton_cristiano, salsa_cristiana, bachata_cristiana, regional, hip_hop_cristiano, electronica_cristiana, himnos_clasicos, coros_congregacionales, a_cappella, instrumental, soaking, metal_cristiano

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

  console.log('🔑 API Key presente:', !!apiKey, apiKey ? `${apiKey.substring(0, 10)}...` : 'NO');

  if (!apiKey || apiKey === 'tu-api-key-aqui') {
    console.log('⚠️  No hay API key de Anthropic, usando clasificación de ejemplo');
    return clasificacionEjemplo(titulo, artista);
  }

  try {
    console.log('🤖 Llamando a Claude API para clasificar:', titulo);
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
      const errBody = await response.text();
      console.error('❌ Error de Claude API:', response.status, errBody);
      return clasificacionEjemplo(titulo, artista);
    }

    const data = await response.json();
    console.log('✅ Respuesta de Claude recibida');
    const text = data.content[0].text;

    // Limpiar posibles backticks de markdown
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const resultado = JSON.parse(cleanText);

    // Calcular puntuación total
    const ev = resultado.evaluacion;
    ev.puntuacionTotal = Math.round(
      (ev.cristocentrico + ev.fidelidadBiblica + ev.profundidad + ev.edificante + ev.doctrinaSana) / 5
    );
    ev.aprobado = ev.puntuacionTotal >= 70;

    console.log('✅ Clasificación exitosa:', resultado.clasificacion?.tipo, resultado.clasificacion?.generoMusical, ev.puntuacionTotal);
    return resultado;
  } catch (error) {
    console.error('❌ Error al clasificar:', error);
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
