// ===== TIPOS PRINCIPALES DE GOSPELPLAY =====

export type TipoContenido = 'musica' | 'predicacion' | 'estudio_biblico' | 'podcast' | 'testimonio' | 'oracion';

export type CategoriaEspiritual =
  | 'adoracion'
  | 'alabanza'
  | 'evangelistico'
  | 'motivacional'
  | 'doctrina'
  | 'profetico'
  | 'intercesion'
  | 'infantil'
  | 'devocional';

export type GeneroMusical =
  | 'worship'
  | 'pop_cristiano'
  | 'rock_cristiano'
  | 'balada_cristiana'
  | 'reggaeton_cristiano'
  | 'salsa_cristiana'
  | 'bachata_cristiana'
  | 'regional'
  | 'hip_hop_cristiano'
  | 'electronica_cristiana'
  | 'himnos_clasicos'
  | 'coros_congregacionales'
  | 'a_cappella'
  | 'instrumental'
  | 'soaking';

export type MomentoDelCulto =
  | 'apertura'
  | 'alabanza_energica'
  | 'adoracion_profunda'
  | 'ofrenda'
  | 'predica'
  | 'altar'
  | 'cierre';

export type NivelProfundidad = 'basico' | 'intermedio' | 'avanzado';

export type Plataforma = 'spotify' | 'youtube' | 'apple_music';

export type Energia = 'baja' | 'media' | 'alta';

// ===== EVALUACIÓN TEOLÓGICA =====

export interface EvaluacionTeologica {
  cristocentrico: number;       // 0-100: ¿Señala a Jesús como centro?
  fidelidadBiblica: number;     // 0-100: ¿Respeta el contexto bíblico?
  profundidad: number;          // 0-100: ¿Aporta más allá de lo obvio?
  edificante: number;           // 0-100: ¿Construye fe?
  doctrinaSana: number;         // 0-100: ¿Evita distorsión del evangelio?
  puntuacionTotal: number;      // Promedio de los anteriores
  aprobado: boolean;            // true si puntuacionTotal >= 70
  notas: string;                // Observaciones de la IA
}

// ===== CLASIFICACIÓN IA =====

export interface ClasificacionIA {
  tipo: TipoContenido;
  categoria: CategoriaEspiritual;
  generoMusical: GeneroMusical | null;
  esCongreacional: boolean;
  tieneMensaje: boolean;
  esInstrumental: boolean;
  momentoDelCulto: MomentoDelCulto | null;
  energia: Energia;
  nivel: NivelProfundidad;
}

// ===== CONTENIDO BÍBLICO =====

export interface ContenidoBiblico {
  pasajes: string[];            // ["Juan 3:1-21", "Romanos 6:23"]
  versiculosClave: string[];    // ["Juan 3:16", "Juan 3:3"]
  temas: string[];              // ["nuevo nacimiento", "gracia", "salvación"]
  personajes: string[];         // ["Jesús", "Nicodemo"]
  doctrina: string[];           // ["soteriología", "regeneración"]
}

// ===== CONTENIDO (MODELO PRINCIPAL) =====

export interface Contenido {
  id: string;
  url: string;
  plataforma: Plataforma;

  // Metadata básica
  titulo: string;
  artista: string;
  descripcion: string;
  duracion: string;
  thumbnail: string;

  // Clasificación IA
  clasificacion: ClasificacionIA;
  evaluacion: EvaluacionTeologica;
  contenidoBiblico: ContenidoBiblico;

  // Recomendaciones
  aptoPara: string[];           // ["culto dominical", "grupo pequeño"]
  audiencia: string[];          // ["jóvenes", "nuevos creyentes"]

  // Metadata social
  likes: number;
  guardados: number;
  compartidos: number;

  // Control
  creadoPor: string;
  fechaCreacion: string;
  revisadoPorIA: boolean;
}

// ===== GUÍA DE ESTUDIO =====

export interface PasoGuia {
  orden: number;
  titulo: string;
  descripcion: string;
  contenido: Contenido;
}

export interface GuiaEstudio {
  id: string;
  pasajePrincipal: string;      // "Juan 3"
  titulo: string;               // "Jesús y Nicodemo: El Nuevo Nacimiento"
  contexto: string;             // Explicación del contexto bíblico
  versiculosClave: string[];
  pasos: PasoGuia[];
  temasRelacionados: string[];
  pasajesConectados: string[];
}

// ===== COMUNIDAD =====

export interface Comunidad {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  miembros: number;
  online: number;
  tipo: 'iglesia' | 'grupo_estudio' | 'banda' | 'oracion' | 'jovenes';
}

// ===== USUARIO =====

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  avatar: string;
  comunidades: string[];
  favoritos: string[];
  historial: string[];
}

// ===== PLAYLISTS =====

export interface Playlist {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  es_publica: boolean;
  items: PlaylistItem[];
  created_at: string;
}

export interface PlaylistItem {
  id: string;
  contenido: Contenido;
  orden: number;
}

// ===== FILTROS DE BÚSQUEDA =====

export interface FiltrosBusqueda {
  query?: string;
  tipo?: TipoContenido;
  categoria?: CategoriaEspiritual;
  generoMusical?: GeneroMusical;
  esCongreacional?: boolean;
  tieneMensaje?: boolean;
  momentoDelCulto?: MomentoDelCulto;
  energia?: Energia;
  nivel?: NivelProfundidad;
  pasaje?: string;
  tema?: string;
  puntuacionMinima?: number;
}
