'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, ChevronUp, Minimize2 } from 'lucide-react';
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
    <div className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300">
      {/* YouTube embed */}
      {expanded && isYoutube && (
        <div className="bg-black relative w-full" style={{ paddingBottom: '56.25%', maxHeight: '400px' }}>
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

      {/* Spotify prompt */}
      {expanded && isSpotify && (
        <div className="bg-[#181818] border-t border-[#282828] p-6 text-center">
          <p className="text-[#b3b3b3] text-sm mb-3">Spotify no permite reproducir embebido</p>
          <a
            href={track.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-500 rounded-full font-bold text-sm transition"
          >
            Abrir en Spotify
          </a>
        </div>
      )}

      {/* Bottom bar */}
      <div className="bg-[#181818] border-t border-[#282828] px-4 py-2 flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-md bg-[#282828] flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
          {track.thumbnail ? (
            <img src={track.thumbnail} alt="" className="w-14 h-14 rounded-md object-cover" />
          ) : (
            <span className="text-[#6a6a6a]">{isYoutube ? '▶' : isSpotify ? '♪' : '♪'}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-white">{track.titulo}</p>
          <p className="text-xs text-[#b3b3b3] truncate">{track.artista}</p>
        </div>

        {/* Theological score */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-amber-500/15 rounded text-xs font-bold text-amber-400">
          {track.evaluacion.puntuacionTotal}/100
        </div>

        {/* Expand/collapse */}
        <button onClick={() => setExpanded(!expanded)} className="p-2 hover:bg-white/10 rounded-full transition text-[#b3b3b3] hover:text-white">
          {expanded ? <Minimize2 size={16} /> : <ChevronUp size={18} />}
        </button>

        {/* External link */}
        <a
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-white/10 rounded-full transition text-[#b3b3b3] hover:text-white"
          title={`Abrir en ${track.plataforma}`}
        >
          <ExternalLink size={16} />
        </a>

        {/* Close */}
        <button onClick={() => { setExpanded(false); onClose(); }} className="p-2 hover:bg-white/10 rounded-full transition text-[#b3b3b3] hover:text-white">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
