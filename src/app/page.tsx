'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Menu, BookOpen, Heart, Music, Mic, TrendingUp, ChevronRight, Loader2, Play, X, ListMusic, Trash2, Film, Podcast, BookMarked, Clock, ExternalLink } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ContentCard from '@/components/ContentCard';
import GuiaEstudioCard from '@/components/GuiaEstudioCard';
import AddContentModal from '@/components/AddContentModal';
import { obtenerMusica, obtenerEnsenanzas, obtenerEstudios, obtenerTodoContenido, obtenerGuias, buscarContenido as buscarEnDB, obtenerPlaylists, obtenerPlaylist, crearPlaylist, eliminarDePlaylist, eliminarPlaylist, obtenerArtistas } from '@/lib/database';
import { temasPopulares, librosBiblia, necesidades } from '@/lib/datos-ejemplo';
import ArtistaCard from '@/components/ArtistaCard';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import type { Contenido, GuiaEstudio, FiltrosBusqueda, Playlist, Artista } from '@/types/content';

const GENRE_COLORS: Record<string, string> = {
  'worship': 'from-purple-600 to-purple-900',
  'pop_cristiano': 'from-pink-500 to-pink-800',
  'rock_cristiano': 'from-red-600 to-red-900',
  'hip_hop_cristiano': 'from-blue-700 to-blue-950',
  'reggaeton_cristiano': 'from-green-500 to-green-800',
  'balada_cristiana': 'from-orange-500 to-orange-800',
  'himnos_clasicos': 'from-yellow-600 to-yellow-900',
  'predicacion': 'from-teal-500 to-teal-800',
  'salsa_cristiana': 'from-rose-500 to-rose-800',
  'soaking': 'from-indigo-500 to-indigo-800',
};

const GENRE_LABELS: Record<string, string> = {
  'worship': 'Worship',
  'pop_cristiano': 'Pop Cristiano',
  'rock_cristiano': 'Rock Cristiano',
  'hip_hop_cristiano': 'Hip-Hop Cristiano',
  'reggaeton_cristiano': 'Reggaeton Cristiano',
  'balada_cristiana': 'Baladas',
  'himnos_clasicos': 'Himnos Clasicos',
  'predicacion': 'Predicaciones',
  'salsa_cristiana': 'Salsa Cristiana',
  'soaking': 'Soaking',
};

// Genre-based "Hecho para ti" mixes with representative artist names
const GENRE_MIXES: { genre: string; artists: string[] }[] = [
  { genre: 'worship', artists: ['Maverick City', 'Hillsong', 'Bethel'] },
  { genre: 'pop_cristiano', artists: ['Evan Craft', 'Twice', 'Alex Zurdo'] },
  { genre: 'rock_cristiano', artists: ['Skillet', 'Rescate', 'Rojo'] },
  { genre: 'hip_hop_cristiano', artists: ['Redimi2', 'Lecrae', 'Funky'] },
  { genre: 'predicacion', artists: ['Paul Washer', 'John Piper'] },
  { genre: 'balada_cristiana', artists: ['Marcos Witt', 'Jesús Adrián R.'] },
];

// Curated series & movies recommendations
const SERIES_PELICULAS = [
  { titulo: 'The Chosen', tipo: 'Serie', desc: 'La vida de Jesus a traves de los ojos de quienes lo conocieron', imagen: 'https://i.ytimg.com/vi/craSmBfCkOg/maxresdefault.jpg', url: 'https://www.youtube.com/@TheChosenSeries', genero: 'Drama biblico' },
  { titulo: 'The Bible', tipo: 'Serie', desc: 'Mini-serie epica sobre las historias mas impactantes de la Biblia', imagen: 'https://i.ytimg.com/vi/FYMCj4zJZ-0/maxresdefault.jpg', url: 'https://www.youtube.com/results?search_query=the+bible+series+2013', genero: 'Drama biblico' },
  { titulo: 'Son of God', tipo: 'Pelicula', desc: 'La historia de Jesus desde su nacimiento hasta la resurreccion', imagen: 'https://i.ytimg.com/vi/pwF42x6bijU/maxresdefault.jpg', url: 'https://www.youtube.com/results?search_query=son+of+god+movie', genero: 'Drama biblico' },
  { titulo: 'War Room', tipo: 'Pelicula', desc: 'El poder de la oracion para transformar familias', imagen: 'https://i.ytimg.com/vi/mEv_IkMkmSk/maxresdefault.jpg', url: 'https://www.youtube.com/results?search_query=war+room+pelicula', genero: 'Drama cristiano' },
  { titulo: 'Courageous', tipo: 'Pelicula', desc: 'Policias que deciden ser padres valientes guiados por la fe', imagen: 'https://i.ytimg.com/vi/jV-71FU-SHg/maxresdefault.jpg', url: 'https://www.youtube.com/results?search_query=courageous+pelicula', genero: 'Drama cristiano' },
  { titulo: 'I Can Only Imagine', tipo: 'Pelicula', desc: 'La historia real detras del himno mas vendido de la historia', imagen: 'https://i.ytimg.com/vi/mQk1Ij6K-dY/maxresdefault.jpg', url: 'https://www.youtube.com/results?search_query=i+can+only+imagine+movie', genero: 'Biografico' },
  { titulo: 'Overcomer', tipo: 'Pelicula', desc: 'Encuentra tu identidad en Cristo, no en las circunstancias', imagen: 'https://i.ytimg.com/vi/Lj9BCdsRTJg/maxresdefault.jpg', url: 'https://www.youtube.com/results?search_query=overcomer+movie+kendrick', genero: 'Drama cristiano' },
  { titulo: 'Facing the Giants', tipo: 'Pelicula', desc: 'Un entrenador de futbol que pone su fe en accion', imagen: 'https://i.ytimg.com/vi/ip7LrhWlkxw/maxresdefault.jpg', url: 'https://www.youtube.com/results?search_query=facing+the+giants+pelicula', genero: 'Drama deportivo' },
  { titulo: 'Fireproof', tipo: 'Pelicula', desc: 'Un bombero lucha por salvar su matrimonio con fe', imagen: 'https://i.ytimg.com/vi/7dBkn_-VBOY/maxresdefault.jpg', url: 'https://www.youtube.com/results?search_query=fireproof+movie', genero: 'Drama romantico' },
  { titulo: 'Indivisible', tipo: 'Pelicula', desc: 'Historia real de un capellan militar y su fe inquebrantable', imagen: 'https://i.ytimg.com/vi/NMC0sMj0CvU/maxresdefault.jpg', url: 'https://www.youtube.com/results?search_query=indivisible+movie', genero: 'Drama militar' },
];

