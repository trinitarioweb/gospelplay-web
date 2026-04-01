'use client';

import { Home, Search, BookOpen, Music, Flame, Radio, X, Library, ListMusic, Plus, Film, Podcast, BookMarked, LogIn, LogOut, Settings } from 'lucide-react';
import type { Playlist } from '@/types/content';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  playlists?: (Playlist & { _itemCount?: number })[];
  onSelectPlaylist?: (id: string) => void;
  onCreatePlaylist?: () => void;
  activePlaylistId?: string | null;
}

const navItems = [
  { icon: Home, label: 'Inicio', id: 'home' },
  { icon: Search, label: 'Buscar', id: 'buscar' },
  { icon: Flame, label: 'Trending', id: 'trending' },
];

const sectionItems = [
  { icon: Music, label: 'Musica', id: 'musica' },
  { icon: Radio, label: 'Predicas', id: 'predicas' },
  { icon: Film, label: 'Series y Peliculas', id: 'series' },
  { icon: Podcast, label: 'Podcasts', id: 'podcasts' },
  { icon: BookMarked, label: 'Libros', id: 'libros' },
  { icon: BookOpen, label: 'Estudios', id: 'estudios' },
  { icon: Library, label: 'Mi Biblioteca', id: 'biblioteca' },
];

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, playlists = [], onSelectPlaylist, onCreatePlaylist, activePlaylistId }: SidebarProps) {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed md:relative z-40 w-[280px] h-screen flex flex-col gap-2 p-2 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Top nav section */}
        <div className="bg-[#121212] rounded-lg p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-black text-black">
              GP
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white tracking-tight">GospelPlay</h1>
            </div>
            <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-1.5 hover:bg-white/10 rounded-full text-[#b3b3b3]">
              <X size={18} />
            </button>
          </div>

          {/* Main nav */}
          <nav className="space-y-0.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md transition-colors text-sm font-bold ${
                  activeTab === item.id && !activePlaylistId
                    ? 'text-white'
                    : 'text-[#b3b3b3] hover:text-white'
                }`}
              >
                <item.icon size={22} strokeWidth={activeTab === item.id && !activePlaylistId ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sections */}
        <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-4 pb-2">
            <Library size={22} className="text-[#b3b3b3]" />
            <span className="font-bold text-sm text-[#b3b3b3]">Secciones</span>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
            {sectionItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm ${
                  activeTab === item.id && !activePlaylistId
                    ? 'bg-[#282828] text-white font-semibold'
                    : 'text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                  activeTab === item.id && !activePlaylistId
                    ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                    : 'bg-[#282828]'
                }`}>
                  <item.icon size={18} className={activeTab === item.id && !activePlaylistId ? 'text-black' : 'text-[#b3b3b3]'} />
                </div>
                <span>{item.label}</span>
              </button>
            ))}

            {/* Playlists section */}
            {(playlists.length > 0 || onCreatePlaylist) && (
              <>
                <div className="flex items-center justify-between px-3 pt-4 pb-1">
                  <span className="text-xs font-bold text-[#6a6a6a] uppercase tracking-wider">Mis Playlists</span>
                  {onCreatePlaylist && (
                    <button
                      onClick={onCreatePlaylist}
                      className="p-1 hover:bg-white/10 rounded-full transition text-[#b3b3b3] hover:text-white"
                      title="Crear playlist"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
                {playlists.map(pl => (
                  <button
                    key={pl.id}
                    onClick={() => { onSelectPlaylist?.(pl.id); setIsOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm ${
                      activePlaylistId === pl.id
                        ? 'bg-[#282828] text-white font-semibold'
                        : 'text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                      activePlaylistId === pl.id
                        ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                        : 'bg-[#282828]'
                    }`}>
                      <ListMusic size={18} className={activePlaylistId === pl.id ? 'text-black' : 'text-[#b3b3b3]'} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="truncate">{pl.nombre}</p>
                      <p className="text-[10px] text-[#6a6a6a]">{pl._itemCount || 0} canciones</p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* User */}
        <div className="bg-[#121212] rounded-lg px-4 py-3">
          {!loading && user && profile ? (
            <div className="flex items-center gap-3">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black">
                  {profile.nombre.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{profile.nombre}</p>
                {profile.spotify_connected && (
                  <p className="text-[10px] text-green-400">Spotify conectado</p>
                )}
              </div>
              <button
                onClick={() => { setActiveTab('perfil'); setIsOpen(false); }}
                className="p-1.5 hover:bg-white/10 rounded-full text-[#b3b3b3] hover:text-white transition"
              >
                <Settings size={16} />
              </button>
            </div>
          ) : !loading && !user ? (
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center gap-3 px-1 py-1 rounded-md hover:bg-white/5 transition"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <LogIn size={16} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-white">Iniciar sesion</p>
                <p className="text-[10px] text-[#6a6a6a]">Google</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#282828] animate-pulse" />
              <div className="flex-1">
                <div className="h-3 w-20 bg-[#282828] rounded animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
