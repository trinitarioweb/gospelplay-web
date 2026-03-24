import type { Contenido, GuiaEstudio, Comunidad } from '@/types/content';

// ===== MÚSICA =====

export const musica: Contenido[] = [
  {
    id: 'm1', url: 'https://open.spotify.com/track/ejemplo1', plataforma: 'spotify',
    titulo: 'Jesús Tú Eres Mi Rey', artista: 'Marcos Witt', descripcion: 'Adoración congregacional centrada en la soberanía de Cristo',
    duracion: '3:45', thumbnail: '',
    clasificacion: { tipo: 'musica', categoria: 'adoracion', generoMusical: 'worship', esCongreacional: true, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'adoracion_profunda', energia: 'media', nivel: 'basico' },
    evaluacion: { cristocentrico: 95, fidelidadBiblica: 90, profundidad: 80, edificante: 92, doctrinaSana: 95, puntuacionTotal: 90, aprobado: true, notas: 'Excelente canción cristocéntrica que exalta la soberanía de Cristo.' },
    contenidoBiblico: { pasajes: ['Apocalipsis 19:16', 'Filipenses 2:9-11'], versiculosClave: ['Apocalipsis 19:16'], temas: ['soberanía de Cristo', 'adoración', 'reino de Dios'], personajes: ['Jesús'], doctrina: ['cristología'] },
    aptoPara: ['culto dominical', 'grupo pequeño'], audiencia: ['todo público'],
    likes: 2340, guardados: 890, compartidos: 456, creadoPor: 'sistema', fechaCreacion: '2024-01-15', revisadoPorIA: true,
  },
  {
    id: 'm2', url: 'https://www.youtube.com/watch?v=ejemplo2', plataforma: 'youtube',
    titulo: 'Gracia Sublime', artista: 'Bethel Music en Español', descripcion: 'Adoración profunda sobre la gracia inmerecida de Dios',
    duracion: '5:12', thumbnail: '',
    clasificacion: { tipo: 'musica', categoria: 'adoracion', generoMusical: 'worship', esCongreacional: true, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'adoracion_profunda', energia: 'baja', nivel: 'basico' },
    evaluacion: { cristocentrico: 92, fidelidadBiblica: 88, profundidad: 85, edificante: 95, doctrinaSana: 90, puntuacionTotal: 90, aprobado: true, notas: 'Canción centrada en la gracia de Dios. Letra teológicamente sólida.' },
    contenidoBiblico: { pasajes: ['Efesios 2:8-9', 'Romanos 5:8'], versiculosClave: ['Efesios 2:8-9'], temas: ['gracia', 'salvación', 'amor de Dios'], personajes: ['Jesús'], doctrina: ['soteriología'] },
    aptoPara: ['culto dominical', 'momento de oración', 'devocional personal'], audiencia: ['todo público', 'nuevos creyentes'],
    likes: 1890, guardados: 720, compartidos: 389, creadoPor: 'sistema', fechaCreacion: '2024-01-20', revisadoPorIA: true,
  },
  {
    id: 'm3', url: 'https://open.spotify.com/track/ejemplo4', plataforma: 'spotify',
    titulo: 'Espíritu Santo', artista: 'Kari Jobe', descripcion: 'Invocación al Espíritu Santo en adoración profunda',
    duracion: '4:28', thumbnail: '',
    clasificacion: { tipo: 'musica', categoria: 'adoracion', generoMusical: 'worship', esCongreacional: true, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'altar', energia: 'baja', nivel: 'basico' },
    evaluacion: { cristocentrico: 85, fidelidadBiblica: 88, profundidad: 78, edificante: 92, doctrinaSana: 90, puntuacionTotal: 87, aprobado: true, notas: 'Invocación reverente al Espíritu Santo.' },
    contenidoBiblico: { pasajes: ['Juan 14:26', 'Hechos 2:1-4'], versiculosClave: ['Juan 14:26'], temas: ['Espíritu Santo', 'presencia de Dios'], personajes: ['Espíritu Santo'], doctrina: ['pneumatología'] },
    aptoPara: ['culto dominical', 'momento de oración', 'altar'], audiencia: ['todo público'],
    likes: 1560, guardados: 670, compartidos: 320, creadoPor: 'sistema', fechaCreacion: '2024-02-10', revisadoPorIA: true,
  },
  {
    id: 'm4', url: 'https://open.spotify.com/track/ejemplo6', plataforma: 'spotify',
    titulo: 'Porque De Tal Manera', artista: 'Miel San Marcos', descripcion: 'Canción basada en Juan 3:16',
    duracion: '4:15', thumbnail: '',
    clasificacion: { tipo: 'musica', categoria: 'adoracion', generoMusical: 'pop_cristiano', esCongreacional: true, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'adoracion_profunda', energia: 'media', nivel: 'basico' },
    evaluacion: { cristocentrico: 95, fidelidadBiblica: 90, profundidad: 82, edificante: 93, doctrinaSana: 92, puntuacionTotal: 90, aprobado: true, notas: 'Basada directamente en Juan 3:16. Mensaje claro del evangelio.' },
    contenidoBiblico: { pasajes: ['Juan 3:16'], versiculosClave: ['Juan 3:16'], temas: ['amor de Dios', 'sacrificio', 'salvación'], personajes: ['Jesús'], doctrina: ['soteriología'] },
    aptoPara: ['culto dominical', 'evangelismo'], audiencia: ['todo público', 'nuevos creyentes'],
    likes: 4230, guardados: 1670, compartidos: 920, creadoPor: 'sistema', fechaCreacion: '2024-02-20', revisadoPorIA: true,
  },
  {
    id: 'm5', url: 'https://open.spotify.com/track/ejemplo7', plataforma: 'spotify',
    titulo: 'Firme y Adelante', artista: 'Himnario Cristiano', descripcion: 'Himno clásico de la iglesia cristiana',
    duracion: '3:15', thumbnail: '',
    clasificacion: { tipo: 'musica', categoria: 'alabanza', generoMusical: 'himnos_clasicos', esCongreacional: true, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'apertura', energia: 'alta', nivel: 'basico' },
    evaluacion: { cristocentrico: 88, fidelidadBiblica: 92, profundidad: 80, edificante: 90, doctrinaSana: 95, puntuacionTotal: 89, aprobado: true, notas: 'Himno clásico con doctrina sólida.' },
    contenidoBiblico: { pasajes: ['Efesios 6:10-18'], versiculosClave: ['Efesios 6:10'], temas: ['perseverancia', 'fe', 'valentía'], personajes: [], doctrina: ['eclesiología'] },
    aptoPara: ['culto dominical', 'apertura de servicio'], audiencia: ['todo público'],
    likes: 980, guardados: 430, compartidos: 210, creadoPor: 'sistema', fechaCreacion: '2024-03-01', revisadoPorIA: true,
  },
  {
    id: 'm6', url: 'https://open.spotify.com/track/ejemplo8', plataforma: 'spotify',
    titulo: 'Avívanos', artista: 'New Wine', descripcion: 'Reggaetón cristiano con mensaje de avivamiento',
    duracion: '3:50', thumbnail: '',
    clasificacion: { tipo: 'musica', categoria: 'alabanza', generoMusical: 'reggaeton_cristiano', esCongreacional: false, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'alabanza_energica', energia: 'alta', nivel: 'basico' },
    evaluacion: { cristocentrico: 82, fidelidadBiblica: 78, profundidad: 70, edificante: 85, doctrinaSana: 80, puntuacionTotal: 79, aprobado: true, notas: 'Ritmo urbano con mensaje de avivamiento.' },
    contenidoBiblico: { pasajes: ['Hechos 2:1-4', 'Habacuc 3:2'], versiculosClave: ['Habacuc 3:2'], temas: ['avivamiento', 'Espíritu Santo'], personajes: ['Espíritu Santo'], doctrina: ['pneumatología'] },
    aptoPara: ['grupo de jóvenes', 'evento juvenil'], audiencia: ['jóvenes'],
    likes: 3200, guardados: 1100, compartidos: 780, creadoPor: 'sistema', fechaCreacion: '2024-03-05', revisadoPorIA: true,
  },
  {
    id: 'm7', url: 'https://open.spotify.com/track/ejemplo11', plataforma: 'spotify',
    titulo: 'Renuévame', artista: 'Marcos Witt', descripcion: 'Balada de entrega y renovación espiritual',
    duracion: '4:32', thumbnail: '',
    clasificacion: { tipo: 'musica', categoria: 'adoracion', generoMusical: 'balada_cristiana', esCongreacional: true, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'altar', energia: 'baja', nivel: 'basico' },
    evaluacion: { cristocentrico: 90, fidelidadBiblica: 85, profundidad: 78, edificante: 93, doctrinaSana: 88, puntuacionTotal: 87, aprobado: true, notas: 'Balada de consagración. Letra de entrega genuina.' },
    contenidoBiblico: { pasajes: ['Salmo 51:10-12', 'Romanos 12:1-2'], versiculosClave: ['Salmo 51:10'], temas: ['renovación', 'arrepentimiento', 'consagración'], personajes: ['David'], doctrina: ['santificación'] },
    aptoPara: ['altar', 'momento de oración', 'devocional personal'], audiencia: ['todo público'],
    likes: 2890, guardados: 1340, compartidos: 670, creadoPor: 'sistema', fechaCreacion: '2024-03-12', revisadoPorIA: true,
  },
  {
    id: 'm8', url: 'https://www.youtube.com/watch?v=ejemplo12', plataforma: 'youtube',
    titulo: 'Tu Fidelidad', artista: 'Marcos Witt', descripcion: 'Grande es tu fidelidad, oh Dios',
    duracion: '5:01', thumbnail: '',
    clasificacion: { tipo: 'musica', categoria: 'adoracion', generoMusical: 'worship', esCongreacional: true, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'adoracion_profunda', energia: 'media', nivel: 'basico' },
    evaluacion: { cristocentrico: 88, fidelidadBiblica: 95, profundidad: 82, edificante: 94, doctrinaSana: 93, puntuacionTotal: 90, aprobado: true, notas: 'Basada en Lamentaciones 3:22-23. Doctrina sólida sobre la fidelidad de Dios.' },
    contenidoBiblico: { pasajes: ['Lamentaciones 3:22-23'], versiculosClave: ['Lamentaciones 3:23'], temas: ['fidelidad de Dios', 'misericordia', 'confianza'], personajes: ['Jeremías'], doctrina: ['teología propia'] },
    aptoPara: ['culto dominical', 'devocional personal'], audiencia: ['todo público'],
    likes: 3450, guardados: 1580, compartidos: 890, creadoPor: 'sistema', fechaCreacion: '2024-03-18', revisadoPorIA: true,
  },
];