// Curated podcast recommendations
const PODCASTS_RECOMENDADOS = [
  { titulo: 'Soldados de Jesus', desc: 'Podcast de teologia reformada y vida cristiana', url: 'https://www.youtube.com/@SoldadosdeJesus', imagen: 'https://i.ytimg.com/vi/_YUzXjpt5BU/maxresdefault.jpg' },
  { titulo: 'Coalicion por el Evangelio', desc: 'Recursos teologicos para la iglesia hispanohablante', url: 'https://www.youtube.com/@CoalicionporelEvangelio', imagen: 'https://i.ytimg.com/vi/xLQBiEkN9lc/maxresdefault.jpg' },
  { titulo: 'Caminando en Gracia', desc: 'Conversaciones sobre gracia, doctrina y vida practica', url: 'https://www.youtube.com/results?search_query=caminando+en+gracia+podcast', imagen: '' },
  { titulo: 'Desiring God en Espanol', desc: 'John Piper y recursos para gozar en Dios', url: 'https://www.youtube.com/@desiringgodespanol', imagen: '' },
  { titulo: 'The Bible Project Espanol', desc: 'Videos animados para entender la Biblia', url: 'https://www.youtube.com/@BibleProjectEspanol', imagen: 'https://i.ytimg.com/vi/ak06MSETeo4/maxresdefault.jpg' },
  { titulo: 'Radical con David Platt', desc: 'Predicas y recursos para vivir radicalmente para Cristo', url: 'https://www.youtube.com/results?search_query=radical+david+platt+espanol', imagen: '' },
];

// Curated book recommendations
const LIBROS_RECOMENDADOS = [
  { titulo: 'Teologia Sistematica', autor: 'Wayne Grudem', tipo: 'Libro', desc: 'La referencia mas completa de teologia evangelica', categoria: 'Teologia' },
  { titulo: 'Conocimiento del Dios Santo', autor: 'A.W. Tozer', tipo: 'Libro', desc: 'Un clasico sobre los atributos de Dios', categoria: 'Devocional' },
  { titulo: 'El Progreso del Peregrino', autor: 'John Bunyan', tipo: 'Libro / Audiolibro', desc: 'La alegoria cristiana mas leida de la historia', categoria: 'Clasico' },
  { titulo: 'Desiring God', autor: 'John Piper', tipo: 'Libro / Ebook', desc: 'El hedonismo cristiano: gozar en Dios sobre todas las cosas', categoria: 'Vida cristiana' },
  { titulo: 'La Cruz del Rey', autor: 'Tim Keller', tipo: 'Libro', desc: 'El mensaje de la cruz en el Evangelio de Marcos', categoria: 'Estudios' },
  { titulo: 'Oracion', autor: 'Tim Keller', tipo: 'Libro / Audiolibro', desc: 'Guia practica y teologica sobre la vida de oracion', categoria: 'Vida cristiana' },
  { titulo: 'Disciplinas Espirituales', autor: 'Donald Whitney', tipo: 'Libro', desc: 'Practicas biblicas para crecer en la fe', categoria: 'Discipulado' },
  { titulo: 'El Evangelio segun Jesucristo', autor: 'John MacArthur', tipo: 'Libro', desc: 'Que realmente significa seguir a Cristo', categoria: 'Evangelio' },
  { titulo: 'Mero Cristianismo', autor: 'C.S. Lewis', tipo: 'Libro / Audiolibro', desc: 'La defensa mas clara de la fe cristiana', categoria: 'Apologetica' },
  { titulo: 'Adoracion en Toda la Vida', autor: 'Harold Best', tipo: 'Libro', desc: 'Adoracion como estilo de vida continuo', categoria: 'Adoracion' },
  { titulo: 'La Biblia de Estudio ESV', autor: 'Crossway', tipo: 'Ebook', desc: 'Biblia de estudio con notas teologicas reformadas', categoria: 'Biblia' },
  { titulo: 'El Corazon del Artista', autor: 'Rory Noland', tipo: 'Libro', desc: 'Guia para musicos y artistas en el ministerio', categoria: 'Ministerio' },
];

