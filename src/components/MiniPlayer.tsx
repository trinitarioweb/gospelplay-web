'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, ChevronUp, ChevronDown, Minimize2 } from 'lucide-react';
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
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function MiniPlayer({ track, isPlaying, onTogglePlay, onClose }: MiniPlayerProps) {
  const [expanded, setExpanded] = useState(true);
  const prevTrackId = useRef<string | null>(null);

  // Auto-expandir cuando cambia el track
  useEffect(() => {
    if (track && track.id !== prevTrackId.current) {
      setExpanded(true);
      prevTrackId.current = track.id;
    }
  }, [track]);

  if (!track) return null;

  const youtubeId = extraerYouTubeId(track.url);
  const isYoutube = track.plataforma === 'youtube' && youtubeId;
  const isSpotify = track.plataforma === 'spotify';

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-orange-500 z-50 transition-all duration-300 ${expanded && isYoutube ? '' : ''}`}>
      {/* Video de YouTube embebido */}
      {expanded && isYoutube && (
        <div className="relative w-full" style={{ paddingBottom: '56.25%', maxHeight: '400px' }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
            className="absolute top-0 left-0 w-full h-full"
            style={{ maxHeight: '400px' }}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={track.titulo}
          />
        </div>
      )}

      {/* Spotify: abrir directamente */}
      {expanded && isSpotify && (
        <div className="p-6 text-center">
          <p className="text-orange-300/60 text-sm mb-3">Spotify no permite reproducir embebido</p>
          <a
            href={track.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded-full font-bold text-sm transition"
          >
            Abrir en Spotify
          </a>
        </div>
      )}

      {/* Barra inferior del player */}
      <div className="px-4 py-2 flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded bg-black/20 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
          {track.thumbnail ? (
            <img src={track.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
          ) : (
            <span>{isYoutube ? '🔴' : isSpotify ? '🟢' : '🎵'}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{track.titulo}</p>
          <p className="text-xs text-white/70 truncate">{track.artista}</p>
        </div>

        {/* Puntuación */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded text-xs font-bold text-orange-400">
          {track.evaluacion.puntuacionTotal}/100
        </div>

        {/* Expandir/minimizar */}
        <button onClick={() => setExpanded(!expanded)} className="p-2 hover:bg-white/10 rounded-full transition">
          {expanded ? <Minimize2 size={16} /> : <ChevronUp size={18} />}
        </button>

        {/* Abrir en plataforma original */}
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