// ===== ENSEÑANZAS (Predicaciones + Podcasts) =====

export const ensenanzas: Contenido[] = [
  {
    id: 'e1', url: 'https://www.youtube.com/watch?v=ejemplo5', plataforma: 'youtube',
    titulo: 'El Amor Incondicional de Dios - Juan 3:16', artista: 'Pastor Juan Castellanos', descripcion: 'Predicación evangelística sobre el versículo más conocido de la Biblia.',
    duracion: '38:00', thumbnail: '',
    clasificacion: { tipo: 'predicacion', categoria: 'evangelistico', generoMusical: null, esCongreacional: false, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'predica', energia: 'alta', nivel: 'basico' },
    evaluacion: { cristocentrico: 98, fidelidadBiblica: 92, profundidad: 85, edificante: 95, doctrinaSana: 93, puntuacionTotal: 93, aprobado: true, notas: 'Predicación evangelística poderosa centrada en Juan 3:16.' },
    contenidoBiblico: { pasajes: ['Juan 3:16-17', 'Romanos 5:8', 'Romanos 8:38-39'], versiculosClave: ['Juan 3:16'], temas: ['amor de Dios', 'salvación', 'evangelio', 'vida eterna'], personajes: ['Jesús', 'Nicodemo'], doctrina: ['soteriología'] },
    aptoPara: ['culto dominical', 'evangelismo', 'grupo pequeño'], audiencia: ['nuevos creyentes', 'no creyentes', 'todo público'],
    likes: 5670, guardados: 2340, compartidos: 1450, creadoPor: 'sistema', fechaCreacion: '2024-02-15', revisadoPorIA: true,
  },
  {
    id: 'e2', url: 'https://www.youtube.com/watch?v=ejemplo13', plataforma: 'youtube',
    titulo: 'La Fe que Mueve Montañas', artista: 'Pastor Andrés Corson', descripcion: 'Predicación sobre la fe genuina basada en Hebreos 11.',
    duracion: '42:00', thumbnail: '',
    clasificacion: { tipo: 'predicacion', categoria: 'motivacional', generoMusical: null, esCongreacional: false, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'predica', energia: 'alta', nivel: 'intermedio' },
    evaluacion: { cristocentrico: 90, fidelidadBiblica: 93, profundidad: 88, edificante: 95, doctrinaSana: 91, puntuacionTotal: 91, aprobado: true, notas: 'Excelente predicación sobre la fe. Fiel al contexto de Hebreos 11.' },
    contenidoBiblico: { pasajes: ['Hebreos 11:1-40', 'Mateo 17:20'], versiculosClave: ['Hebreos 11:1', 'Hebreos 11:6'], temas: ['fe', 'confianza en Dios', 'perseverancia', 'héroes de la fe'], personajes: ['Abraham', 'Moisés', 'Sara', 'Rahab'], doctrina: ['soteriología', 'santificación'] },
    aptoPara: ['culto dominical', 'grupo pequeño', 'retiro'], audiencia: ['todo público'],
    likes: 4320, guardados: 1980, compartidos: 1120, creadoPor: 'sistema', fechaCreacion: '2024-03-01', revisadoPorIA: true,
  },
  {
    id: 'e3', url: 'https://www.youtube.com/watch?v=ejemplo14', plataforma: 'youtube',
    titulo: 'El Poder de la Oración', artista: 'Apóstol Guillermo Maldonado', descripcion: 'Enseñanza sobre los diferentes tipos de oración y su poder transformador.',
    duracion: '35:00', thumbnail: '',
    clasificacion: { tipo: 'predicacion', categoria: 'doctrina', generoMusical: null, esCongreacional: false, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'predica', energia: 'media', nivel: 'intermedio' },
    evaluacion: { cristocentrico: 85, fidelidadBiblica: 82, profundidad: 80, edificante: 88, doctrinaSana: 78, puntuacionTotal: 83, aprobado: true, notas: 'Enseñanza práctica sobre oración. Algunos puntos podrían profundizarse bíblicamente.' },
    contenidoBiblico: { pasajes: ['Mateo 6:5-15', 'Santiago 5:16', '1 Tesalonicenses 5:17'], versiculosClave: ['Santiago 5:16', 'Filipenses 4:6'], temas: ['oración', 'intercesión', 'vida devocional'], personajes: ['Jesús', 'Elías'], doctrina: ['oración'] },
    aptoPara: ['culto dominical', 'grupo pequeño', 'retiro de oración'], audiencia: ['todo público'],
    likes: 3890, guardados: 1670, compartidos: 980, creadoPor: 'sistema', fechaCreacion: '2024-03-08', revisadoPorIA: true,
  },
  {
    id: 'e4', url: 'https://www.youtube.com/watch?v=ejemplo10', plataforma: 'youtube',
    titulo: 'Reflexión Matutina: La Paz de Dios', artista: 'Pastora María López', descripcion: 'Devocional sobre Filipenses 4:6-7.',
    duracion: '12:00', thumbnail: '',
    clasificacion: { tipo: 'podcast', categoria: 'devocional', generoMusical: null, esCongreacional: false, tieneMensaje: true, esInstrumental: false, momentoDelCulto: null, energia: 'baja', nivel: 'basico' },
    evaluacion: { cristocentrico: 88, fidelidadBiblica: 90, profundidad: 75, edificante: 95, doctrinaSana: 92, puntuacionTotal: 88, aprobado: true, notas: 'Devocional cálido y pastoral. Fiel al texto de Filipenses.' },
    contenidoBiblico: { pasajes: ['Filipenses 4:6-7', 'Mateo 6:25-34'], versiculosClave: ['Filipenses 4:6-7'], temas: ['paz', 'ansiedad', 'oración', 'confianza en Dios'], personajes: ['Pablo'], doctrina: ['soteriología práctica'] },
    aptoPara: ['devocional personal', 'inicio del día'], audiencia: ['todo público'],
    likes: 2100, guardados: 980, compartidos: 560, creadoPor: 'sistema', fechaCreacion: '2024-03-15', revisadoPorIA: true,
  },
  {
    id: 'e5', url: 'https://www.youtube.com/watch?v=ejemplo15', plataforma: 'youtube',
    titulo: 'Identidad en Cristo: Quién Dice Dios que Eres', artista: 'Dr. David Cho', descripcion: 'Predicación sobre la identidad del creyente según las Escrituras.',
    duracion: '48:00', thumbnail: '',
    clasificacion: { tipo: 'predicacion', categoria: 'doctrina', generoMusical: null, esCongreacional: false, tieneMensaje: true, esInstrumental: false, momentoDelCulto: 'predica', energia: 'media', nivel: 'intermedio' },
    evaluacion: { cristocentrico: 94, fidelidadBiblica: 91, profundidad: 90, edificante: 96, doctrinaSana: 92, puntuacionTotal: 93, aprobado: true, notas: 'Excelente enseñanza sobre identidad en Cristo. Sólidamente bíblica.' },
    contenidoBiblico: { pasajes: ['Efesios 1:3-14', '2 Corintios 5:17', 'Gálatas 2:20'], versiculosClave: ['2 Corintios 5:17', 'Efesios 1:4-5'], temas: ['identidad en Cristo', 'nueva creación', 'adopción', 'propósito'], personajes: ['Pablo'], doctrina: ['soteriología', 'cristología'] },
    aptoPara: ['culto dominical', 'grupo pequeño', 'consejería'], audiencia: ['todo público', 'nuevos creyentes'],
    likes: 6120, guardados: 3450, compartidos: 1890, creadoPor: 'sistema', fechaCreacion: '2024-03-20', revisadoPorIA: true,
  },
  {
    id: 'e6', url: 'https://www.youtube.com/watch?v=ejemplo16', plataforma: 'youtube',
    titulo: 'Cómo Leer la Biblia: Guía para Principiantes', artista: 'Pastor José Martínez', descripcion: 'Guía práctica para comenzar a leer y entender la Biblia.',
    duracion: '25:00', thumbnail: '',
    clasificacion: { tipo: 'podcast', categoria: 'devocional', generoMusical: null, esCongreacional: false, tieneMensaje: true, esInstrumental: false, momentoDelCulto: null, energia: 'media', nivel: 'basico' },
    evaluacion: { cristocentrico: 86, fidelidadBiblica: 94, profundidad: 80, edificante: 92, doctrinaSana: 95, puntuacionTotal: 89, aprobado: true, notas: 'Guía excelente para nuevos creyentes. Hermenéutica básica bien explicada.' },
    contenidoBiblico: { pasajes: ['2 Timoteo 3:16-17', 'Salmo 119:105'], versiculosClave: ['2 Timoteo 3:16'], temas: ['estudio bíblico', 'hermenéutica', 'lectura bíblica'], personajes: ['Timoteo', 'Pablo'], doctrina: ['bibliología'] },
    aptoPara: ['discipulado', 'nuevos creyentes', 'grupo pequeño'], audiencia: ['nuevos creyentes', 'todo público'],
    likes: 3560, guardados: 2100, compartidos: 1340, creadoPor: 'sistema', fechaCreacion: '2024-03-22', revisadoPorIA: true,
  },
];

