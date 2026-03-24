'use client';

import { Play, Pause, X, ExternalLink } from 'lucide-react';
import type { Contenido } from '@/types/content';

interface MiniPlayerProps {
  track: Contenido | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}

const plataformaIcono: Record<string, string> = {
  spotify: '🟢',
  youtube: '🔴',
  apple_music: '🍎',
};

export default function MiniPlayer({ track, isPlaying, onTogglePlay, onClose }: MiniPlayerProps) {
  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-3 flex items-center gap-3 border-t border-orange-500 z-50">
      {/* Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded bg-black/20 flex items-center justify-center text-lg flex-shrink-0">
          {plataformaIcono[track.plataforma] || '🎵'}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{track.titulo}</p>
          <p className="text-xs text-white/70 truncate">{track.artista}</p>
        </div>
      </div>

      {/* Puntuación */}
      <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/20 rounded text-xs font-bold">
        ⭐ {track.evaluacion.puntuacionTotal}/100
      </div>

      {/* Abrir en plataforma */}
      <a
        href={track.url}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-white/20 rounded-full transition"
        title={`Abrir en ${track.plataforma}`}
      >
        <ExternalLink size={16} />
      </a>

      {/* Play/Pause */}
      <button onClick={onTogglePlay} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition">
        {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
      </button>

      {/* Cerrar */}
      <button onClick={onClose} className="p-2 hover:bg-white/20 rounded transition">
        <X size={18} />
      </button>
    </div>
  );
}