export default function HomePage() {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { user, profile, signInWithGoogle, signOut, connectSpotify, disconnectSpotify } = useAuth();

  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGuia, setExpandedGuia] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosBusqueda>({});
  const [musicaSubFilter, setMusicaSubFilter] = useState<'todo' | 'congregacional' | 'worship' | 'himnos' | 'urbano'>('todo');
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [genreData, setGenreData] = useState<{
    topTracks: { titulo: string; artista: string; listeners: number; enCatalogo: boolean; contenidoId?: string; thumbnail?: string }[];
    topArtists: { nombre: string; listeners: number; enCatalogo: boolean; artistaId?: string; slug?: string; imagen?: string; canciones?: number }[];
    sugerencias: { titulo: string; artista: string; listeners: number }[];
  } | null>(null);
  const [genreLoading, setGenreLoading] = useState(false);

  // Datos de Supabase
  const [musica, setMusica] = useState<Contenido[]>([]);
  const [ensenanzas, setEnsenanzas] = useState<Contenido[]>([]);
  const [estudiosData, setEstudiosData] = useState<Contenido[]>([]);
  const [todoContenido, setTodoContenido] = useState<Contenido[]>([]);
  const [guiasEstudio, setGuiasEstudio] = useState<GuiaEstudio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Contenido[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);

  // Playlist state
  const [playlists, setPlaylists] = useState<(Playlist & { _itemCount?: number })[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  // Open content in external platform
  const openContent = useCallback((contenido: Contenido) => {
    window.open(contenido.url, '_blank', 'noopener,noreferrer');
  }, []);

  // Cargar playlists
  const cargarPlaylists = useCallback(async () => {
    const p = await obtenerPlaylists();
    setPlaylists(p as (Playlist & { _itemCount?: number })[]);
  }, []);

  // Cargar datos
  async function cargarDatos() {
    setCargando(true);
    const [m, e, s, t, g, ar] = await Promise.all([
      obtenerMusica(),
      obtenerEnsenanzas(),
      obtenerEstudios(),
      obtenerTodoContenido(),
      obtenerGuias(),
      obtenerArtistas(),
    ]);
    setMusica(m);
    setEnsenanzas(e);
    setEstudiosData(s);
    setTodoContenido(t);
    setGuiasEstudio(g);
    setArtistas(ar);
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

  const openFromPlaylist = (playlist: Playlist, startIndex: number) => {
    const item = playlist.items[startIndex]?.contenido;
    if (item) window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  // Filtrar musica por sub-seccion
  const musicaFiltrada = () => {
    if (musicaSubFilter === 'todo') return musica;
    if (musicaSubFilter === 'congregacional') return musica.filter(m => m.clasificacion.esCongreacional);
    if (musicaSubFilter === 'worship') return musica.filter(m => m.clasificacion.generoMusical === 'worship');
    if (musicaSubFilter === 'himnos') return musica.filter(m => m.clasificacion.generoMusical === 'himnos_clasicos');
    if (musicaSubFilter === 'urbano') return musica.filter(m => ['reggaeton_cristiano', 'hip_hop_cristiano'].includes(m.clasificacion.generoMusical || ''));
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

  // Navigate to genre home
  const navigateToGenre = (genre: string) => {
    setActiveGenre(genre);
    setActiveTab('genero');
    setGenreData(null);
    setGenreLoading(true);
    fetch(`/api/genero/${genre}`)
      .then(r => r.json())
      .then(data => { setGenreData(data); setGenreLoading(false); })
      .catch(() => setGenreLoading(false));
  };

  // When switching tabs (non-playlist), clear playlist selection
  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'playlist') {
      setActivePlaylistId(null);
    }
    if (tab !== 'genero') {
      setActiveGenre(null);
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

          {/* ===== HOME (Resumen de todo) ===== */}
          {activeTab === 'home' && (
            <div className="section-fade">
              {/* Hecho para ti - Genre mixes */}
              <section className="px-4 md:px-6 pt-4 pb-6">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Hecho para ti</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {GENRE_MIXES.map(mix => {
                    const gradient = GENRE_COLORS[mix.genre] || 'from-gray-600 to-gray-900';
                    const label = GENRE_LABELS[mix.genre] || mix.genre;
                    return (
                      <button key={mix.genre} onClick={() => navigateToGenre(mix.genre)}
                        className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${gradient} p-4 h-24 md:h-28 text-left group hover:brightness-110 transition-all`}>
                        <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={18} fill="black" className="text-black ml-0.5" />
                        </div>
                        <p className="font-bold text-white text-sm md:text-base">{label}</p>
                        <p className="text-white/70 text-xs mt-1 line-clamp-2">{mix.artists.join(', ')}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Artistas populares */}
              {artistas.length > 0 && (
                <section className="px-4 md:px-6 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl md:text-2xl font-bold text-white">Artistas populares</h3>
                    <button onClick={() => handleSetActiveTab('musica')} className="text-xs text-[#b3b3b3] hover:text-white font-bold flex items-center gap-1"><ChevronRight size={14} /></button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
                    {artistas.slice(0, 12).map(a => <ArtistaCard key={a.id} artista={a} onClick={() => window.location.href = `/artista/${a.slug}`} />)}
                  </div>
                </section>
              )}

              {/* Recien agregado (musica) */}
              <section className="px-4 md:px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2"><Music size={22} className="text-amber-400" /> Musica reciente</h3>
                  <button onClick={() => handleSetActiveTab('musica')} className="text-xs text-[#b3b3b3] hover:text-white font-bold flex items-center gap-1">Ver todo <ChevronRight size={14} /></button>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {[...musica].sort((a, b) => new Date(b.fechaCreacion || 0).getTime() - new Date(a.fechaCreacion || 0).getTime()).slice(0, 10).map(item => (
                    <div key={item.id} className="flex-shrink-0 w-44 md:w-48">
                      <ContentCard contenido={item} onLike={toggleFavorite} isLiked={isFavorite(item.id)} onPlaylistsChanged={cargarPlaylists} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Predicaciones recientes */}
              <section className="px-4 md:px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2"><Mic size={22} className="text-amber-400" /> Predicas recientes</h3>
                  <button onClick={() => handleSetActiveTab('predicas')} className="text-xs text-[#b3b3b3] hover:text-white font-bold flex items-center gap-1">Ver todo <ChevronRight size={14} /></button>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {ensenanzas.slice(0, 10).map(item => (
                    <div key={item.id} className="flex-shrink-0 w-44 md:w-48">
                      <ContentCard contenido={item} onLike={toggleFavorite} isLiked={isFavorite(item.id)} onPlaylistsChanged={cargarPlaylists} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Series y Peliculas preview */}
              <section className="px-4 md:px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2"><Film size={22} className="text-amber-400" /> Series y Peliculas</h3>
                  <button onClick={() => handleSetActiveTab('series')} className="text-xs text-[#b3b3b3] hover:text-white font-bold flex items-center gap-1">Ver todo <ChevronRight size={14} /></button>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {SERIES_PELICULAS.slice(0, 6).map((sp, i) => (
                    <a key={i} href={sp.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-52 bg-[#181818] rounded-lg overflow-hidden hover:bg-[#282828] transition group">
                      <div className="aspect-video bg-[#282828] overflow-hidden">
                        {sp.imagen ? <img src={sp.imagen} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-[#6a6a6a]"><Film size={32} /></div>}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-bold text-white truncate">{sp.titulo}</p>
                        <p className="text-xs text-amber-400 mt-0.5">{sp.tipo}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>

              {/* Explora generos */}
              <section className="px-4 md:px-6 py-4">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Explora generos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(GENRE_LABELS).filter(([k]) => k !== 'predicacion').map(([key, label]) => (
                    <button key={key} onClick={() => navigateToGenre(key)}
                      className={`rounded-lg bg-gradient-to-br ${GENRE_COLORS[key] || 'from-gray-600 to-gray-900'} p-4 h-24 text-left hover:brightness-110 transition-all`}>
                      <p className="font-bold text-white text-sm md:text-base">{label}</p>
                    </button>
                  ))}
                </div>
              </section>
              <div className="h-32"></div>
            </div>
          )}

          {/* ===== MUSICA (dedicated home) ===== */}
          {activeTab === 'musica' && (
            <div className="section-fade">
              <div className="px-4 md:px-6 pt-4 pb-2">
                <h2 className="text-2xl md:text-3xl font-extrabold mb-2 flex items-center gap-2"><Music className="text-amber-400" /> Musica</h2>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  {([
                    { id: 'todo', label: 'Todo' },
                    { id: 'congregacional', label: 'Congregacional' },
                    { id: 'worship', label: 'Worship' },
                    { id: 'himnos', label: 'Himnos' },
                    { id: 'urbano', label: 'Urbano' },
                  ] as const).map(f => (
                    <button key={f.id} onClick={() => setMusicaSubFilter(f.id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${musicaSubFilter === f.id ? 'bg-white text-black' : 'bg-[#232323] text-white hover:bg-[#2a2a2a]'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre mixes */}
              <section className="px-4 md:px-6 py-4">
                <h3 className="text-lg font-bold text-white mb-3">Mixes para ti</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {GENRE_MIXES.filter(m => m.genre !== 'predicacion').map(mix => {
                    const gradient = GENRE_COLORS[mix.genre] || 'from-gray-600 to-gray-900';
                    const label = GENRE_LABELS[mix.genre] || mix.genre;
                    return (
                      <button key={mix.genre} onClick={() => navigateToGenre(mix.genre)}
                        className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${gradient} p-4 h-24 text-left group hover:brightness-110 transition-all`}>
                        <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={18} fill="black" className="text-black ml-0.5" />
                        </div>
                        <p className="font-bold text-white text-sm">{label}</p>
                        <p className="text-white/70 text-xs mt-1">{mix.artists.join(', ')}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Artistas */}
              {artistas.filter(a => a.tipo !== 'pastor' && a.tipo !== 'predicador' && a.tipo !== 'ministerio').length > 0 && (
                <section className="px-4 md:px-6 py-4">
                  <h3 className="text-lg font-bold text-white mb-3">Artistas</h3>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
                    {artistas.filter(a => a.tipo !== 'pastor' && a.tipo !== 'predicador' && a.tipo !== 'ministerio').slice(0, 20).map(a => <ArtistaCard key={a.id} artista={a} onClick={() => window.location.href = `/artista/${a.slug}`} />)}
                  </div>
                </section>
              )}

              {/* Song list */}
              <section className="px-4 md:px-6 py-4">
                <h3 className="text-lg font-bold text-white mb-3">Canciones {musicaSubFilter !== 'todo' ? `- ${musicaSubFilter}` : ''}</h3>
                <div className="bg-[#181818] rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 text-xs text-[#6a6a6a] font-medium">
                    <span className="w-8 text-center">#</span><span className="w-12"></span><span className="flex-1">Titulo</span><span className="w-28 hidden sm:block">Artista</span><span className="w-24 hidden md:block">Genero</span><span className="w-14 text-right">Duracion</span>
                  </div>
                  {musicaFiltrada().map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[#282828] transition-colors group cursor-pointer" onClick={() => openContent(item)}>
                      <span className="w-8 text-center text-sm text-[#6a6a6a] group-hover:hidden">{idx + 1}</span>
                      <span className="w-8 text-center hidden group-hover:block"><Play size={14} fill="white" className="text-white mx-auto" /></span>
                      <div className="w-12 h-10 rounded bg-[#282828] flex-shrink-0 overflow-hidden">
                        {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#6a6a6a] text-sm">&#9835;</div>}
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{item.titulo}</p><p className="text-xs text-[#b3b3b3] truncate sm:hidden">{item.artista}</p></div>
                      <span className="w-28 text-xs text-[#b3b3b3] truncate hidden sm:block">{item.artista}</span>
                      <span className="w-24 text-xs text-[#6a6a6a] truncate hidden md:block">{GENRE_LABELS[item.clasificacion.generoMusical || ''] || '-'}</span>
                      <span className="w-14 text-right text-xs text-[#6a6a6a]">{item.duracion}</span>
                    </div>
                  ))}
                </div>
              </section>
              <div className="h-32"></div>
            </div>
          )}

          {/* ===== PREDICAS (dedicated home) ===== */}
          {activeTab === 'predicas' && (
            <div className="p-4 md:p-6 max-w-4xl mx-auto section-fade">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1 flex items-center gap-2"><Mic className="text-amber-400" /> Predicas y Ensenanzas</h2>
              <p className="text-sm text-[#6a6a6a] mb-6">Sermones expositivos evaluados teologicamente</p>

              {/* Predicadores destacados */}
              {artistas.filter(a => a.tipo === 'pastor' || a.tipo === 'predicador' || a.tipo === 'ministerio').length > 0 && (
                <section className="mb-8">
                  <h3 className="text-lg font-bold text-white mb-3">Predicadores</h3>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
                    {artistas.filter(a => a.tipo === 'pastor' || a.tipo === 'predicador' || a.tipo === 'ministerio').map(a => <ArtistaCard key={a.id} artista={a} onClick={() => window.location.href = `/artista/${a.slug}`} />)}
                  </div>
                </section>
              )}

              {/* Temas de predicas */}
              <section className="mb-8">
                <h3 className="text-lg font-bold text-white mb-3">Por temas</h3>
                <div className="flex flex-wrap gap-2">
                  {['Evangelio', 'Gracia', 'Santificacion', 'Soberania', 'Oracion', 'Fe', 'Arrepentimiento', 'Esperanza', 'Justificacion', 'Iglesia'].map(tema => (
                    <button key={tema} onClick={() => { setSearchQuery(tema); handleSetActiveTab('buscar'); setFiltros({ ...filtros, tipo: 'predicacion' }); }}
                      className="px-4 py-2 bg-[#232323] rounded-full text-sm text-[#b3b3b3] hover:text-white hover:bg-teal-600/30 transition-colors">{tema}</button>
                  ))}
                </div>
              </section>

              {/* Recientes */}
              <section className="mb-8">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Clock size={18} /> Recientes</h3>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {[...ensenanzas].sort((a, b) => new Date(b.fechaCreacion || 0).getTime() - new Date(a.fechaCreacion || 0).getTime()).slice(0, 10).map(item => (
                    <div key={item.id} className="flex-shrink-0 w-44 md:w-48">
                      <ContentCard contenido={item} onLike={toggleFavorite} isLiked={isFavorite(item.id)} onPlaylistsChanged={cargarPlaylists} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Todas las predicas - list */}
              <section>
                <h3 className="text-lg font-bold text-white mb-3">Todas las predicas</h3>
                <div className="bg-[#181818] rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 text-xs text-[#6a6a6a] font-medium">
                    <span className="w-8 text-center">#</span><span className="w-12"></span><span className="flex-1">Titulo</span><span className="w-28 hidden sm:block">Predicador</span><span className="w-12 text-right hidden sm:block">Score</span><span className="w-14 text-right">Duracion</span>
                  </div>
                  {ensenanzas.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[#282828] transition-colors group cursor-pointer" onClick={() => openContent(item)}>
                      <span className="w-8 text-center text-sm text-[#6a6a6a] group-hover:hidden">{idx + 1}</span>
                      <span className="w-8 text-center hidden group-hover:block"><Play size={14} fill="white" className="text-white mx-auto" /></span>
                      <div className="w-12 h-10 rounded bg-[#282828] flex-shrink-0 overflow-hidden">
                        {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#6a6a6a] text-sm">🎤</div>}
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{item.titulo}</p><p className="text-xs text-[#b3b3b3] truncate sm:hidden">{item.artista}</p></div>
                      <span className="w-28 text-xs text-[#b3b3b3] truncate hidden sm:block">{item.artista}</span>
                      <span className="w-12 text-right hidden sm:block"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.evaluacion.puntuacionTotal >= 85 ? 'bg-amber-500/20 text-amber-400' : item.evaluacion.puntuacionTotal >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{item.evaluacion.puntuacionTotal}</span></span>
                      <span className="w-14 text-right text-xs text-[#6a6a6a]">{item.duracion}</span>
                    </div>
                  ))}
                </div>
              </section>
              <div className="h-32"></div>
            </div>
          )}

          {/* ===== SERIES Y PELICULAS ===== */}
          {activeTab === 'series' && (
            <div className="p-4 md:p-6 max-w-4xl mx-auto section-fade">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1 flex items-center gap-2"><Film className="text-amber-400" /> Series y Peliculas</h2>
              <p className="text-sm text-[#6a6a6a] mb-6">Contenido audiovisual cristiano recomendado</p>

              {/* Filter pills */}
              <div className="flex gap-2 mb-6">
                {['Todo', 'Serie', 'Pelicula'].map(f => (
                  <button key={f} className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#232323] text-white hover:bg-[#2a2a2a] transition-colors">{f}</button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {SERIES_PELICULAS.map((sp, i) => (
                  <a key={i} href={sp.url} target="_blank" rel="noopener noreferrer"
                    className="bg-[#181818] rounded-lg overflow-hidden hover:bg-[#282828] transition group">
                    <div className="aspect-video bg-[#282828] overflow-hidden relative">
                      {sp.imagen ? <img src={sp.imagen} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-[#6a6a6a]"><Film size={40} /></div>}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[10px] font-bold text-amber-400">{sp.tipo}</div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-white mb-1">{sp.titulo}</p>
                      <p className="text-xs text-[#b3b3b3] line-clamp-2 mb-2">{sp.desc}</p>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/15 rounded text-amber-400 font-medium">{sp.genero}</span>
                    </div>
                  </a>
                ))}
              </div>
              <div className="h-32"></div>
            </div>
          )}

          {/* ===== PODCASTS ===== */}
          {activeTab === 'podcasts' && (
            <div className="p-4 md:p-6 max-w-4xl mx-auto section-fade">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1 flex items-center gap-2"><Podcast className="text-amber-400" /> Podcasts</h2>
              <p className="text-sm text-[#6a6a6a] mb-6">Podcasts cristianos recomendados</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PODCASTS_RECOMENDADOS.map((pod, i) => (
                  <a key={i} href={pod.url} target="_blank" rel="noopener noreferrer"
                    className="flex gap-4 bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition group">
                    <div className="w-20 h-20 rounded-lg bg-[#282828] flex-shrink-0 overflow-hidden">
                      {pod.imagen ? <img src={pod.imagen} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Podcast size={28} className="text-[#6a6a6a]" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white mb-1">{pod.titulo}</p>
                      <p className="text-xs text-[#b3b3b3] line-clamp-2 mb-2">{pod.desc}</p>
                      <span className="text-xs text-amber-400 flex items-center gap-1 group-hover:underline"><ExternalLink size={12} /> Escuchar</span>
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-8 p-6 bg-[#181818] rounded-lg text-center">
                <Podcast className="mx-auto mb-3 text-[#6a6a6a]" size={40} />
                <p className="text-[#b3b3b3] font-semibold">Mas podcasts pronto</p>
                <p className="text-xs text-[#6a6a6a] mt-1">Estamos curando los mejores podcasts cristianos</p>
              </div>
              <div className="h-32"></div>
            </div>
          )}

          {/* ===== LIBROS ===== */}
          {activeTab === 'libros' && (
            <div className="p-4 md:p-6 max-w-4xl mx-auto section-fade">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1 flex items-center gap-2"><BookMarked className="text-amber-400" /> Libros</h2>
              <p className="text-sm text-[#6a6a6a] mb-6">Libros, ebooks y audiolibros recomendados</p>

              {/* Category pills */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
                {['Todos', 'Teologia', 'Vida cristiana', 'Devocional', 'Estudios', 'Apologetica', 'Clasico'].map(cat => (
                  <button key={cat} className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-[#232323] text-white hover:bg-[#2a2a2a] transition-colors">{cat}</button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LIBROS_RECOMENDADOS.map((libro, i) => (
                  <div key={i} className="flex gap-4 bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition">
                    <div className="w-16 h-24 rounded bg-gradient-to-br from-amber-900/40 to-[#282828] flex items-center justify-center flex-shrink-0">
                      <BookMarked size={24} className="text-amber-400/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm mb-0.5">{libro.titulo}</p>
                      <p className="text-xs text-amber-400 mb-1">{libro.autor}</p>
                      <p className="text-xs text-[#b3b3b3] line-clamp-2 mb-2">{libro.desc}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded text-[#b3b3b3]">{libro.tipo}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/15 rounded text-amber-400">{libro.categoria}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-[#181818] rounded-lg text-center">
                <BookMarked className="mx-auto mb-3 text-[#6a6a6a]" size={40} />
                <p className="text-[#b3b3b3] font-semibold">Audiolibros y ebooks pronto</p>
                <p className="text-xs text-[#6a6a6a] mt-1">Estamos integrando una biblioteca digital cristiana</p>
              </div>
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
                  <button key={i} onClick={() => { setFiltros({ ...filtros, tipo: f.value as FiltrosBusqueda['tipo'] }); setGenreFilter(null); }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filtros.tipo === f.value && !genreFilter
                        ? 'bg-white text-black'
                        : 'bg-[#232323] text-white hover:bg-[#2a2a2a]'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Active genre filter badge */}
              {genreFilter && (
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${GENRE_COLORS[genreFilter] || 'from-gray-600 to-gray-900'} text-white`}>
                    {GENRE_LABELS[genreFilter] || genreFilter}
                  </span>
                  <button onClick={() => setGenreFilter(null)} className="text-xs text-[#b3b3b3] hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
              )}

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

              {/* Genre filtered list view */}
              {genreFilter && !searchQuery ? (
                <>
                  <h3 className="font-bold text-base mb-3 text-white">{GENRE_LABELS[genreFilter] || genreFilter}</h3>
                  {(() => {
                    const genreItems = todoContenido.filter(c => c.clasificacion.generoMusical === genreFilter || (genreFilter === 'predicacion' && c.clasificacion.tipo === 'predicacion'));
                    return (
                      <>
                        {/* List header */}
                        <div className="bg-[#181818] rounded-lg overflow-hidden">
                          <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 text-xs text-[#6a6a6a] font-medium">
                            <span className="w-8 text-center">#</span>
                            <span className="w-12"></span>
                            <span className="flex-1">Titulo</span>
                            <span className="w-28 hidden sm:block">Artista</span>
                            <span className="w-24 hidden md:block">Genero</span>
                            <span className="w-12 text-right hidden sm:block">Score</span>
                            <span className="w-14 text-right">Duracion</span>
                          </div>
                          {genreItems.map((item, idx) => (
                            <div key={item.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[#282828] transition-colors group cursor-pointer" onClick={() => openContent(item)}>
                              <span className="w-8 text-center text-sm text-[#6a6a6a] group-hover:hidden">{idx + 1}</span>
                              <span className="w-8 text-center hidden group-hover:block"><Play size={14} fill="white" className="text-white mx-auto" /></span>
                              <div className="w-12 h-10 rounded bg-[#282828] flex-shrink-0 overflow-hidden">
                                {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#6a6a6a] text-sm">{item.clasificacion.tipo === 'musica' ? '\u266A' : '\uD83C\uDFA4'}</div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{item.titulo}</p>
                                <p className="text-xs text-[#b3b3b3] truncate sm:hidden">{item.artista}</p>
                              </div>
                              <span className="w-28 text-xs text-[#b3b3b3] truncate hidden sm:block">{item.artista}</span>
                              <span className="w-24 text-xs text-[#6a6a6a] truncate hidden md:block">{GENRE_LABELS[item.clasificacion.generoMusical || ''] || item.clasificacion.generoMusical || '-'}</span>
                              <span className="w-12 text-right hidden sm:block"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.evaluacion.puntuacionTotal >= 85 ? 'bg-amber-500/20 text-amber-400' : item.evaluacion.puntuacionTotal >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{item.evaluacion.puntuacionTotal}</span></span>
                              <span className="w-14 text-right text-xs text-[#6a6a6a]">{item.duracion}</span>
                            </div>
                          ))}
                        </div>
                        {genreItems.length === 0 && <p className="text-center py-8 text-[#6a6a6a]">No hay contenido en este genero</p>}
                      </>
                    );
                  })()}
                </>
              ) : searchQuery ? (
                <>
                  {buscarGuias().length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold text-base mb-3 text-white">Guias de Estudio</h3>
                      <div className="space-y-2">
                        {buscarGuias().map(guia => (
                          <GuiaEstudioCard key={guia.id} guia={guia} expanded={expandedGuia === guia.id} onToggle={() => setExpandedGuia(expandedGuia === guia.id ? null : guia.id)} />
                        ))}
                      </div>
                    </div>
                  )}

                  <h3 className="font-bold text-base mb-3 text-white">Contenido ({resultadosBusqueda.length})</h3>
                  <div className="bg-[#181818] rounded-lg overflow-hidden">
                    {resultadosBusqueda.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3 px-2">
                        <span className="text-sm font-bold text-[#6a6a6a] w-6 text-right">{idx + 1}</span>
                        <div className="flex-1"><ContentCard contenido={item} onLike={toggleFavorite} isLiked={isFavorite(item.id)} compact onPlaylistsChanged={cargarPlaylists} /></div>
                      </div>
                    ))}
                  </div>
                  {resultadosBusqueda.length === 0 && <p className="text-center py-8 text-[#6a6a6a]">No se encontro contenido para &quot;{searchQuery}&quot;</p>}
                </>
              ) : (
                <>
                  {/* Genre grid when no search query */}
                  <section className="mb-8">
                    <h3 className="font-bold text-base mb-3 text-white">Explora generos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(GENRE_LABELS).map(([key, label]) => {
                        const gradient = GENRE_COLORS[key] || 'from-gray-600 to-gray-900';
                        return (
                          <button
                            key={key}
                            onClick={() => navigateToGenre(key)}
                            className={`rounded-lg bg-gradient-to-br ${gradient} p-4 h-24 text-left hover:brightness-110 transition-all`}
                          >
                            <p className="font-bold text-white text-sm md:text-base">{label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </section>

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

          {/* ===== GENRE HOME ===== */}
          {activeTab === 'genero' && activeGenre && (() => {
            const genreLabel = GENRE_LABELS[activeGenre] || activeGenre;
            const gradient = GENRE_COLORS[activeGenre] || 'from-gray-600 to-gray-900';
            const allGenreSongs = musica.filter(m => m.clasificacion.generoMusical === activeGenre);
            const relatedGenres = Object.keys(GENRE_LABELS).filter(g => g !== activeGenre && g !== 'predicacion');

            // Build a lookup from contenidoId to actual content item
            const contenidoMap = new Map(todoContenido.map(c => [c.id, c]));

            // Top tracks from Last.fm matched with our catalog
            const topTracksReal = (genreData?.topTracks || [])
              .filter(t => t.enCatalogo && t.contenidoId)
              .map(t => contenidoMap.get(t.contenidoId!))
              .filter((c): c is Contenido => !!c);

            // Top artists from Last.fm matched with our catalog
            const topArtistsReal = (genreData?.topArtists || [])
              .filter(a => a.enCatalogo && a.artistaId)
              .map(a => {
                const found = artistas.find(ar => ar.id === a.artistaId);
                return found ? { ...found, listeners: a.listeners } : null;
              })
              .filter((a): a is Artista & { listeners: number } => !!a);

            // Suggestions: popular tracks not in our catalog
            const sugerencias = genreData?.sugerencias || [];

            // Fallback: use our data sorted by eval score
            const recientes = [...allGenreSongs].sort((a, b) => new Date(b.fechaCreacion || 0).getTime() - new Date(a.fechaCreacion || 0).getTime());

            return (
              <div className="section-fade">
                {/* Hero banner */}
                <div className={`relative bg-gradient-to-b ${gradient} px-4 md:px-6 pt-12 pb-8`}>
                  <button onClick={() => handleSetActiveTab('home')} className="absolute top-4 left-4 text-white/70 hover:text-white text-sm flex items-center gap-1">
                    ← Inicio
                  </button>
                  <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2">{genreLabel}</h1>
                  <p className="text-white/70 text-sm">
                    {allGenreSongs.length} canciones en catalogo
                    {topArtistsReal.length > 0 && ` · ${topArtistsReal.length} artistas populares`}
                  </p>

                  {allGenreSongs.length > 0 && (
                    <div className="flex items-center gap-3 mt-6">
                      <span className="text-white/70 text-sm font-medium">{allGenreSongs.length} canciones disponibles</span>
                    </div>
                  )}
                </div>

                {genreLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-amber-500 mr-2" size={20} />
                    <span className="text-[#b3b3b3] text-sm">Cargando datos de Last.fm...</span>
                  </div>
                )}

                {/* Top tracks from Last.fm (real popularity data) */}
                {topTracksReal.length > 0 && (
                  <section className="px-4 md:px-6 py-4">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><TrendingUp size={18} className="text-amber-400" /> Lo mas escuchado</h3>
                    <p className="text-xs text-[#6a6a6a] mb-3">Ranking real basado en datos de Last.fm</p>
                    <div className="bg-[#181818] rounded-lg overflow-hidden">
                      {topTracksReal.slice(0, 15).map((item, idx) => {
                        const trackInfo = genreData?.topTracks.find(t => t.contenidoId === item.id);
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#282828] transition-colors group cursor-pointer" onClick={() => openContent(item)}>
                            <span className="w-8 text-center text-lg font-extrabold text-[#6a6a6a] group-hover:hidden">{idx + 1}</span>
                            <span className="w-8 text-center hidden group-hover:block"><ExternalLink size={14} className="text-white mx-auto" /></span>
                            <div className="w-12 h-10 rounded bg-[#282828] flex-shrink-0 overflow-hidden">
                              {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#6a6a6a] text-sm">&#9835;</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{item.titulo}</p>
                              <p className="text-xs text-[#b3b3b3] truncate">{item.artista}</p>
                            </div>
                            {trackInfo && (
                              <span className="text-[10px] text-[#6a6a6a] hidden sm:block">{(trackInfo.listeners / 1000).toFixed(0)}K oyentes</span>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} className="p-1.5">
                              <Heart size={16} className={isFavorite(item.id) ? 'text-amber-400 fill-amber-400' : 'text-[#6a6a6a] hover:text-white'} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Top artists from Last.fm */}
                {topArtistsReal.length > 0 && (
                  <section className="px-4 md:px-6 py-4">
                    <h3 className="text-lg font-bold text-white mb-1">Artistas populares de {genreLabel}</h3>
                    <p className="text-xs text-[#6a6a6a] mb-3">Segun oyentes globales en Last.fm</p>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
                      {topArtistsReal.slice(0, 20).map(a => (
                        <div key={a.id} className="flex-shrink-0">
                          <ArtistaCard artista={a} onClick={() => window.location.href = `/artista/${a.slug}`} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Agregados recientemente a GospelPlay */}
                {recientes.length > 0 && (
                  <section className="px-4 md:px-6 py-4">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Clock size={18} className="text-amber-400" /> Agregados recientemente</h3>
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                      {recientes.slice(0, 12).map(item => (
                        <div key={item.id} className="flex-shrink-0 w-44 md:w-48">
                          <ContentCard contenido={item} onLike={toggleFavorite} isLiked={isFavorite(item.id)} onPlaylistsChanged={cargarPlaylists} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Sugerencias - tracks populares que no tenemos */}
                {sugerencias.length > 0 && (
                  <section className="px-4 md:px-6 py-4">
                    <h3 className="text-lg font-bold text-white mb-1">Populares que nos faltan</h3>
                    <p className="text-xs text-[#6a6a6a] mb-3">Canciones top en Last.fm que aun no estan en GospelPlay</p>
                    <div className="bg-[#181818] rounded-lg overflow-hidden">
                      {sugerencias.slice(0, 8).map((s, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-2.5 opacity-60">
                          <span className="w-8 text-center text-sm text-[#6a6a6a]">{idx + 1}</span>
                          <div className="w-12 h-10 rounded bg-[#282828] flex-shrink-0 flex items-center justify-center text-[#6a6a6a] text-sm">&#9835;</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{s.titulo}</p>
                            <p className="text-xs text-[#b3b3b3] truncate">{s.artista}</p>
                          </div>
                          <span className="text-[10px] text-[#6a6a6a]">{(s.listeners / 1000).toFixed(0)}K</span>
                          <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-[#6a6a6a]">Pronto</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* También te puede gustar */}
                <section className="px-4 md:px-6 py-4">
                  <h3 className="text-lg font-bold text-white mb-3">Tambien te puede gustar</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {relatedGenres.slice(0, 4).map(key => (
                      <button key={key} onClick={() => navigateToGenre(key)}
                        className={`rounded-lg bg-gradient-to-br ${GENRE_COLORS[key] || 'from-gray-600 to-gray-900'} p-4 h-20 text-left hover:brightness-110 transition-all`}>
                        <p className="font-bold text-white text-sm">{GENRE_LABELS[key]}</p>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Todas las canciones del catálogo */}
                {allGenreSongs.length > 0 && (
                  <section className="px-4 md:px-6 py-4">
                    <h3 className="text-lg font-bold text-white mb-3">Todo el catalogo de {genreLabel}</h3>
                    <div className="bg-[#181818] rounded-lg overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 text-xs text-[#6a6a6a] font-medium">
                        <span className="w-8 text-center">#</span><span className="w-12"></span><span className="flex-1">Titulo</span><span className="w-28 hidden sm:block">Artista</span><span className="w-14 text-right">Duracion</span>
                      </div>
                      {allGenreSongs.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[#282828] transition-colors group cursor-pointer" onClick={() => openContent(item)}>
                          <span className="w-8 text-center text-sm text-[#6a6a6a] group-hover:hidden">{idx + 1}</span>
                          <span className="w-8 text-center hidden group-hover:block"><Play size={14} fill="white" className="text-white mx-auto" /></span>
                          <div className="w-12 h-10 rounded bg-[#282828] flex-shrink-0 overflow-hidden">
                            {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#6a6a6a] text-sm">&#9835;</div>}
                          </div>
                          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{item.titulo}</p><p className="text-xs text-[#b3b3b3] truncate sm:hidden">{item.artista}</p></div>
                          <span className="w-28 text-xs text-[#b3b3b3] truncate hidden sm:block">{item.artista}</span>
                          <span className="w-14 text-right text-xs text-[#6a6a6a]">{item.duracion}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="h-32"></div>
              </div>
            );
          })()}

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
                    <div className="flex-1"><ContentCard contenido={item} onLike={toggleFavorite} isLiked={isFavorite(item.id)} compact onPlaylistsChanged={cargarPlaylists} /></div>
                  </div>
                ))}
              </div>

              <h3 className="font-bold text-base mb-3 text-white">Ensenanzas Trending</h3>
              <div className="bg-[#181818] rounded-lg overflow-hidden">
                {ensenanzas.sort((a, b) => b.likes - a.likes).slice(0, 5).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 px-2">
                    <span className="text-lg font-extrabold text-[#6a6a6a] w-6 text-right">{idx + 1}</span>
                    <div className="flex-1"><ContentCard contenido={item} onLike={toggleFavorite} isLiked={isFavorite(item.id)} compact onPlaylistsChanged={cargarPlaylists} /></div>
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
                  <GuiaEstudioCard key={guia.id} guia={guia} expanded={expandedGuia === guia.id} onToggle={() => setExpandedGuia(expandedGuia === guia.id ? null : guia.id)} />
                ))}
              </div>

              <h3 className="font-bold text-base mb-3 text-white">Estudios Individuales</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {estudiosData.map(item => (
                  <ContentCard key={item.id} contenido={item} onLike={toggleFavorite} isLiked={isFavorite(item.id)} onPlaylistsChanged={cargarPlaylists} />
                ))}
              </div>
              <div className="h-24"></div>
            </div>
          )}


          {/* ===== BIBLIOTECA ===== */}
          {activeTab === 'biblioteca' && (() => {
            const liked = todoContenido.filter(c => isFavorite(c.id));
            const likedMusica = liked.filter(c => c.clasificacion.tipo === 'musica');
            const likedPredicas = liked.filter(c => c.clasificacion.tipo === 'predicacion');
            const likedEstudios = liked.filter(c => c.clasificacion.tipo === 'estudio_biblico');
            const likedOtros = liked.filter(c => !['musica', 'predicacion', 'estudio_biblico'].includes(c.clasificacion.tipo || ''));
            return (
              <div className="p-4 md:p-6 max-w-4xl mx-auto section-fade">
                <h2 className="text-2xl md:text-3xl font-extrabold mb-1">Mi Biblioteca</h2>
                <p className="text-sm text-[#6a6a6a] mb-6">Tu contenido guardado</p>
                {liked.length > 0 ? (
                  <>
                    <p className="text-sm text-amber-400 font-semibold mb-4">{liked.length} guardados</p>

                    {likedMusica.length > 0 && (
                      <section className="mb-6">
                        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2"><Music size={16} className="text-amber-400" /> Musica ({likedMusica.length})</h3>
                        <div className="bg-[#181818] rounded-lg overflow-hidden">
                          {likedMusica.map(item => <ContentCard key={item.id} contenido={item} onLike={toggleFavorite} isLiked={true} compact onPlaylistsChanged={cargarPlaylists} />)}
                        </div>
                      </section>
                    )}

                    {likedPredicas.length > 0 && (
                      <section className="mb-6">
                        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2"><Mic size={16} className="text-amber-400" /> Predicas ({likedPredicas.length})</h3>
                        <div className="bg-[#181818] rounded-lg overflow-hidden">
                          {likedPredicas.map(item => <ContentCard key={item.id} contenido={item} onLike={toggleFavorite} isLiked={true} compact onPlaylistsChanged={cargarPlaylists} />)}
                        </div>
                      </section>
                    )}

                    {likedEstudios.length > 0 && (
                      <section className="mb-6">
                        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2"><BookOpen size={16} className="text-amber-400" /> Estudios ({likedEstudios.length})</h3>
                        <div className="bg-[#181818] rounded-lg overflow-hidden">
                          {likedEstudios.map(item => <ContentCard key={item.id} contenido={item} onLike={toggleFavorite} isLiked={true} compact onPlaylistsChanged={cargarPlaylists} />)}
                        </div>
                      </section>
                    )}

                    {likedOtros.length > 0 && (
                      <section className="mb-6">
                        <h3 className="text-base font-bold text-white mb-2">Otros ({likedOtros.length})</h3>
                        <div className="bg-[#181818] rounded-lg overflow-hidden">
                          {likedOtros.map(item => <ContentCard key={item.id} contenido={item} onLike={toggleFavorite} isLiked={true} compact onPlaylistsChanged={cargarPlaylists} />)}
                        </div>
                      </section>
                    )}
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
            );
          })()}

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
                          onClick={() => openFromPlaylist(activePlaylist, 0)}
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
                            onClick={() => openFromPlaylist(activePlaylist, idx)}
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
          {/* ===== PERFIL ===== */}
          {activeTab === 'perfil' && (
            <div className="p-4 md:p-6 max-w-2xl mx-auto section-fade">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-6">Mi Perfil</h2>

              {user && profile ? (
                <div className="space-y-4">
                  {/* Profile card */}
                  <div className="bg-[#181818] rounded-xl p-6 flex items-center gap-4">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl font-bold text-black">
                        {profile.nombre.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{profile.nombre}</h3>
                      <p className="text-sm text-[#6a6a6a]">{profile.email}</p>
                    </div>
                  </div>

                  {/* Spotify connection */}
                  <div className="bg-[#181818] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DB954">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      <h4 className="font-bold text-white">Spotify</h4>
                    </div>

                    {profile.spotify_connected ? (
                      <div>
                        <p className="text-sm text-green-400 mb-3">Conectado</p>
                        <p className="text-xs text-[#6a6a6a] mb-4">
                          Analizamos tus artistas cristianos en Spotify para darte recomendaciones personalizadas con Last.fm
                        </p>
                        <button
                          onClick={disconnectSpotify}
                          className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-full text-sm font-semibold text-white transition"
                        >
                          Desconectar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-[#b3b3b3] mb-4">
                          Conecta tu Spotify para descubrir artistas cristianos basados en lo que ya escuchas.
                          Usamos Last.fm para encontrar artistas similares que te van a encantar.
                        </p>
                        <button
                          onClick={connectSpotify}
                          className="px-6 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] rounded-full text-sm font-bold text-black transition flex items-center gap-2"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                          Conectar Spotify
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="bg-[#181818] rounded-xl p-6">
                    <h4 className="font-bold text-white mb-3">Tu actividad</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#282828] rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-amber-400">{favorites.size}</p>
                        <p className="text-xs text-[#6a6a6a]">Favoritos</p>
                      </div>
                      <div className="bg-[#282828] rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-amber-400">{playlists.length}</p>
                        <p className="text-xs text-[#6a6a6a]">Playlists</p>
                      </div>
                    </div>
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={signOut}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-[#b3b3b3] transition"
                  >
                    Cerrar sesion
                  </button>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <Music size={32} className="text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Inicia sesion en GospelPlay</h3>
                  <p className="text-sm text-[#6a6a6a] mb-6 max-w-xs mx-auto">
                    Guarda tu contenido favorito, crea playlists y conecta Spotify para recomendaciones personalizadas
                  </p>
                  <button
                    onClick={signInWithGoogle}
                    className="px-8 py-3 bg-white hover:bg-gray-100 rounded-full text-sm font-bold text-black transition flex items-center gap-3 mx-auto"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Iniciar con Google
                  </button>
                </div>
              )}
              <div className="h-24"></div>
            </div>
          )}

        </main>
      </div>

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

    </div>
  );
}