// ===== ESTUDIOS BÍBLICOS =====

export const estudios: Contenido[] = [
  {
    id: 's1', url: 'https://www.youtube.com/watch?v=ejemplo3', plataforma: 'youtube',
    titulo: 'Juan 3: El Nuevo Nacimiento - Estudio Expositivo', artista: 'Pastor Andrés Corson', descripcion: 'Estudio verso por verso de Juan 3. La conversación de Jesús con Nicodemo.',
    duracion: '45:00', thumbnail: '',
    clasificacion: { tipo: 'estudio_biblico', categoria: 'doctrina', generoMusical: null, esCongreacional: false, tieneMensaje: true, esInstrumental: false, momentoDelCulto: null, energia: 'media', nivel: 'intermedio' },
    evaluacion: { cristocentrico: 97, fidelidadBiblica: 95, profundidad: 92, edificante: 90, doctrinaSana: 96, puntuacionTotal: 94, aprobado: true, notas: 'Estudio expositivo excelente. Fiel al contexto de Juan 3.' },
    contenidoBiblico: { pasajes: ['Juan 3:1-21'], versiculosClave: ['Juan 3:3', 'Juan 3:16', 'Juan 3:5-6'], temas: ['nuevo nacimiento', 'regeneración', 'salvación', 'fe', 'vida eterna'], personajes: ['Jesús', 'Nicodemo'], doctrina: ['soteriología', 'regeneración'] },
    aptoPara: ['grupo pequeño', 'estudio bíblico', 'preparación de sermón'], audiencia: ['líderes', 'todo público'],
    likes: 3450, guardados: 1560, compartidos: 890, creadoPor: 'sistema', fechaCreacion: '2024-02-01', revisadoPorIA: true,
  },
  {
    id: 's2', url: 'https://www.youtube.com/watch?v=ejemplo9', plataforma: 'youtube',
    titulo: 'Romanos 8: Más que Vencedores', artista: 'Dr. David Cho', descripcion: 'Estudio profundo de Romanos 8. No hay condenación para los que están en Cristo.',
    duracion: '52:00', thumbnail: '',
    clasificacion: { tipo: 'estudio_biblico', categoria: 'doctrina', generoMusical: null, esCongreacional: false, tieneMensaje: true, esInstrumental: false, momentoDelCulto: null, energia: 'media', nivel: 'avanzado' },
    evaluacion: { cristocentrico: 96, fidelidadBiblica: 97, profundidad: 95, edificante: 93, doctrinaSana: 95, puntuacionTotal: 95, aprobado: true, notas: 'Estudio expositivo de alto nivel. Excelente fidelidad al texto.' },
    contenidoBiblico: { pasajes: ['Romanos 8:1-39'], versiculosClave: ['Romanos 8:1', 'Romanos 8:28', 'Romanos 8:37-39'], temas: ['justificación', 'vida en el Espíritu', 'victoria', 'amor de Dios'], personajes: ['Jesús', 'Espíritu Santo'], doctrina: ['soteriología', 'pneumatología'] },
    aptoPara: ['estudio bíblico', 'seminario', 'preparación de sermón'], audiencia: ['líderes', 'pastores', 'estudiantes de teología'],
    likes: 4500, guardados: 2800, compartidos: 1200, creadoPor: 'sistema', fechaCreacion: '2024-03-10', revisadoPorIA: true,
  },
  {
    id: 's3', url: 'https://www.youtube.com/watch?v=ejemplo17', plataforma: 'youtube',
    titulo: 'Salmo 23: El Buen Pastor', artista: 'Dra. Ana Torres', descripcion: 'Estudio detallado del Salmo 23, verso por verso con contexto histórico.',
    duracion: '40:00', thumbnail: '',
    clasificacion: { tipo: 'estudio_biblico', categoria: 'devocional', generoMusical: null, esCongreacional: false, tieneMensaje: true, esInstrumental: false, momentoDelCulto: null, energia: 'baja', nivel: 'basico' },
    evaluacion: { cristocentrico: 92, fidelidadBiblica: 96, profundidad: 88, edificante: 97, doctrinaSana: 95, puntuacionTotal: 94, aprobado: true, notas: 'Estudio hermoso del Salmo 23. Conecta con Cristo como el Buen Pastor.' },
    contenidoBiblico: { pasajes: ['Salmo 23:1-6', 'Juan 10:11-14'], versiculosClave: ['Salmo 23:1', 'Salmo 23:4', 'Juan 10:11'], temas: ['protección divina', 'provisión', 'confianza', 'el buen pastor'], personajes: ['David', 'Jesús'], doctrina: ['cristología', 'providencia'] },
    aptoPara: ['devocional personal', 'grupo pequeño', 'consejería'], audiencia: ['todo público'],
    likes: 5200, guardados: 3100, compartidos: 1780, creadoPor: 'sistema', fechaCreacion: '2024-03-25', revisadoPorIA: true,
  },
  {
    id: 's4', url: 'https://www.youtube.com/watch?v=ejemplo18', plataforma: 'youtube',
    titulo: 'Gálatas: Libertad en Cristo', artista: 'Teólogo Carlos Ramírez', descripcion: 'Panorama completo de la carta a los Gálatas. Gracia vs legalismo.',
    duracion: '55:00', thumbnail: '',
    clasificacion: { tipo: 'estudio_biblico', categoria: 'doctrina', generoMusical: null, esCongreacional: false, tieneMensaje: true, esInstrumental: false, momentoDelCulto: null, energia: 'media', nivel: 'avanzado' },
    evaluacion: { cristocentrico: 95, fidelidadBiblica: 96, profundidad: 94, edificante: 88, doctrinaSana: 97, puntuacionTotal: 94, aprobado: true, notas: 'Estudio magistral de Gálatas. Claridad excepcional sobre gracia vs ley.' },
    contenidoBiblico: { pasajes: ['Gálatas 1-6'], versiculosClave: ['Gálatas 2:20', 'Gálatas 5:1', 'Gálatas 3:28'], temas: ['libertad en Cristo', 'gracia', 'legalismo', 'justificación por fe'], personajes: ['Pablo', 'Pedro'], doctrina: ['soteriología', 'eclesiología'] },
    aptoPara: ['seminario', 'estudio bíblico', 'preparación de sermón'], audiencia: ['líderes', 'pastores', 'estudiantes de teología'],
    likes: 3890, guardados: 2450, compartidos: 1100, creadoPor: 'sistema', fechaCreacion: '2024-04-01', revisadoPorIA: true,
  },
];

