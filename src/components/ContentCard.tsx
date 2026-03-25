'use client';

import { useState, useEffect, useRef } from 'react';
import { Heart, Play, ExternalLink, ListPlus, Plus, Check } from 'lucide-react';
import type { Contenido, Playlist } from '@/types/content';
import { obtenerPlaylists, agregarAPlaylist, crearPlaylist } from '@/lib/database';

interface ContentCardProps {
  contenido: Contenido;
  onPlay: (contenido: Contenido) => void;
  onLike: (id: string) => void;
  isLiked: boolean;
  compact?: boolean;
  onPlaylistsChanged?: () => void;
}

const plataformaLabel: Record<string, { text: string; color: string }> = {
  spotify: { text: 'Spotify', color: 'bg-green-600' },
  youtube: { text: 'YouTube', color: 'bg-red-600' },
  apple_music: { text: 'Apple', color: 'bg-pink-600' },
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-amber-500/20 text-amber-400' : score >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>
      {score}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const info = plataformaLabel[platform] || { text: platform, color: 'bg-gray-600' };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${info.color} text-white`}>
      {info.text}
    </span>
  );
}

function PlaylistDropdown({ contenidoId, onClose, onPlaylistsChanged }: { contenidoId: string; onClose: () => void; onPlaylistsChanged?: () => void }) {
  const [playlists, setPlaylists] = useState<(Playlist & { _itemCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    obtenerPlaylists().then(p => { setPlaylists(p as (Playlist & { _itemCount?: number })[]); setLoading(false); });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAdd = async (playlistId: string) => {
    const ok = await agregarAPlaylist(playlistId, contenidoId);
    if (ok) {
      setAddedTo(prev => new Set(prev).add(playlistId));
      onPlaylistsChanged?.();
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const pl = await crearPlaylist(newName.trim(), '');
    if (pl) {
      await agregarAPlaylist(pl.id, contenidoId);
      setAddedTo(prev => new Set(prev).add(pl.id));
      setPlaylists(prev => [{ ...pl, _itemCount: 1 }, ...prev]);
      setCreatingNew(false);
      setNewName('');
      onPlaylistsChanged?.();
    }
  };

  return (
    <div ref={dropdownRef} className="absolute z-50 right-0 top-full mt-1 w-56 bg-[#282828] rounded-lg shadow-xl shadow-black/50 border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="px-3 py-2 border-b border-white/10">
        <p className="text-xs font-bold text-white">Agregar a playlist</p>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {loading ? (
          <p className="px-3 py-3 text-xs text-[#6a6a6a] text-center">Cargando...</p>
        ) : playlists.length === 0 && !creatingNew ? (
          <p className="px-3 py-3 text-xs text-[#6a6a6a] text-center">No tienes playlists</p>
        ) : (
          playlists.map(pl => (
            <button
              key={pl.id}
              onClick={() => handleAdd(pl.id)}
              disabled={addedTo.has(pl.id)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded bg-[#3a3a3a] flex items-center justify-center flex-shrink-0">
                {addedTo.has(pl.id) ? (
                  <Check size={14} className="text-amber-400" />
                ) : (
                  <ListPlus size={14} className="text-[#b3b3b3]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{pl.nombre}</p>
                <p className="text-[10px] text-[#6a6a6a]">{(pl as Playlist & { _itemCount?: number })._itemCount || 0} canciones</p>
              </div>
            </button>
          ))
        )}
      </div>

      {creatingNew ? (
        <div className="px-3 py-2 border-t border-white/10">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreatingNew(false); }}
            placeholder="Nombre de la playlist"
            className="w-full px-2 py-1.5 bg-[#3a3a3a] rounded text-sm text-white placeholder-[#6a6a6a] focus:outline-none focus:ring-1 focus:ring-amber-500 mb-1.5"
            autoFocus
          />
          <div className="flex gap-1.5">
            <button onClick={handleCreate} className="flex-1 py-1 bg-amber-500 hover:bg-amber-400 rounded text-xs font-bold text-black transition-colors">Crear</button>
            <button onClick={() => setCreatingNew(false)} className="flex-1 py-1 bg-white/10 hover:bg-white/15 rounded text-xs text-white transition-colors">Cancelar</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreatingNew(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 border-t border-white/10 hover:bg-white/10 transition-colors"
        >
          <Plus size={16} className="text-amber-400" />
          <span className="text-sm text-white font-medium">Crear nueva playlist</span>
        </button>
      )}
    </div>
  );
}

export default function ContentCard({ contenido, onPlay, onLike, isLiked, compact = false, onPlaylistsChanged }: ContentCardProps) {
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  // Compact row variant (for search results, lists, trending)
  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-md hover:bg-[#282828] transition-colors group cursor-pointer"
        onClick={() => onPlay(contenido)}
      >
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-md bg-[#282828] flex-shrink-0 overflow-hidden">
          {contenido.thumbnail ? (
            <img src={contenido.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#282828] to-[#3a3a3a] flex items-center justify-center text-[#6a6a6a] text-lg">
              {contenido.clasificacion.tipo === 'musica' ? '♪' : contenido.clasificacion.tipo === 'predicacion' ? '🎤' : '📖'}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={16} fill="white" className="text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{contenido.titulo}</p>
          <div className="flex items-center gap-2 text-xs text-[#b3b3b3]">
            <span className="truncate">{contenido.artista}</span>
            <span className="flex-shrink-0">
              <PlatformBadge platform={contenido.plataforma} />
            </span>
          </div>
        </div>

        {/* Score */}
        <ScoreBadge score={contenido.evaluacion.puntuacionTotal} />

        {/* Add to playlist */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowPlaylistMenu(!showPlaylistMenu); }}
            className="p-1.5 rounded-full hover:bg-white/10 transition opacity-0 group-hover:opacity-100"
          >
            <ListPlus size={16} className="text-[#b3b3b3]" />
          </button>
          {showPlaylistMenu && (
            <PlaylistDropdown contenidoId={contenido.id} onClose={() => setShowPlaylistMenu(false)} onPlaylistsChanged={onPlaylistsChanged} />
          )}
        </div>

        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); onLike(contenido.id); }}
          className="p-1.5 rounded-full hover:bg-white/10 transition opacity-0 group-hover:opacity-100"
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'text-amber-400' : 'text-[#b3b3b3]'} />
        </button>

        {/* Duration */}
        <span className="text-xs text-[#6a6a6a] w-10 text-right flex-shrink-0">{contenido.duracion}</span>
      </div>
    );
  }

  // Card variant (Spotify-style vertical card with art on top)
  return (
    <div className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors duration-300 group cursor-pointer relative">
      {/* Thumbnail */}
      <div className="relative mb-4">
        <div className="aspect-square rounded-md overflow-hidden bg-[#282828] shadow-lg shadow-black/40">
          {contenido.thumbnail ? (
            <img src={contenido.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#282828] to-[#3e3e3e] flex items-center justify-center">
              <span className="text-5xl text-[#535353]">
                {contenido.clasificacion.tipo === 'musica' ? '♪' : contenido.clasificacion.tipo === 'predicacion' ? '🎤' : '📖'}
              </span>
            </div>
          )}
        </div>

        {/* Play button - appears on hover */}
        <button
          onClick={() => onPlay(contenido)}
          className="card-play-btn absolute bottom-2 right-2 w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 hover:scale-105 flex items-center justify-center shadow-xl shadow-black/50 transition-all"
        >
          <Play size={22} fill="black" className="text-black ml-0.5" />
        </button>
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm text-white line-clamp-1 mb-1">{contenido.titulo}</h3>

      {/* Artist */}
      <p className="text-xs text-[#b3b3b3] line-clamp-1 mb-2">{contenido.artista}</p>

      {/* Badges row: platform + score */}
      <div className="flex items-center gap-1.5">
        <PlatformBadge platform={contenido.plataforma} />
        <ScoreBadge score={contenido.evaluacion.puntuacionTotal} />
      </div>

      {/* Hover actions (playlist + like + external link) */}
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowPlaylistMenu(!showPlaylistMenu); }}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition"
          >
            <ListPlus size={14} className="text-white" />
          </button>
          {showPlaylistMenu && (
            <PlaylistDropdown contenidoId={contenido.id} onClose={() => setShowPlaylistMenu(false)} onPlaylistsChanged={onPlaylistsChanged} />
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onLike(contenido.id); }}
          className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition"
        >
          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'text-amber-400' : 'text-white'} />
        </button>
        <a
          href={contenido.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition"
        >
          <ExternalLink size={14} className="text-white" />
        </a>
      </div>
    </div>
  );
}
