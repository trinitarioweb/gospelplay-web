'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Menu, Flame, BookOpen, Heart, Users, Music, Mic, Bot, TrendingUp, ChevronRight, Radio, Sparkles, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MiniPlayer from '@/components/MiniPlayer';
import ContentCard from '@/components/ContentCard';
import GuiaEstudioCard from '@/components/GuiaEstudioCard';
import AddContentModal from '@/components/AddContentModal';
import { obtenerMusica, obtenerEnsenanzas, obtenerEstudios, obtenerTodoContenido, obtenerGuias, obtenerComunidades, obtenerBotLog, obtenerEstadisticas, buscarContenido as buscarEnDB } from '@/lib/database';
import { temasPopulares, librosBiblia, necesidades } from '@/lib/datos-ejemplo';
import type { Contenido, GuiaEstudio, Comunidad, FiltrosBusqueda } from '@/types/content';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Contenido | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGuia, setExpandedGuia] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosBusqueda>({});
  const [seccionMusica, setSeccionMusica] = useState<'todo' | 'congregacional' | 'worship' | 'himnos' | 'urbano'>('todo');

  // Datos de Supabase
  const [musica, setMusica] = useState<Contenido[]>([]);
  const [ensenanzas, setEnsenanzas] = useState<Contenido[]>([]);
  const [estudiosData, setEstudiosData] = useState<Contenido[]>([]);
  const [todoContenido, setTodoContenido] = useState<Contenido[]>([]);
  const [guiasEstudio, setGuiasEstudio] = useState<GuiaEstudio[]>([]);
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [botLog, setBotLog] = useState<any[]>([]);
  const [stats, setStats] = useState({ contenidoAnalizado: 0, contenidoAprobado: 0, contenidoRechazado: 0, guiasGeneradas: 0 });
  const [cargando, setCargando] = useState(true);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Contenido[]>([]);

  // Cargar datos
  async function cargarDatos() {
    setCargando(true);
    const [m, e, s, t, g, c, b, st] = await Promise.all([
      obtenerMusica(),
      obtenerEnsenanzas(),
      obtenerEstudios(),
      obtenerTodoContenido(),
      obtenerGuias(),
      obtenerComunidades(),
      obtenerBotLog(),
      obtenerEstadisticas(),
    ]);
    setMusica(m);
    setEnsenanzas(e);
    setEstudiosData(s);
    setTodoContenido(t);
    setGuiasEstudio(g);
    setComunidades(c);
    setBotLog(b);
    setStats(st);
    setCargando(false);
  }

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buscar cuando cambia el query
  useEffect(() => {
    if (!searchQuery.trim()) { setResultadosBusqueda([]); return; }
    const timer = setTimeout(async () => {
      const res = await buscarEnDB(searchQuery, {
        tipo: filtros.tipo,
        congregacional: filtros.esCongreacional,
      });
      setResultadosBusqueda(res);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filtros.tipo, filtros.esCongreacional]);

  const playTrack = (track: Contenido) => { setCurrentTrack(track); setIsPlaying(true); };
  const toggleLike = (id: string) => {
    const n = new Set(likedSongs);
    n.has(id) ? n.delete(id) : n.add(id);
    setLikedSongs(n);
  };

  // Filtrar música por sub-sección
  const musicaFiltrada = () => {
    if (seccionMusica === 'todo') return musica;
    if (seccionMusica === 'congregacional') return musica.filter(m => m.clasificacion.esCongreacional);
    if (seccionMusica === 'worship') return musica.filter(m => m.clasificacion.generoMusical === 'worship');
    if (seccionMusica === 'himnos') return musica.filter(m => m.clasificacion.generoMusical === 'himnos_clasicos');
    if (seccionMusica === 'urbano') return musica.filter(m => ['reggaeton_cristiano', 'hip_hop_cristiano'].includes(m.clasificacion.generoMusical || ''));
    return musica;
  };

  const buscarGuias = () => {
    if (!searchQuery.trim()) return guiasEstudio;
    const q = searchQuery.toLowerCase();
    return guiasEstudio.filter(g =>
      g.pasajePrincipal.toLowerCase().includes(q) || g.titulo.toLowerCase().includes(q) ||
      g.temasRelacionados.some(t => t.toLowerCase().includes(q))
    );
  };

  if (cargando) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-orange-500" size={48} />
          <p className="font-bold text-lg">Cargando GospelPlay...</p>
          <p className="text-sm text-orange-300/60 mt-2">Conectando con la base de datos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 bg-black/80 backdrop-blur-md z-30 p-4 flex items-center gap-3 border-b border-orange-500/20">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/10 rounded-lg">
            <Menu size={24} />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300/50" size={18} />
            <input
              type="text" placeholder="Busca por pasaje, tema, artista, género..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (activeTab !== 'buscar') setActiveTab('buscar'); }}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-orange-500/20 rounded-lg text-white text-sm placeholder-orange-300/40 focus:outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-500/20 transition"
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="p-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition flex items-center gap-2 text-sm font-bold">
            <Plus size={18} /><span className="hidden sm:inline">Agregar</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">

          {/* ===== HOME ===== */}
          {activeTab === 'home' && (
            <>
              {/* Hero */}
              <div className="p-6 bg-gradient-to-r from-orange-500/20 via-orange-600/10 to-transparent m-4 rounded-2xl border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-orange-400" size={18} />
                  <p className="text-orange-300 font-bold text-xs uppercase tracking-wider">Curado por IA Teológica</p>
                </div>
                <h2 className="text-3xl md:text-4xl font-black leading-tight">
                  Contenido cristiano<br />
                  <span className="text-gradient">clasificado y verificado</span>
                </h2>
                <p className="text-orange-100/70 text-sm mt-3 max-w-lg">
                  Solo contenido cristocéntrico, bíblicamente fiel. Música, predicaciones y estudios evaluados automáticamente.
                </p>
                <div className="flex items-center gap-4 mt-4 text-xs text-orange-300/60">
                  <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-400" /> {stats.contenidoAprobado} aprobados</span>
                  <span className="flex items-center gap-1"><AlertTriangle size={14} className="text-red-400" /> {stats.contenidoRechazado} rechazados</span>
                  <span className="flex items-center gap-1"><BookOpen size={14} /> {stats.guiasGeneradas} guías</span>
                </div>
              </div>

              {/* ====== SECCIÓN: MÚSICA ====== */}
              <section className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black flex items-center gap-2">
                    <Music className="text-orange-500" size={28} />
                    Música
                  </h3>
                  <button onClick={() => setActiveTab('buscar')} className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1">
                    Ver todo <ChevronRight size={14} />
                  </button>
                </div>

                {/* Sub-filtros de música */}
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                  {([
                    { id: 'todo', label: 'Todas' },
                    { id: 'congregacional', label: '🏛️ Congregacional' },
                    { id: 'worship', label: '🙌 Worship' },
                    { id: 'himnos', label: '📜 Himnos' },
                    { id: 'urbano', label: '🔥 Urbano' },
                  ] as const).map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSeccionMusica(f.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                        seccionMusica === f.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/5 border border-orange-500/20 text-orange-300/70 hover:bg-white/10'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {musicaFiltrada().map(item => (
                    <div key={item.id} className="flex-shrink-0 w-72">
                      <ContentCard contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} />
                    </div>
                  ))}
                </div>
                {musicaFiltrada().length === 0 && (
                  <p className="text-center py-6 text-orange-300/40 text-sm">No hay música en esta categoría aún</p>
                )}
              </section>

              {/* ====== SECCIÓN: ENSEÑANZAS ====== */}
              <section className="px-6 py-4 border-t border-orange-500/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black flex items-center gap-2">
                    <Mic className="text-orange-500" size={28} />
                    Enseñanzas y Predicaciones
                  </h3>
                </div>

                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {ensenanzas.map(item => (
                    <div key={item.id} className="flex-shrink-0 w-80">
                      <ContentCard contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} compact />
                    </div>
                  ))}
                </div>
              </section>

              {/* ====== SECCIÓN: ESTUDIOS BÍBLICOS ====== */}
              <section className="px-6 py-4 border-t border-orange-500/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black flex items-center gap-2">
                    <BookOpen className="text-orange-500" size={28} />
                    Estudios Bíblicos
                  </h3>
                  <button onClick={() => setActiveTab('estudios')} className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1">
                    Ver todo <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  {guiasEstudio.slice(0, 3).map(guia => (
                    <GuiaEstudioCard key={guia.id} guia={guia} onPlay={playTrack} expanded={expandedGuia === guia.id} onToggle={() => setExpandedGuia(expandedGuia === guia.id ? null : guia.id)} />
                  ))}
                </div>
              </section>

              {/* ====== SECCIÓN: EXPLORA POR TEMA ====== */}
              <section className="px-6 py-4 border-t border-orange-500/10">
                <h3 className="text-xl font-black mb-3">Explora por Tema</h3>
                <div className="flex flex-wrap gap-2">
                  {temasPopulares.map((tema, i) => (
                    <button key={i} onClick={() => { setSearchQuery(tema); setActiveTab('buscar'); }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-full text-sm font-bold text-orange-300 hover:bg-orange-500/30 transition">
                      {tema}
                    </button>
                  ))}
                </div>
              </section>

              {/* ====== SECCIÓN: COMUNIDADES ====== */}
              <section className="px-6 py-4 border-t border-orange-500/10">
                <h3 className="text-xl font-black mb-3 flex items-center gap-2">
                  <Users className="text-orange-500" size={24} /> Comunidades
                </h3>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {comunidades.map(com => (
                    <div key={com.id} className="flex-shrink-0 w-52 p-4 bg-white/5 border border-orange-500/20 rounded-xl hover:border-orange-400/50 transition">
                      <div className="text-3xl mb-2">{com.imagen}</div>
                      <p className="font-bold text-sm">{com.nombre}</p>
                      <p className="text-xs text-orange-300/60 mt-1">{com.miembros} miembros</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>{com.online} online
                      </div>
                      <button className="mt-3 w-full py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-bold text-xs transition">Unirse</button>
                    </div>
                  ))}
                </div>
              </section>

              {/* ====== ACTIVIDAD DEL BOT ====== */}
              <section className="px-6 py-4 border-t border-orange-500/10">
                <h3 className="text-xl font-black mb-3 flex items-center gap-2">
                  <Bot className="text-orange-500" size={24} /> Auto-Curación IA
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">ACTIVO</span>
                </h3>
                <div className="bg-white/5 border border-orange-500/20 rounded-xl p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-black text-orange-400">{stats.contenidoAnalizado}</p>
                      <p className="text-xs text-orange-300/60">Analizados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-green-400">{stats.contenidoAprobado}</p>
                      <p className="text-xs text-orange-300/60">Aprobados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-red-400">{stats.contenidoRechazado}</p>
                      <p className="text-xs text-orange-300/60">Rechazados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-blue-400">{stats.guiasGeneradas}</p>
                      <p className="text-xs text-orange-300/60">Guías creadas</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {botLog.slice(0, 3).map(tarea => (
                      <div key={tarea.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg text-xs">
                        {tarea.estado === 'completado' && <CheckCircle size={14} className="text-green-400 flex-shrink-0" />}
                        {tarea.estado === 'procesando' && <Loader2 size={14} className="text-orange-400 animate-spin flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-gray-300">{tarea.descripcion}</p>
                          {tarea.resultado && <p className="text-orange-300/60 truncate">{tarea.resultado}</p>}
                        </div>
                        <span className="text-orange-300/40 flex-shrink-0">
                          {tarea.estado === 'procesando' ? 'ahora' : 'hace poco'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-orange-500/10">
                    <p className="text-xs text-orange-300/50">
                      <span className="font-bold text-orange-400">Tendencias detectadas:</span> gracia, salvación, Espíritu Santo, identidad en Cristo, oración
                    </p>
                    <p className="text-xs text-orange-300/50 mt-1">
                      <span className="font-bold text-red-400">Vacíos de contenido:</span> Apocalipsis, profetas menores, matrimonio cristiano
                    </p>
                  </div>
                </div>
              </section>

              <div className="h-32"></div>
            </>
          )}

          {/* ===== BUSCAR ===== */}
          {activeTab === 'buscar' && (
            <div className="p-6 max-w-5xl mx-auto">
              <h2 className="text-3xl font-black mb-1">Buscar</h2>
              <p className="text-sm text-orange-300/60 mb-6">Por pasaje bíblico, tema, artista o género musical</p>

              {/* Filtros */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: 'Todo', value: undefined },
                  { label: '🎵 Música', value: 'musica' },
                  { label: '🎤 Predicaciones', value: 'predicacion' },
                  { label: '📖 Estudios', value: 'estudio_biblico' },
                  { label: '🎙️ Podcasts', value: 'podcast' },
                ].map((f, i) => (
                  <button key={i} onClick={() => setFiltros({ ...filtros, tipo: f.value as FiltrosBusqueda['tipo'] })}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition ${filtros.tipo === f.value ? 'bg-orange-500 text-white' : 'bg-white/5 border border-orange-500/20 text-orange-300 hover:bg-white/10'}`}>
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                <button onClick={() => setFiltros({ ...filtros, esCongreacional: filtros.esCongreacional ? undefined : true })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filtros.esCongreacional ? 'bg-purple-500/30 border border-purple-400/50 text-purple-300' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}>
                  🏛️ Solo congregacionales
                </button>
              </div>

              {searchQuery ? (
                <>
                  {buscarGuias().length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold text-lg mb-3 text-orange-400">📖 Guías de Estudio</h3>
                      {buscarGuias().map(guia => (
                        <GuiaEstudioCard key={guia.id} guia={guia} onPlay={playTrack} expanded={expandedGuia === guia.id} onToggle={() => setExpandedGuia(expandedGuia === guia.id ? null : guia.id)} />
                      ))}
                    </div>
                  )}

                  <h3 className="font-bold text-lg mb-3 text-orange-400">🎯 Contenido ({resultadosBusqueda.length})</h3>
                  <div className="space-y-3">
                    {resultadosBusqueda.map(item => (
                      <ContentCard key={item.id} contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} compact />
                    ))}
                  </div>
                  {resultadosBusqueda.length === 0 && <p className="text-center py-8 text-orange-300/50">No se encontró contenido para &quot;{searchQuery}&quot;</p>}
                </>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="font-bold text-lg mb-3">🎯 ¿Qué necesitas?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {necesidades.map((n, i) => (
                        <button key={i} onClick={() => setSearchQuery(n.temas[0])}
                          className="p-4 bg-white/5 border border-orange-500/20 rounded-xl hover:bg-white/10 transition text-left flex items-start gap-3">
                          <span className="text-2xl">{n.icon}</span>
                          <div>
                            <p className="font-bold text-sm">{n.label}</p>
                            <div className="flex gap-1 mt-2">
                              {n.temas.map((t, j) => (
                                <span key={j} className="text-xs px-2 py-0.5 bg-orange-500/20 rounded text-orange-300">{t}</span>
                              ))}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-3">📖 Por Libro de la Biblia</h3>
                    <div className="flex flex-wrap gap-2">
                      {librosBiblia.map((libro, i) => (
                        <button key={i} onClick={() => setSearchQuery(libro)}
                          className="px-3 py-2 bg-white/5 border border-orange-500/20 rounded-lg text-sm hover:bg-orange-500/20 transition">{libro}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div className="h-24"></div>
            </div>
          )}

          {/* ===== TRENDING ===== */}
          {activeTab === 'trending' && (
            <div className="p-6 max-w-5xl mx-auto">
              <h2 className="text-3xl font-black mb-1 flex items-center gap-2"><TrendingUp className="text-orange-500" /> Trending</h2>
              <p className="text-sm text-orange-300/60 mb-6">Lo más popular y mejor evaluado</p>

              <h3 className="font-bold text-lg mb-3">🎵 Música Trending</h3>
              <div className="space-y-3 mb-8">
                {musica.sort((a, b) => b.likes - a.likes).slice(0, 5).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-2xl font-black text-orange-500/40 w-8 text-right">{idx + 1}</span>
                    <div className="flex-1"><ContentCard contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} compact /></div>
                  </div>
                ))}
              </div>

              <h3 className="font-bold text-lg mb-3">🎤 Enseñanzas Trending</h3>
              <div className="space-y-3">
                {ensenanzas.sort((a, b) => b.likes - a.likes).slice(0, 5).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-2xl font-black text-orange-500/40 w-8 text-right">{idx + 1}</span>
                    <div className="flex-1"><ContentCard contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} compact /></div>
                  </div>
                ))}
              </div>
              <div className="h-24"></div>
            </div>
          )}

          {/* ===== ESTUDIOS ===== */}
          {activeTab === 'estudios' && (
            <div className="p-6 max-w-5xl mx-auto">
              <h2 className="text-3xl font-black mb-1">Estudios Bíblicos</h2>
              <p className="text-sm text-orange-300/60 mb-6">Guías de estudio generadas por IA con contenido curado</p>

              <h3 className="font-bold text-lg mb-3">📚 Guías por Porción Bíblica</h3>
              <div className="space-y-4 mb-8">
                {guiasEstudio.map(guia => (
                  <GuiaEstudioCard key={guia.id} guia={guia} onPlay={playTrack} expanded={expandedGuia === guia.id} onToggle={() => setExpandedGuia(expandedGuia === guia.id ? null : guia.id)} />
                ))}
              </div>

              <h3 className="font-bold text-lg mb-3">📖 Estudios Individuales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {estudiosData.map(item => (
                  <ContentCard key={item.id} contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} />
                ))}
              </div>
              <div className="h-24"></div>
            </div>
          )}

          {/* ===== PREDICADORES ===== */}
          {activeTab === 'predicadores' && (
            <div className="p-6 max-w-5xl mx-auto">
              <h2 className="text-3xl font-black mb-1">Predicaciones y Enseñanzas</h2>
              <p className="text-sm text-orange-300/60 mb-6">Sermones evaluados teológicamente por IA</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ensenanzas.map(item => (
                  <ContentCard key={item.id} contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} />
                ))}
              </div>
              <div className="h-24"></div>
            </div>
          )}

          {/* ===== COMUNIDADES ===== */}
          {activeTab === 'comunidades' && (
            <div className="p-6 max-w-5xl mx-auto">
              <h2 className="text-3xl font-black mb-1">Comunidades</h2>
              <p className="text-sm text-orange-300/60 mb-6">Conecta con iglesias, grupos de estudio y adoradores</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comunidades.map(com => (
                  <div key={com.id} className="p-6 bg-white/5 border border-orange-500/20 rounded-xl hover:border-orange-400/50 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-4xl mb-2">{com.imagen}</div>
                        <p className="font-black text-lg">{com.nombre}</p>
                        <p className="text-sm text-orange-300/60 mt-1">{com.descripcion}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-400 font-bold">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>{com.online} online
                      </div>
                    </div>
                    <p className="text-sm text-orange-300/70 mb-4">{com.miembros} miembros</p>
                    <button className="w-full py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-bold text-sm transition">Unirse</button>
                  </div>
                ))}
              </div>
              <div className="h-24"></div>
            </div>
          )}

          {/* ===== BIBLIOTECA ===== */}
          {activeTab === 'biblioteca' && (
            <div className="p-6 max-w-5xl mx-auto">
              <h2 className="text-3xl font-black mb-1">Mi Biblioteca</h2>
              <p className="text-sm text-orange-300/60 mb-6">Tu contenido guardado</p>
              {likedSongs.size > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-orange-400 font-bold">❤️ {likedSongs.size} guardados</p>
                  {todoContenido.filter(c => likedSongs.has(c.id)).map(item => (
                    <ContentCard key={item.id} contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={true} compact />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Heart className="mx-auto mb-4 text-orange-500/30" size={48} />
                  <p className="text-orange-300/50 text-lg">Aún no has guardado contenido</p>
                  <p className="text-orange-300/30 text-sm mt-2">Dale ❤️ a lo que te guste y aparecerá aquí</p>
                </div>
              )}
              <div className="h-24"></div>
            </div>
          )}
        </main>
      </div>

      <MiniPlayer track={currentTrack} isPlaying={isPlaying} onTogglePlay={() => setIsPlaying(!isPlaying)} onClose={() => { setCurrentTrack(null); setIsPlaying(false); }} />
      <AddContentModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onContentAdded={cargarDatos} />
      {currentTrack && <div className="h-16" />}
    </div>
  );
}