// Todos juntos para búsquedas
export const todoContenido: Contenido[] = [...musica, ...ensenanzas, ...estudios];

// ===== GUÍAS DE ESTUDIO =====

export const guiasEstudio: GuiaEstudio[] = [
  {
    id: 'juan-3', pasajePrincipal: 'Juan 3', titulo: 'Jesús y Nicodemo: El Nuevo Nacimiento',
    contexto: 'Juan 3 relata la visita nocturna de Nicodemo, un fariseo y miembro del concilio judío, a Jesús. En esta conversación, Jesús enseña sobre la necesidad de nacer de nuevo por el Espíritu Santo para entrar en el reino de Dios. El pasaje culmina con Juan 3:16, el versículo más conocido de toda la Biblia.',
    versiculosClave: ['Juan 3:3', 'Juan 3:5-6', 'Juan 3:16', 'Juan 3:17', 'Juan 3:36'],
    pasos: [
      { orden: 1, titulo: 'Adoración de apertura', descripcion: 'Comienza con adoración centrada en el amor de Dios', contenido: musica[3] },
      { orden: 2, titulo: 'Estudio del pasaje', descripcion: 'Estudio expositivo verso por verso de Juan 3', contenido: estudios[0] },
      { orden: 3, titulo: 'Predicación', descripcion: 'Predicación evangelística sobre Juan 3:16', contenido: ensenanzas[0] },
      { orden: 4, titulo: 'Adoración de respuesta', descripcion: 'Responde en adoración a lo que Dios ha hablado', contenido: musica[1] },
    ],
    temasRelacionados: ['nuevo nacimiento', 'gracia', 'salvación', 'fe', 'vida eterna', 'amor de Dios'],
    pasajesConectados: ['Romanos 6:23', 'Efesios 2:8-9', 'Tito 3:5', '1 Pedro 1:3', 'Romanos 8:1'],
  },
  {
    id: 'romanos-8', pasajePrincipal: 'Romanos 8', titulo: 'Vida en el Espíritu: Más que Vencedores',
    contexto: 'Romanos 8 es considerado uno de los capítulos más importantes de toda la Biblia. Pablo explica que no hay condenación para los que están en Cristo, describe la vida guiada por el Espíritu Santo, y concluye con una de las declaraciones más poderosas sobre el amor inseparable de Dios.',
    versiculosClave: ['Romanos 8:1', 'Romanos 8:28', 'Romanos 8:31', 'Romanos 8:37-39'],
    pasos: [
      { orden: 1, titulo: 'Invocación al Espíritu', descripcion: 'Adoración invocando al Espíritu Santo', contenido: musica[2] },
      { orden: 2, titulo: 'Estudio del pasaje', descripcion: 'Estudio profundo de Romanos 8', contenido: estudios[1] },
      { orden: 3, titulo: 'Adoración de victoria', descripcion: 'Adoración centrada en la victoria en Cristo', contenido: musica[0] },
    ],
    temasRelacionados: ['justificación', 'Espíritu Santo', 'victoria', 'amor de Dios', 'predestinación'],
    pasajesConectados: ['Romanos 5:1-5', 'Gálatas 5:16-25', 'Efesios 1:3-14', 'Juan 16:7-15'],
  },
  {
    id: 'salmo-23', pasajePrincipal: 'Salmo 23', titulo: 'El Señor es Mi Pastor: Protección y Provisión',
    contexto: 'El Salmo 23 es quizás el salmo más amado de toda la Biblia. David, quien fue pastor antes de ser rey, usa la metáfora del pastor y sus ovejas para describir la relación íntima entre Dios y su pueblo. Cada verso revela un aspecto diferente del cuidado de Dios.',
    versiculosClave: ['Salmo 23:1', 'Salmo 23:4', 'Salmo 23:6'],
    pasos: [
      { orden: 1, titulo: 'Adoración de confianza', descripcion: 'Canción sobre la fidelidad de Dios', contenido: musica[7] },
      { orden: 2, titulo: 'Estudio del Salmo', descripcion: 'Estudio verso por verso del Salmo 23', contenido: estudios[2] },
      { orden: 3, titulo: 'Renovación', descripcion: 'Momento de entrega y consagración', contenido: musica[6] },
    ],
    temasRelacionados: ['protección', 'provisión', 'confianza', 'el buen pastor', 'paz'],
    pasajesConectados: ['Juan 10:11-14', 'Isaías 40:11', 'Ezequiel 34:11-16', '1 Pedro 5:7'],
  },
];

