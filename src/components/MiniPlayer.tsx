'use client';

import { useState } from 'react';
import { Play, Pause, X, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import type { Contenido } from '@/types/content';

interface MiniPlayerProps {
  track: Contenido | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}

function extraerYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const plataformaIcono: Record<string, string> = {
  spotify: '🟢',
  youtube: '🔴',
  apple_music: '🍎',
};

export default function MiniPlayer({ track, isPlaying, onTogglePlay, onClose }: MiniPlayerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!track) return null;

  const youtubeId = extraerYouTubeId(track.url);
  const isYoutube = track.plataforma === 'youtube' && youtubeId;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-gray-800 border-t border-orange-500 z-50 transition-all ${expanded ? 'h-80' : ''}`}>
      {/* Video embebido (expandido) */}
      {expanded && isYoutube && (
        <div className="w-full h-56 bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={track.titulo}
          />
        </div>
      )}

      {/* Barra del player */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded bg-black/20 flex items-center justify-center text-lg flex-shrink-0">
            {track.thumbnail ? (
              <img src={track.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              plataformaIcono[track.plataforma] || '🎵'
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{track.titulo}</p>
            <p className="text-xs text-white/70 truncate">{track.artista}</p>
          </div>
        </div>

        {/* Puntuación */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded text-xs font-bold text-orange-400">
          {track.evaluacion.puntuacionTotal}/100
        </div>

        {/* Expandir/contraer (solo YouTube) */}
        {isYoutube && (
          <button onClick={() => setExpanded(!expanded)} className="p-2 hover:bg-white/10 rounded-full transition">
            {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        )}

        {/* Play - para YouTube expande, para otros abre link */}
        <button
          onClick={() => {
            if (isYoutube) {
              setExpanded(true);
            } else {
              window.open(track.url, '_blank');
            }
            onTogglePlay();
          }}
          className="p-2 bg-orange-500 hover:bg-orange-600 rounded-full transition"
        >
          {isPlaying && expanded ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
        </button>

        {/* Abrir en plataforma */}
        <a
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-white/10 rounded-full transition"
          title={`Abrir en ${track.plataforma}`}
        >
          <ExternalLink size={16} />
        </a>

        {/* Cerrar */}
        <button onClick={() => { setExpanded(false); onClose(); }} className="p-2 hover:bg-white/10 rounded transition">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
