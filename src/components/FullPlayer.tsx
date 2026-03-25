'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronDown, SkipBack, SkipForward, Play, Pause, Shuffle, Repeat,
  ListPlus, ListMusic, Share2, Video, VideoOff, Heart, ExternalLink, Loader2
} from 'lucide-react';
import type { Contenido } from '@/types/content';
import { obtenerPlaylists, agregarAPlaylist, crearPlaylist } from '@/lib/database';
import type { Playlist } from '@/types/content';

interface PlaylistContext {
  nombre: string;
  items: Contenido[];
  currentIndex: number;
}

interface FullPlayerProps {
  track: Contenido;
  isPlaying: boolean;
  isOpen: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  playlistContext?: PlaylistContext | null;
  playerRef: React.MutableRefObject<YTPlayer | null>;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isLiked: boolean;
  onLike: (id: string) => void;
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
  loadVideoById: (videoId: string) => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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

export default function FullPlayer({
  track, isPlaying, isOpen, onClose, onTogglePlay,
  onNext, onPrevious, playlistContext,
  playerRef, currentTime, duration, onSeek,
  isLiked, onLike,
}: FullPlayerProps) {
  const [showVideo, setShowVideo] = useState(true);
  const [showQueue, setShowQueue] = useState(false);
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isDragging, setIsDragging] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsText, setLyricsText] = useState<string | null>(null);
  const [lyricsFound, setLyricsFound] = useState(false);
  const [lyricsCachedFor, setLyricsCachedFor] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const youtubeId = extraerYouTubeId(track.url);
  const isYoutube = track.plataforma === 'youtube' && youtubeId;

  const hasPlaylist = playlistContext && playlistContext.items.length > 1;
  const canPrevious = hasPlaylist && playlistContext.currentIndex > 0;
  const canNext = hasPlaylist && playlistContext.currentIndex < playlistContext.items.length - 1;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Load playlists when add menu opens
  useEffect(() => {
    if (showAddPlaylist) {
      obtenerPlaylists().then(setPlaylists);
    }
  }, [showAddPlaylist]);

  const seekToPosition = useCallback((clientX: number) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const seekTime = percent * duration;
    onSeek(seekTime);
  }, [duration, onSeek]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => seekToPosition(e.clientX);
    const handleTouchMove = (e: TouchEvent) => { e.preventDefault(); if (e.touches[0]) seekToPosition(e.touches[0].clientX); };
    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, seekToPosition]);

  // Lyrics lines split for rendering
  const lyricsLines = useMemo(() => {
    if (!lyricsText) return [];
    return lyricsText.split('\n');
  }, [lyricsText]);

  // Estimate which lyric line is "current" based on time proportion
  const currentLyricIndex = useMemo(() => {
    if (!lyricsLines.length || !duration) return -1;
    const proportion = currentTime / duration;
    // Skip empty lines for index calculation
    const nonEmptyCount = lyricsLines.filter(l => l.trim().length > 0).length;
    if (nonEmptyCount === 0) return -1;
    const targetNonEmpty = Math.floor(proportion * nonEmptyCount);
    let nonEmptySeen = 0;
    for (let i = 0; i < lyricsLines.length; i++) {
      if (lyricsLines[i].trim().length > 0) {
        if (nonEmptySeen === targetNonEmpty) return i;
        nonEmptySeen++;
      }
    }
    return lyricsLines.length - 1;
  }, [lyricsLines, currentTime, duration]);

  // Auto-scroll lyrics
  useEffect(() => {
    if (!showLyrics || currentLyricIndex < 0 || !lyricsContainerRef.current) return;
    const container = lyricsContainerRef.current;
    const lineEl = container.querySelector(`[data-lyric-index="${currentLyricIndex}"]`) as HTMLElement | null;
    if (lineEl) {
      const containerRect = container.getBoundingClientRect();
      const lineRect = lineEl.getBoundingClientRect();
      const offset = lineRect.top - containerRect.top - containerRect.height / 3;
      container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' });
    }
  }, [currentLyricIndex, showLyrics]);

  const fetchLyrics = useCallback(async () => {
    // If we already have lyrics cached for this track, just toggle visibility
    if (lyricsCachedFor === track.id) {
      setShowLyrics(!showLyrics);
      return;
    }
    setShowLyrics(true);
    setLyricsLoading(true);
    try {
      const res = await fetch('/api/letras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: track.titulo, artista: track.artista }),
      });
      const data = await res.json();
      setLyricsText(data.letras || 'No se encontro la letra.');
      setLyricsFound(data.encontrada || false);
      setLyricsCachedFor(track.id);
    } catch {
      setLyricsText('Error al cargar la letra. Intenta de nuevo.');
      setLyricsFound(false);
    } finally {
      setLyricsLoading(false);
    }
  }, [track.id, track.titulo, track.artista, lyricsCachedFor, showLyrics]);

  const handleAddToPlaylist = async (playlistId: string) => {
    await agregarAPlaylist(playlistId, track.id);
    setShowAddPlaylist(false);
  };

  const handleCreateAndAdd = async () => {
    const pl = await crearPlaylist('Mi Playlist', '');
    if (pl) {
      await agregarAPlaylist(pl.id, track.id);
    }
    setShowAddPlaylist(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: track.titulo,
          text: `Escucha "${track.titulo}" por ${track.artista} en GospelPlay`,
          url: track.url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(track.url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#121212] flex flex-col overflow-hidden">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
          <ChevronDown size={24} className="text-white" />
        </button>
        <div className="text-center flex-1">
          {hasPlaylist && (
            <p className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
              Reproduciendo de
            </p>
          )}
          <p className="text-xs text-white font-bold truncate max-w-[200px] mx-auto">
            {hasPlaylist ? playlistContext.nombre : 'Reproduciendo'}
          </p>
        </div>
        <button onClick={() => setShowQueue(!showQueue)} className="p-2 hover:bg-white/10 rounded-full transition">
          <ListMusic size={20} className={showQueue ? 'text-amber-400' : 'text-white'} />
        </button>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      {showQueue ? (
        /* Queue view */
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <h3 className="text-lg font-bold text-white mb-3">Cola de reproduccion</h3>
          {hasPlaylist ? (
            <div className="space-y-1">
              {playlistContext.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition ${
                    idx === playlistContext.currentIndex
                      ? 'bg-amber-500/15'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <span className={`text-sm font-bold w-6 text-right ${
                    idx === playlistContext.currentIndex ? 'text-amber-400' : 'text-[#6a6a6a]'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded bg-[#282828] flex-shrink-0 overflow-hidden">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="w-10 h-10 object-cover" />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center text-[#6a6a6a] text-xs">♪</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${
                      idx === playlistContext.currentIndex ? 'text-amber-400' : 'text-white'
                    }`}>{item.titulo}</p>
                    <p className="text-xs text-[#b3b3b3] truncate">{item.artista}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#6a6a6a]">
              <ListMusic className="mx-auto mb-3" size={40} />
              <p className="text-sm">No hay cola de reproduccion</p>
            </div>
          )}
        </div>
      ) : (
        /* Player view */
        <div className="flex-1 flex flex-col items-center px-6 pb-2 overflow-y-auto">
          {/* Video / Thumbnail */}
          {!showLyrics && (
            <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden bg-black mb-4 shadow-2xl shadow-black/50 relative flex-shrink-0 mt-2">
              {isYoutube && showVideo ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <p className="text-[#6a6a6a] text-xs">Video reproduciendose</p>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#282828] to-[#181818] flex items-center justify-center">
                  {track.thumbnail ? (
                    <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-6xl text-[#3a3a3a]">♪</div>
                  )}
                </div>
              )}

              {/* Video toggle overlay */}
              {isYoutube && (
                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className="absolute top-3 right-3 p-2 bg-black/60 rounded-full hover:bg-black/80 transition"
                >
                  {showVideo ? <Video size={16} /> : <VideoOff size={16} />}
                </button>
              )}
            </div>
          )}

          {/* Letra button */}
          <button
            onClick={fetchLyrics}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition mb-3 flex-shrink-0 ${
              showLyrics
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-[#282828] text-[#b3b3b3] hover:text-white hover:bg-[#3a3a3a]'
            }`}
          >
            {lyricsLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                Buscando letra...
              </span>
            ) : (
              'Letra'
            )}
          </button>

          {/* Lyrics display */}
          {showLyrics && lyricsText && (
            <div
              ref={lyricsContainerRef}
              className="w-full max-w-md flex-1 overflow-y-auto rounded-xl bg-[#0a0a0a] p-4 mb-3 scrollbar-thin scrollbar-thumb-[#3a3a3a] scrollbar-track-transparent"
              style={{ maxHeight: '40vh' }}
            >
              {lyricsLines.map((line, idx) => (
                <p
                  key={idx}
                  data-lyric-index={idx}
                  className={`text-center py-0.5 transition-all duration-300 text-sm leading-relaxed ${
                    line.trim().length === 0
                      ? 'h-4'
                      : idx === currentLyricIndex
                      ? 'text-amber-400 font-bold text-base scale-105'
                      : Math.abs(idx - currentLyricIndex) <= 2
                      ? 'text-white/70'
                      : 'text-white/30'
                  }`}
                >
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
          )}

          {/* Title & Artist */}
          <div className="w-full max-w-md text-center mb-4 flex-shrink-0">
            <h2 className="text-xl md:text-2xl font-extrabold text-white truncate">{track.titulo}</h2>
            <p className="text-sm text-[#b3b3b3] mt-1">{track.artista}</p>
          </div>

          {/* ===== PROGRESS BAR ===== */}
          <div className="w-full max-w-md mb-2">
            <div
              ref={progressRef}
              className="w-full cursor-pointer group relative select-none"
              style={{ touchAction: 'none' }}
              onClick={(e) => seekToPosition(e.clientX)}
              onMouseDown={(e) => { setIsDragging(true); seekToPosition(e.clientX); }}
              onTouchStart={(e) => { e.preventDefault(); setIsDragging(true); if (e.touches[0]) seekToPosition(e.touches[0].clientX); }}
            >
              <div className="h-8 relative flex items-center">
                <div className={`w-full relative ${isDragging ? 'h-1.5' : 'h-1 group-hover:h-1.5'} transition-all`}>
                  <div className="absolute inset-0 bg-[#3a3a3a] rounded-full" />
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full ${isDragging ? 'bg-amber-400' : 'bg-amber-500 group-hover:bg-amber-400'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div
                  className={`absolute -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'} transition-all`}
                  style={{ left: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-[#6a6a6a] mt-0.5 px-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* ===== MAIN CONTROLS ===== */}
          <div className="flex items-center justify-center gap-6 md:gap-8 mb-4 w-full max-w-md">
            {/* Shuffle */}
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`p-2 transition ${shuffle ? 'text-amber-400' : 'text-[#b3b3b3] hover:text-white'}`}
            >
              <Shuffle size={20} />
            </button>

            {/* Previous */}
            <button
              onClick={onPrevious}
              disabled={!canPrevious}
              className={`p-2 transition ${canPrevious ? 'text-white hover:scale-105' : 'text-[#3a3a3a] cursor-not-allowed'}`}
            >
              <SkipBack size={28} fill="currentColor" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
              className="p-4 bg-white rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg"
            >
              {isPlaying ? (
                <Pause size={28} fill="black" className="text-black" />
              ) : (
                <Play size={28} fill="black" className="text-black ml-1" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              disabled={!canNext}
              className={`p-2 transition ${canNext ? 'text-white hover:scale-105' : 'text-[#3a3a3a] cursor-not-allowed'}`}
            >
              <SkipForward size={28} fill="currentColor" />
            </button>

            {/* Repeat */}
            <button
              onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
              className={`p-2 transition relative ${repeatMode !== 'off' ? 'text-amber-400' : 'text-[#b3b3b3] hover:text-white'}`}
            >
              <Repeat size={20} />
              {repeatMode === 'one' && (
                <span className="absolute -top-0.5 -right-0.5 text-[8px] font-black text-amber-400">1</span>
              )}
            </button>
          </div>

          {/* ===== BOTTOM ACTIONS ===== */}
          <div className="flex items-center justify-between w-full max-w-md px-2">
            {/* Left actions */}
            <div className="flex items-center gap-3">
              {/* Connect / Device */}
              <button className="p-2 text-[#b3b3b3] hover:text-white transition" title="Conectar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 16V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12" />
                  <rect x="6" y="16" width="12" height="6" rx="1" />
                </svg>
              </button>

              {/* Like */}
              <button
                onClick={() => onLike(track.id)}
                className={`p-2 transition ${isLiked ? 'text-amber-400' : 'text-[#b3b3b3] hover:text-white'}`}
              >
                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Add to playlist */}
              <div className="relative">
                <button
                  onClick={() => setShowAddPlaylist(!showAddPlaylist)}
                  className={`p-2 transition ${showAddPlaylist ? 'text-amber-400' : 'text-[#b3b3b3] hover:text-white'}`}
                  title="Agregar a playlist"
                >
                  <ListPlus size={18} />
                </button>

                {showAddPlaylist && (
                  <div className="absolute bottom-10 right-0 w-56 bg-[#282828] rounded-lg shadow-2xl py-2 border border-[#3a3a3a] max-h-60 overflow-y-auto">
                    <p className="text-[10px] text-[#6a6a6a] uppercase tracking-wider px-3 py-1 font-bold">Agregar a playlist</p>
                    <button
                      onClick={handleCreateAndAdd}
                      className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/10 transition flex items-center gap-2"
                    >
                      <ListPlus size={14} className="text-amber-400" /> Nueva playlist
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    {playlists.map(pl => (
                      <button
                        key={pl.id}
                        onClick={() => handleAddToPlaylist(pl.id)}
                        className="w-full text-left px-3 py-2 text-sm text-[#b3b3b3] hover:text-white hover:bg-white/10 transition truncate"
                      >
                        {pl.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Queue */}
              <button
                onClick={() => setShowQueue(true)}
                className="p-2 text-[#b3b3b3] hover:text-white transition"
                title="Cola"
              >
                <ListMusic size={18} />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-2 text-[#b3b3b3] hover:text-white transition"
                title="Compartir"
              >
                <Share2 size={18} />
              </button>

              {/* External */}
              <a
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-[#b3b3b3] hover:text-white transition"
                title="Abrir en YouTube"
              >
                <ExternalLink size={18} />
              </a>
            </div>
          </div>

          {/* Score badge */}
          <div className="mt-3 px-3 py-1 bg-amber-500/15 rounded-full text-xs font-bold text-amber-400">
            Puntuacion teologica: {track.evaluacion.puntuacionTotal}/100
          </div>
        </div>
      )}
    </div>
  );
}