// ===== COMUNIDADES =====

export const comunidadesEjemplo: Comunidad[] = [
  { id: '1', nombre: 'Iglesia Central Medellín', descripcion: 'Comunidad principal de adoración y enseñanza', imagen: '⛪', miembros: 1240, online: 342, tipo: 'iglesia' },
  { id: '2', nombre: 'Grupo Jóvenes Fe', descripcion: 'Jóvenes apasionados por Cristo', imagen: '🔥', miembros: 380, online: 89, tipo: 'jovenes' },
  { id: '3', nombre: 'Banda de Adoración', descripcion: 'Músicos y adoradores unidos', imagen: '🎸', miembros: 45, online: 23, tipo: 'banda' },
  { id: '4', nombre: 'Oración 24/7', descripcion: 'Intercesión continua por las naciones', imagen: '🙏', miembros: 892, online: 156, tipo: 'oracion' },
  { id: '5', nombre: 'Estudio Romanos', descripcion: 'Estudio semanal del libro de Romanos', imagen: '📖', miembros: 67, online: 12, tipo: 'grupo_estudio' },
  { id: '6', nombre: 'Matrimonios Bendecidos', descripcion: 'Familias creciendo en la fe', imagen: '💑', miembros: 234, online: 45, tipo: 'iglesia' },
];

