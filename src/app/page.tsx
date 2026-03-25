'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Menu, BookOpen, Heart, Users, Music, Mic, Bot, TrendingUp, ChevronRight, Sparkles, AlertTriangle, CheckCircle, Loader2, Play, X, ListMusic, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MiniPlayer from '@/components/MiniPlayer';
import ContentCard from '@/components/ContentCard';
import GuiaEstudioCard from '@/components/GuiaEstudioCard';
import AddContentModal from '@/components/AddContentModal';
import { obtenerMusica, obtenerEnsenanzas, obtenerEstudios, obtenerTodoContenido, obtenerGuias, obtenerComunidades, obtenerBotLog, obtenerEstadisticas, buscarContenido as buscarEnDB, obtenerPlaylists, obtenerPlaylist, crearPlaylist, eliminarDePlaylist, eliminarPlaylist } from '@/lib/database';
import { temasPopulares, librosBiblia, necesidades } from '@/lib/datos-ejemplo';
import type { Contenido, GuiaEstudio, Comunidad, FiltrosBusqueda, Playlist } from '@/types/content';

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

  // Playlist state
  const [playlists, setPlaylists] = useState<(Playlist & { _itemCount?: number })[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  // Playlist playback context
  const [playlistContext, setPlaylistContext] = useState<{
    nombre: string;
    items: Contenido[];
    currentIndex: number;
  } | null>(null);

  // Cargar playlists
  const cargarPlaylists = useCallback(async () => {
    const p = await obtenerPlaylists();
    setPlaylists(p as (Playlist & { _itemCount?: number })[]);
  }, []);

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
    cargarPlaylists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar playlist activa
  useEffect(() => {
    if (!activePlaylistId) { setActivePlaylist(null); return; }
    setLoadingPlaylist(true);
    obtenerPlaylist(activePlaylistId).then(pl => {
      setActivePlaylist(pl);
      setLoadingPlaylist(false);
    });
  }, [activePlaylistId]);

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

  const playTrack = (track: Contenido) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    // If not playing from a playlist context, clear it
    if (!playlistContext || !playlistContext.items.find(i => i.id === track.id)) {
      setPlaylistContext(null);
    }
  };

  const playFromPlaylist = (playlist: Playlist, startIndex: number) => {
    const items = playlist.items.map(i => i.contenido);
    if (items.length === 0) return;
    const idx = Math.min(startIndex, items.length - 1);
    setPlaylistContext({
      nombre: playlist.nombre,
      items,
      currentIndex: idx,
    });
    setCurrentTrack(items[idx]);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (!playlistContext) return;
    const nextIdx = playlistContext.currentIndex + 1;
    if (nextIdx < playlistContext.items.length) {
      setPlaylistContext({ ...playlistContext, currentIndex: nextIdx });
      setCurrentTrack(playlistContext.items[nextIdx]);
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    if (!playlistContext) return;
    const prevIdx = playlistContext.currentIndex - 1;
    if (prevIdx >= 0) {
      setPlaylistContext({ ...playlistContext, currentIndex: prevIdx });
      setCurrentTrack(playlistContext.items[prevIdx]);
      setIsPlaying(true);
    }
  };

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

  const handleSelectPlaylist = (id: string) => {
    setActivePlaylistId(id);
    setActiveTab('playlist');
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setCreatingPlaylist(true);
    const pl = await crearPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    if (pl) {
      await cargarPlaylists();
      setShowCreatePlaylist(false);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setActivePlaylistId(pl.id);
      setActiveTab('playlist');
    }
    setCreatingPlaylist(false);
  };

  const handleRemoveFromPlaylist = async (contenidoId: string) => {
    if (!activePlaylistId) return;
    await eliminarDePlaylist(activePlaylistId, contenidoId);
    // Reload playlist
    const pl = await obtenerPlaylist(activePlaylistId);
    setActivePlaylist(pl);
    cargarPlaylists();
  };

  const handleDeletePlaylist = async () => {
    if (!activePlaylistId) return;
    await eliminarPlaylist(activePlaylistId);
    setActivePlaylistId(null);
    setActiveTab('home');
    cargarPlaylists();
  };

  // When switching tabs (non-playlist), clear playlist selection
  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'playlist') {
      setActivePlaylistId(null);
    }
  };

  if (cargando) {
    return (
      <div className="flex h-screen bg-[#121212] text-white items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-amber-500" size={48} />
          <p className="font-bold text-lg">Cargando GospelPlay...</p>
          <p className="text-sm text-[#6a6a6a] mt-2">Conectando con la base de datos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#121212] text-white overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        playlists={playlists}
        onSelectPlaylist={handleSelectPlaylist}
        onCreatePlaylist={() => setShowCreatePlaylist(true)}
        activePlaylistId={activePlaylistId}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Spotify style */}
        <header className="sticky top-0 z-30 px-4 md:px-6 py-3 flex items-center gap-3 bg-[#121212]/95 backdrop-blur-md">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/10 rounded-full text-[#b3b3b3]">
            <Menu size={22} />
          </button>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a6a]" size={18} />
            <input
              type="text"
              placeholder="Buscar por pasaje, tema, artista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (activeTab !== 'buscar') handleSetActiveTab('buscar'); }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#242424] border border-transparent rounded-full text-white text-sm placeholder-[#6a6a6a] focus:outline-none focus:border-white/20 focus:bg-[#2a2a2a] transition"
            />
          </div>

          <div className="flex-1" />

          {/* Add button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 hover:scale-105 rounded-full transition-all text-black text-sm font-bold"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">

          {/* ===== HOME ===== */}
          {activeTab === 'home' && (
            <div className="section-fade">
              {/* Hero - subtle gradient */}
              <div className="px-4 md:px-6 pt-4 pb-6" style={{ background: 'linear-gradient(180deg, rgba(180,130,40,0.15) 0%, rgba(18,18,18,1) 100%)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="text-amber-400" size={16} />
                  <p className="text-amber-400 font-semibold text-xs uppercase tracking-widest">Curado por IA</p>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-2">
                  Contenido cristiano<br />
                  <span className="text-gradient">verificado y clasificado</span>
                </h2>
                <p className="text-[#b3b3b3] text-sm max-w-lg">
                  Cristocentrico, biblicamente fiel. Musica, predicaciones y estudios evaluados automaticamente.
                </p>
                <div className="flex items-center gap-5 mt-4 text-xs text-[#6a6a6a]">
                  <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-400" /> {stats.contenidoAprobado} aprobados</span>
                  <span className="flex items-center gap-1.5"><AlertTriangle size={14} className="text-red-400" /> {stats.contenidoRechazado} rechazados</span>
                  <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-amber-400" /> {stats.guiasGeneradas} guias</span>
                </div>
              </div>

              {/* ====== SECTION: MUSICA ====== */}
              <section className="px-4 md:px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Music className="text-amber-400" size={24} />
                    Musica
                  </h3>
                  <button onClick={() => handleSetActiveTab('buscar')} className="text-xs text-[#b3b3b3] hover:text-white font-bold flex items-center gap-1 transition-colors">
                    Mostrar todo <ChevronRight size={14} />
                  </button>
                </div>

                {/* Sub-filters - pill style */}
                <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
                  {([
                    { id: 'todo', label: 'Todas' },
                    { id: 'congregacional', label: 'Congregacional' },
                    { id: 'worship', label: 'Worship' },
                    { id: 'himnos', label: 'Himnos' },
                    { id: 'urbano', label: 'Urbano' },
                  ] as const).map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSeccionMusica(f.id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        seccionMusica === f.id
                          ? 'bg-white text-black'
                          : 'bg-[#232323] text-white hover:bg-[#2a2a2a]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Horizontal scroll of cards */}
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {musicaFiltrada().map(item => (
                    <div key={item.id} className="flex-shrink-0 w-44 md:w-48">
                      <ContentCard contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} onPlaylistsChanged={cargarPlaylists} />
                    </div>
                  ))}
                </div>
                {musicaFiltrada().length === 0 && (
                  <p className="text-center py-8 text-[#6a6a6a] text-sm">No hay musica en esta categoria</p>
                )}
              </section>

              {/* ====== SECTION: ENSENANZAS ====== */}
              <section className="px-4 md:px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Mic className="text-amber-400" size={24} />
                    Predicaciones
                  </h3>
                  <button onClick={() => handleSetActiveTab('predicadores')} className="text-xs text-[#b3b3b3] hover:text-white font-bold flex items-center gap-1 transition-colors">
                    Mostrar todo <ChevronRight size={14} />
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {ensenanzas.map(item => (
                    <div key={item.id} className="flex-shrink-0 w-44 md:w-48">
                      <ContentCard contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} onPlaylistsChanged={cargarPlaylists} />
                    </div>
                  ))}
                </div>
              </section>

              {/* ====== SECTION: ESTUDIOS BIBLICOS ====== */}
              <section className="px-4 md:px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="text-amber-400" size={24} />
                    Estudios Biblicos
                  </h3>
                  <button onClick={() => handleSetActiveTab('estudios')} className="text-xs text-[#b3b3b3] hover:text-white font-bold flex items-center gap-1 transition-colors">
                    Mostrar todo <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {guiasEstudio.slice(0, 3).map(guia => (
                    <GuiaEstudioCard key={guia.id} guia={guia} onPlay={playTrack} expanded={expandedGuia === guia.id} onToggle={() => setExpandedGuia(expandedGuia === guia.id ? null : guia.id)} />
                  ))}
                </div>
              </section>

              {/* ====== SECTION: EXPLORA POR TEMA ====== */}
              <section className="px-4 md:px-6 py-6">
                <h3 className="text-lg font-bold text-white mb-3">Explora por Tema</h3>
                <div className="flex flex-wrap gap-2">
                  {temasPopulares.map((tema, i) => (
                    <button key={i} onClick={() => { setSearchQuery(tema); handleSetActiveTab('buscar'); }}
                      className="px-4 py-2 bg-[#232323] rounded-full text-sm text-[#b3b3b3] hover:text-white hover:bg-[#2a2a2a] transition-colors font-medium">
                      {tema}
                    </button>
                  ))}
                </div>
              </section>

              {/* ====== SECTION: COMUNIDADES ====== */}
              <section className="px-4 md:px-6 py-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Users className="text-amber-400" size={22} /> Comunidades
                </h3>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {comunidades.map(com => (
                    <div key={com.id} className="flex-shrink-0 w-52 bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors">
                      <div className="text-3xl mb-3">{com.imagen}</div>
                      <p className="font-bold text-sm text-white">{com.nombre}</p>
                      <p className="text-xs text-[#6a6a6a] mt-1">{com.miembros} miembros</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>{com.online} online
                      </div>
                      <button className="mt-3 w-full py-2 bg-white/10 hover:bg-white/15 rounded-full font-semibold text-xs text-white transition-colors">
                        Unirse
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* ====== SECTION: BOT ACTIVITY ====== */}
              <section className="px-4 md:px-6 py-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Bot className="text-amber-400" size={22} /> Auto-Curacion IA
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">ACTIVO</span>
                </h3>
                <div className="bg-[#181818] rounded-lg p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-extrabold text-amber-400">{stats.contenidoAnalizado}</p>
                      <p className="text-xs text-[#6a6a6a]">Analizados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-extrabold text-emerald-400">{stats.contenidoAprobado}</p>
                      <p className="text-xs text-[#6a6a6a]">Aprobados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-extrabold text-red-400">{stats.contenidoRechazado}</p>
                      <p className="text-xs text-[#6a6a6a]">Rechazados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-extrabold text-blue-400">{stats.guiasGeneradas}</p>
                      <p className="text-xs text-[#6a6a6a]">Guias creadas</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {botLog.slice(0, 3).map(tarea => (
                      <div key={tarea.id} className="flex items-center gap-3 p-2.5 rounded-md bg-white/[0.03] text-xs">
                        {tarea.estado === 'completado' && <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />}
                        {tarea.estado === 'procesando' && <Loader2 size={14} className="text-amber-400 animate-spin flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[#b3b3b3]">{tarea.descripcion}</p>
                          {tarea.resultado && <p className="text-[#6a6a6a] truncate">{tarea.resultado}</p>}
                        </div>
                        <span className="text-[#6a6a6a] flex-shrink-0">
                          {tarea.estado === 'procesando' ? 'ahora' : 'hace poco'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5">
                    <p className="text-xs text-[#6a6a6a]">
                      <span className="font-semibold text-amber-400">Tendencias:</span> gracia, salvacion, Espiritu Santo, identidad en Cristo, oracion
                    </p>
                    <p className="text-xs text-[#6a6a6a] mt-1">
                      <span className="font-semibold text-red-400">Vacios:</span> Apocalipsis, profetas menores, matrimonio cristiano
                    </p>
                  </div>
                </div>
              </section>

              <div className="h-32"></div>
            </div>
          )}

          {/* ===== BUSCAR ===== */}
          {activeTab === 'buscar' && (
            <div className="p-4 md:p-6 max-w-4xl mx-auto section-fade">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1">Buscar</h2>
              <p className="text-sm text-[#6a6a6a] mb-6">Por pasaje biblico, tema, artista o genero musical</p>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: 'Todo', value: undefined },
                  { label: 'Musica', value: 'musica' },
                  { label: 'Predicaciones', value: 'predicacion' },
                  { label: 'Estudios', value: 'estudio_biblico' },
                  { label: 'Podcasts', value: 'podcast' },
                ].map((f, i) => (
                  <button key={i} onClick={() => setFiltros({ ...filtros, tipo: f.value as FiltrosBusqueda['tipo'] })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filtros.tipo === f.value
                        ? 'bg-white text-black'
                        : 'bg-[#232323] text-white hover:bg-[#2a2a2a]'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                <button onClick={() => setFiltros({ ...filtros, esCongreacional: filtros.esCongreacional ? undefined : true })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filtros.esCongreacional
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-[#232323] text-[#b3b3b3] hover:text-white hover:bg-[#2a2a2a]'
                  }`}>
                  Solo congregacionales
                </button>
              </div>

              {searchQuery ? (
                <>
                  {buscarGuias().length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold text-base mb-3 text-white">Guias de Estudio</h3>
                      <div className="space-y-2">
                        {buscarGuias().map(guia => (
                          <GuiaEstudioCard key={guia.id} guia={guia} onPlay={playTrack} expanded={expandedGuia === guia.id} onToggle={() => setExpandedGuia(expandedGuia === guia.id ? null : guia.id)} />
                        ))}
                      </div>
                    </div>
                  )}

                  <h3 className="font-bold text-base mb-3 text-white">Contenido ({resultadosBusqueda.length})</h3>
                  <div className="bg-[#181818] rounded-lg overflow-hidden">
                    {resultadosBusqueda.map(item => (
                      <ContentCard key={item.id} contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} compact onPlaylistsChanged={cargarPlaylists} />
                    ))}
                  </div>
                  {resultadosBusqueda.length === 0 && <p className="text-center py-8 text-[#6a6a6a]">No se encontro contenido para &quot;{searchQuery}&quot;</p>}
                </>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="font-bold text-base mb-3 text-white">Que necesitas?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {necesidades.map((n, i) => (
                        <button key={i} onClick={() => setSearchQuery(n.temas[0])}
                          className="p-4 bg-[#181818] rounded-lg hover:bg-[#282828] transition-colors text-left flex items-start gap-3">
                          <span className="text-2xl">{n.icon}</span>
                          <div>
                            <p className="font-semibold text-sm text-white">{n.label}</p>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {n.temas.map((t, j) => (
                                <span key={j} className="text-xs px-2 py-0.5 bg-amber-500/15 rounded text-amber-400">{t}</span>
                              ))}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-3 text-white">Por Libro de la Biblia</h3>
                    <div className="flex flex-wrap gap-2">
                      {librosBiblia.map((libro, i) => (
                        <button key={i} onClick={() => setSearchQuery(libro)}
                          className="px-3 py-2 bg-[#232323] rounded-full text-sm text-[#b3b3b3] hover:text-white hover:bg-[#2a2a2a] transition-colors">{libro}</button>
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
            <div className="p-4 md:p-6 max-w-4xl mx-auto section-fade">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1 flex items-center gap-2"><TrendingUp className="text-amber-400" /> Trending</h2>
              <p className="text-sm text-[#6a6a6a] mb-6">Lo mas popular y mejor evaluado</p>

              <h3 className="font-bold text-base mb-3 text-white">Musica Trending</h3>
              <div className="bg-[#181818] rounded-lg overflow-hidden mb-8">
                {musica.sort((a, b) => b.likes - a.likes).slice(0, 5).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 px-2">
                    <span className="text-lg font-extrabold text-[#6a6a6a] w-6 text-right">{idx + 1}</span>
                    <div className="flex-1"><ContentCard contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} compact onPlaylistsChanged={cargarPlaylists} /></div>
                  </div>
                ))}
              </div>

              <h3 className="font-bold text-base mb-3 text-white">Ensenanzas Trending</h3>
              <div className="bg-[#181818] rounded-lg overflow-hidden">
                {ensenanzas.sort((a, b) => b.likes - a.likes).slice(0, 5).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 px-2">
                    <span className="text-lg font-extrabold text-[#6a6a6a] w-6 text-right">{idx + 1}</span>
                    <div className="flex-1"><ContentCard contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} compact onPlaylistsChanged={cargarPlaylists} /></div>
                  </div>
                ))}
              </div>
              <div className="h-24"></div>
            </div>
          )}

          {/* ===== ESTUDIOS ===== */}
          {activeTab === 'estudios' && (
            <div className="p-4 md:p-6 max-w-4xl mx-auto section-fade">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1">Estudios Biblicos</h2>
              <p className="text-sm text-[#6a6a6a] mb-6">Guias de estudio generadas por IA con contenido curado</p>

              <h3 className="font-bold text-base mb-3 text-white">Guias por Porcion Biblica</h3>
              <div className="space-y-2 mb-8">
                {guiasEstudio.map(guia => (
                  <GuiaEstudioCard key={guia.id} guia={guia} onPlay={playTrack} expanded={expandedGuia === guia.id} onToggle={() => setExpandedGuia(expandedGuia === guia.id ? null : guia.id)} />
                ))}
              </div>

              <h3 className="font-bold text-base mb-3 text-white">Estudios Individuales</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {estudiosData.map(item => (
                  <ContentCard key={item.id} contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} onPlaylistsChanged={cargarPlaylists} />
                ))}
              </div>
              <div className="h-24"></div>
            </div>
          )}

          {/* ===== PREDICADORES ===== */}
          {activeTab === 'predicadores' && (
            <div className="p-4 md:p-6 max-w-4xl mx-auto section-fade">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1">Predicaciones y Ensenanzas</h2>
              <p className="text-sm text-[#6a6a6a] mb-6">Sermones evaluados teologicamente por IA</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {ensenanzas.map(item => (
                  <ContentCard key={item.id} contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={likedSongs.has(item.id)} onPlaylistsChanged={cargarPlaylists} />
                ))}
              </div>
              <div className="h-24"></div>
            </div>
          )}

          {/* ===== COMUNIDADES ===== */}
          {activeTab === 'comunidades' && (
            <div className="p-4 md:p-6 max-w-4xl mx-auto section-fade">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1">Comunidades</h2>
              <p className="text-sm text-[#6a6a6a] mb-6">Conecta con iglesias, grupos de estudio y adoradores</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {comunidades.map(com => (
                  <div key={com.id} className="bg-[#181818] rounded-lg p-5 hover:bg-[#282828] transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-4xl mb-2">{com.imagen}</div>
                        <p className="font-bold text-base text-white">{com.nombre}</p>
                        <p className="text-sm text-[#b3b3b3] mt-1">{com.descripcion}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>{com.online} online
                      </div>
                    </div>
                    <p className="text-sm text-[#6a6a6a] mb-4">{com.miembros} miembros</p>
                    <button className="w-full py-2.5 bg-white/10 hover:bg-white/15 rounded-full font-semibold text-sm text-white transition-colors">
                      Unirse
                    </button>
                  </div>
                ))}
              </div>
              <div className="h-24"></div>
            </div>
          )}

          {/* ===== BIBLIOTECA ===== */}
          {activeTab === 'biblioteca' && (
            <div className="p-4 md:p-6 max-w-4xl mx-auto section-fade">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1">Mi Biblioteca</h2>
              <p className="text-sm text-[#6a6a6a] mb-6">Tu contenido guardado</p>
              {likedSongs.size > 0 ? (
                <>
                  <p className="text-sm text-amber-400 font-semibold mb-3">{likedSongs.size} guardados</p>
                  <div className="bg-[#181818] rounded-lg overflow-hidden">
                    {todoContenido.filter(c => likedSongs.has(c.id)).map(item => (
                      <ContentCard key={item.id} contenido={item} onPlay={playTrack} onLike={toggleLike} isLiked={true} compact onPlaylistsChanged={cargarPlaylists} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <Heart className="mx-auto mb-4 text-[#6a6a6a]" size={48} />
                  <p className="text-[#b3b3b3] text-lg font-semibold">Aun no has guardado contenido</p>
                  <p className="text-[#6a6a6a] text-sm mt-2">Dale like a lo que te guste y aparecera aqui</p>
                </div>
              )}
              <div className="h-24"></div>
            </div>
          )}

          {/* ===== PLAYLIST VIEW ===== */}
          {activeTab === 'playlist' && (
            <div className="section-fade">
              {loadingPlaylist ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-amber-500" size={36} />
                </div>
              ) : activePlaylist ? (
                <>
                  {/* Playlist header */}
                  <div className="px-4 md:px-6 pt-6 pb-6" style={{ background: 'linear-gradient(180deg, rgba(180,130,40,0.2) 0%, rgba(18,18,18,1) 100%)' }}>
                    <div className="flex items-end gap-6">
                      <div className="w-48 h-48 rounded-lg bg-[#282828] shadow-xl shadow-black/50 flex items-center justify-center flex-shrink-0">
                        {activePlaylist.imagen ? (
                          <img src={activePlaylist.imagen} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <ListMusic size={64} className="text-[#535353]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#b3b3b3] mb-2">Playlist</p>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-3 line-clamp-2">{activePlaylist.nombre}</h2>
                        {activePlaylist.descripcion && (
                          <p className="text-sm text-[#b3b3b3] mb-2 line-clamp-2">{activePlaylist.descripcion}</p>
                        )}
                        <p className="text-sm text-[#6a6a6a]">{activePlaylist.items.length} canciones</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-4 mt-6">
                      {activePlaylist.items.length > 0 && (
                        <button
                          onClick={() => playFromPlaylist(activePlaylist, 0)}
                          className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 hover:scale-105 flex items-center justify-center shadow-lg shadow-black/40 transition-all"
                        >
                          <Play size={24} fill="black" className="text-black ml-0.5" />
                        </button>
                      )}
                      <button
                        onClick={handleDeletePlaylist}
                        className="p-3 rounded-full hover:bg-white/10 transition text-[#b3b3b3] hover:text-red-400"
                        title="Eliminar playlist"
                      >
                        <Trash2 size={22} />
                      </button>
                    </div>
                  </div>

                  {/* Playlist items */}
                  <div className="px-4 md:px-6">
                    {activePlaylist.items.length > 0 ? (
                      <div className="bg-[#181818] rounded-lg overflow-hidden">
                        {/* Header row */}
                        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 text-xs text-[#6a6a6a] font-medium">
                          <span className="w-8 text-center">#</span>
                          <span className="flex-1">Titulo</span>
                          <span className="w-20 text-right hidden sm:block">Duracion</span>
                          <span className="w-10"></span>
                        </div>

                        {activePlaylist.items.map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-[#282828] transition-colors group cursor-pointer"
                            onClick={() => playFromPlaylist(activePlaylist, idx)}
                          >
                            {/* Number */}
                            <span className="w-8 text-center text-sm text-[#6a6a6a] group-hover:hidden">{idx + 1}</span>
                            <span className="w-8 text-center hidden group-hover:block">
                              <Play size={14} fill="white" className="text-white mx-auto" />
                            </span>

                            {/* Thumbnail + info */}
                            <div className="w-10 h-10 rounded bg-[#282828] flex-shrink-0 overflow-hidden">
                              {item.contenido.thumbnail ? (
                                <img src={item.contenido.thumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#6a6a6a] text-sm">
                                  {item.contenido.clasificacion.tipo === 'musica' ? '♪' : '📖'}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{item.contenido.titulo}</p>
                              <p className="text-xs text-[#b3b3b3] truncate">{item.contenido.artista}</p>
                            </div>

                            {/* Duration */}
                            <span className="w-20 text-right text-xs text-[#6a6a6a] hidden sm:block">{item.contenido.duracion}</span>

                            {/* Remove */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveFromPlaylist(item.contenido.id); }}
                              className="p-1.5 rounded-full hover:bg-white/10 transition opacity-0 group-hover:opacity-100 text-[#6a6a6a] hover:text-red-400"
                              title="Eliminar de playlist"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <ListMusic className="mx-auto mb-4 text-[#6a6a6a]" size={48} />
                        <p className="text-[#b3b3b3] text-lg font-semibold">Esta playlist esta vacia</p>
                        <p className="text-[#6a6a6a] text-sm mt-2">Agrega canciones usando el boton + en cualquier contenido</p>
                      </div>
                    )}
                  </div>
                  <div className="h-32"></div>
                </>
              ) : (
                <div className="text-center py-20">
                  <p className="text-[#6a6a6a]">No se encontro la playlist</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <MiniPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onClose={() => { setCurrentTrack(null); setIsPlaying(false); setPlaylistContext(null); }}
        playlistContext={playlistContext}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
      <AddContentModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onContentAdded={cargarDatos} />

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowCreatePlaylist(false)}>
          <div className="bg-[#282828] rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Crear playlist</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#b3b3b3] mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreatePlaylist(); }}
                  placeholder="Mi playlist"
                  className="w-full px-4 py-2.5 bg-[#3a3a3a] border border-transparent rounded-md text-white text-sm placeholder-[#6a6a6a] focus:outline-none focus:border-amber-500 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#b3b3b3] mb-1.5">Descripcion (opcional)</label>
                <textarea
                  value={newPlaylistDesc}
                  onChange={e => setNewPlaylistDesc(e.target.value)}
                  placeholder="Describe tu playlist..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#3a3a3a] border border-transparent rounded-md text-white text-sm placeholder-[#6a6a6a] focus:outline-none focus:border-amber-500 transition resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreatePlaylist(false); setNewPlaylistName(''); setNewPlaylistDesc(''); }}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 rounded-full font-semibold text-sm text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || creatingPlaylist}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 rounded-full font-bold text-sm text-black transition-colors flex items-center justify-center gap-2"
              >
                {creatingPlaylist ? <Loader2 size={16} className="animate-spin" /> : null}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {currentTrack && <div className="h-16" />}
    </div>
  );
}
