'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, SkipBack, SkipForward, ListMusic, Play, Pause, Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react';
import type { Contenido } from '@/types/content';

interface PlaylistContext {
  nombre: string;
  items: Contenido[];
  currentIndex: number;
}

interface MiniPlayerProps {
  track: Contenido | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  playlistContext?: PlaylistContext | null;
  onNext?: () => void;
  onPrevious?: () => void;
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

type ViewMode = 'audio' | 'mini' | 'full';

export default function MiniPlayer({ track, isPlaying, onTogglePlay, onClose, playlistContext, onNext, onPrevious }: MiniPlayerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('audio');
  const prevTrackId = useRef<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // When track changes, keep current view mode (don't force expand)
  useEffect(() => {
    if (track && track.id !== prevTrackId.current) {
      prevTrackId.current = track.id;
    }
  }, [track]);

  if (!track) return null;

  const youtubeId = extraerYouTubeId(track.url);
  const isYoutube = track.plataforma === 'youtube' && youtubeId;
  const isSpotify = track.plataforma === 'spotify';

  const hasPlaylist = playlistContext && playlistContext.items.length > 1;
  const canPrevious = hasPlaylist && playlistContext.currentIndex > 0;
  const canNext = hasPlaylist && playlistContext.currentIndex < playlistContext.items.length - 1;

  const cycleViewMode = () => {
    if (viewMode === 'audio') setViewMode('mini');
    else if (viewMode === 'mini') setViewMode('full');
    else setViewMode('audio');
  };

  return (
    <>
      {/* YouTube iframe - ALWAYS rendered when playing YouTube, visibility changes based on mode */}
      {isYoutube && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            viewMode === 'full'
              ? 'bottom-[72px] left-0 right-0'
              : viewMode === 'mini'
              ? 'bottom-[80px] right-4 w-80 rounded-lg overflow-hidden shadow-2xl shadow-black/50'
              : 'w-0 h-0 overflow-hidden opacity-0 pointer-events-none bottom-0 left-0'
          }`}
        >
          {viewMode === 'full' ? (
            <div className="bg-black w-full" style={{ paddingBottom: '40%', maxHeight: '350px', position: 'relative' }}>
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&enablejsapi=1`}
                className="absolute top-0 left-0 w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title={track.titulo}
              />
            </div>
          ) : viewMode === 'mini' ? (
            <div className="bg-black aspect-video">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&enablejsapi=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title={track.titulo}
              />
            </div>
          ) : (
            // Audio-only: hidden iframe that still plays
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              width="1"
              height="1"
              allow="autoplay; encrypted-media"
              title={track.titulo}
            />
          )}
        </div>
      )}

      {/* Spotify prompt overlay */}
      {viewMode === 'full' && isSpotify && (
        <div className="fixed bottom-[72px] left-0 right-0 z-50 bg-[#181818] border-t border-[#282828] p-6 text-center">
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

      {/* ===== BOTTOM PLAYER BAR (siempre visible) ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#181818] border-t border-[#282828]">
        <div className="max-w-screen-xl mx-auto px-3 py-2 flex items-center gap-2 md:gap-4">

          {/* === Left: Track info === */}
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-[30%] md:max-w-[25%]">
            <div className="w-12 h-12 rounded-md bg-[#282828] flex-shrink-0 overflow-hidden">
              {track.thumbnail ? (
                <img src={track.thumbnail} alt="" className="w-12 h-12 rounded-md object-cover" />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center text-[#6a6a6a]">
                  {isYoutube ? '▶' : '♪'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs md:text-sm truncate text-white">{track.titulo}</p>
              <p className="text-[10px] md:text-xs text-[#b3b3b3] truncate">{track.artista}</p>
            </div>
          </div>

          {/* === Center: Controls === */}
          <div className="flex flex-col items-center gap-1 flex-1">
            {/* Playlist info */}
            {hasPlaylist && (
              <div className="flex items-center gap-1.5">
                <ListMusic size={10} className="text-amber-400" />
                <p className="text-[10px] text-amber-400 truncate">
                  {playlistContext.nombre} &middot; {playlistContext.currentIndex + 1} de {playlistContext.items.length}
                </p>
              </div>
            )}

            {/* Playback controls */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Previous */}
              <button
                onClick={onPrevious}
                disabled={!canPrevious}
                className={`p-1.5 rounded-full transition ${canPrevious ? 'hover:bg-white/10 text-[#b3b3b3] hover:text-white' : 'text-[#3a3a3a] cursor-not-allowed'}`}
              >
                <SkipBack size={18} fill={canPrevious ? '#b3b3b3' : '#3a3a3a'} />
              </button>

              {/* Play/Pause */}
              <button
                onClick={onTogglePlay}
                className="p-2 bg-white rounded-full hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause size={18} fill="black" className="text-black" />
                ) : (
                  <Play size={18} fill="black" className="text-black ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={onNext}
                disabled={!canNext}
                className={`p-1.5 rounded-full transition ${canNext ? 'hover:bg-white/10 text-[#b3b3b3] hover:text-white' : 'text-[#3a3a3a] cursor-not-allowed'}`}
              >
                <SkipForward size={18} fill={canNext ? '#b3b3b3' : '#3a3a3a'} />
              </button>
            </div>
          </div>

          {/* === Right: Extra controls === */}
          <div className="flex items-center gap-1 md:gap-2 flex-1 justify-end max-w-[30%] md:max-w-[25%]">
            {/* Score */}
            <div className="hidden md:flex items-center px-2 py-1 bg-amber-500/15 rounded text-xs font-bold text-amber-400">
              {track.evaluacion.puntuacionTotal}/100
            </div>

            {/* Video mode toggle (YouTube only) */}
            {isYoutube && (
              <button
                onClick={cycleViewMode}
                className="p-2 hover:bg-white/10 rounded-full transition text-[#b3b3b3] hover:text-white"
                title={viewMode === 'audio' ? 'Solo audio (video oculto)' : viewMode === 'mini' ? 'Mini video' : 'Video completo'}
              >
                {viewMode === 'audio' ? (
                  <VideoOff size={16} />
                ) : viewMode === 'mini' ? (
                  <Minimize2 size={16} />
                ) : (
                  <Maximize2 size={16} />
                )}
              </button>
            )}

            {/* View mode label */}
            {isYoutube && (
              <span className="hidden sm:inline text-[10px] text-[#6a6a6a] font-medium uppercase tracking-wider">
                {viewMode === 'audio' ? 'Audio' : viewMode === 'mini' ? 'Mini' : 'Video'}
              </span>
            )}

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
            <button
              onClick={() => { setViewMode('audio'); onClose(); }}
              className="p-2 hover:bg-white/10 rounded-full transition text-[#b3b3b3] hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