// ===== TEMAS Y NAVEGACIÓN =====

export const temasPopulares = [
  'Gracia', 'Salvación', 'Espíritu Santo', 'Fe', 'Oración',
  'Amor de Dios', 'Sanidad', 'Perdón', 'Esperanza', 'Adoración',
];

export const librosBiblia = [
  'Génesis', 'Éxodo', 'Salmos', 'Proverbios', 'Isaías',
  'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos',
  'Romanos', '1 Corintios', 'Gálatas', 'Efesios', 'Filipenses',
  'Hebreos', 'Santiago', '1 Pedro', '1 Juan', 'Apocalipsis',
];

export const necesidades = [
  { label: 'Estoy pasando por pruebas', icon: '🌊', temas: ['perseverancia', 'fe', 'esperanza'] },
  { label: 'Quiero conocer más a Dios', icon: '🔥', temas: ['adoración', 'oración', 'Espíritu Santo'] },
  { label: 'Necesito ánimo', icon: '💪', temas: ['esperanza', 'paz', 'amor de Dios'] },
  { label: 'Quiero entender la Biblia', icon: '📖', temas: ['estudio bíblico', 'doctrina'] },
  { label: 'Preparar estudio para mi grupo', icon: '👥', temas: ['estudio bíblico', 'doctrina'] },
  { label: 'Busco música para el culto', icon: '🎵', temas: ['adoración', 'alabanza'] },
];
