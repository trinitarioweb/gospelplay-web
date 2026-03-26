'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ExternalLink, SkipBack, SkipForward, ListMusic, Play, Pause, Video, VideoOff, Maximize2, Minimize2, ChevronUp } from 'lucide-react';
import type { Contenido } from '@/types/content';
import FullPlayer from './FullPlayer';

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
  isLiked?: boolean;
  onLike?: (id: string) => void;
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

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type ViewMode = 'audio' | 'mini' | 'full';

// Extend Window for YouTube API
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: Record<string, (event: { data: number; target: YTPlayer }) => void>;
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
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

export default function MiniPlayer({ track, isPlaying, onTogglePlay, onClose, playlistContext, onNext, onPrevious, isLiked, onLike }: MiniPlayerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [actuallyPlaying, setActuallyPlaying] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [showVideoInFull, setShowVideoInFull] = useState(true);

  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevTrackId = useRef<string | null>(null);
  const containerRef = useRef<string>(`yt-player-${Date.now()}`);

  const youtubeId = track ? extraerYouTubeId(track.url) : null;
  const isYoutube = track?.plataforma === 'youtube' && youtubeId;

  const hasPlaylist = playlistContext && playlistContext.items.length > 1;
  const canPrevious = hasPlaylist && playlistContext.currentIndex > 0;
  const canNext = hasPlaylist && playlistContext.currentIndex < playlistContext.items.length - 1;

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('yt-api-script')) return;

    const script = document.createElement('script');
    script.id = 'yt-api-script';
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  }, []);

  // Create/update player when track changes
  useEffect(() => {
    if (!track || !youtubeId || !isYoutube) return;
    if (track.id === prevTrackId.current && playerRef.current) return;

    prevTrackId.current = track.id;

    const createPlayer = () => {
      // Destroy old player
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }

      setPlayerReady(false);
      setCurrentTime(0);
      setDuration(0);

      // Ensure container exists
      const container = document.getElementById(containerRef.current);
      if (!container) {
        setTimeout(createPlayer, 200);
        return;
      }

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: youtubeId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
          },
          events: {
            onReady: (event: { target: YTPlayer }) => {
              setPlayerReady(true);
              setDuration(event.target.getDuration());
              event.target.playVideo();
              setActuallyPlaying(true);
            },
            onStateChange: (event: { data: number; target: YTPlayer }) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setActuallyPlaying(true);
                setDuration(event.target.getDuration());
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setActuallyPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setActuallyPlaying(false);
                if (canNext && onNext) onNext();
              }
            },
          },
        });
      } catch {
        setTimeout(createPlayer, 500);
      }
    };

    // Wait for YT API to load
    if (window.YT && window.YT.Player) {
      setTimeout(createPlayer, 100);
    } else {
      window.onYouTubeIframeAPIReady = () => {
        setTimeout(createPlayer, 100);
      };
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, youtubeId]);

  // Update time periodically
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (actuallyPlaying && playerRef.current) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current) {
          try {
            setCurrentTime(playerRef.current.getCurrentTime());
          } catch {}
        }
      }, 500);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [actuallyPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current || !playerReady) return;
    try {
      if (actuallyPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch {}
    onTogglePlay();
  }, [actuallyPlaying, playerReady, onTogglePlay]);

  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const seekToPosition = useCallback((clientX: number) => {
    if (!playerRef.current || !playerReady || !duration || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const seekTime = percent * duration;
    playerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);
  }, [playerReady, duration]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    seekToPosition(e.clientX);
  }, [seekToPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    seekToPosition(e.clientX);
  }, [seekToPosition]);

  // Handle drag and release globally
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      seekToPosition(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches[0]) seekToPosition(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, seekToPosition]);

  const handleSeekFromFull = useCallback((time: number) => {
    if (playerRef.current && playerReady) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  }, [playerReady]);

  const handlePlayPauseFromFull = useCallback(() => {
    handlePlayPause();
  }, [handlePlayPause]);

  const cycleViewMode = () => {
    if (viewMode === 'audio') setViewMode('mini');
    else if (viewMode === 'mini') setViewMode('full');
    else setViewMode('audio');
  };

  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* ===== FULL PLAYER ===== */}
      <FullPlayer
        track={track}
        isPlaying={actuallyPlaying}
        isOpen={showFullPlayer}
        onClose={() => setShowFullPlayer(false)}
        onTogglePlay={handlePlayPauseFromFull}
        onNext={onNext}
        onPrevious={onPrevious}
        playlistContext={playlistContext}
        playerRef={playerRef}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeekFromFull}
        isLiked={isLiked || false}
        onLike={onLike || (() => {})}
        showVideo={showVideoInFull}
        onToggleVideo={() => setShowVideoInFull(v => !v)}
      />

      {/* ===== VIDEO CONTAINER ===== */}
      {isYoutube && (
        <div
          className={`fixed transition-all duration-300 ease-in-out ${
            showFullPlayer && showVideoInFull
              ? 'z-[70] top-[56px] left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md rounded-xl overflow-hidden'
              : showFullPlayer && !showVideoInFull
              ? 'pointer-events-none'
              : viewMode === 'full'
              ? 'z-40 bottom-[88px] left-0 right-0 bg-black'
              : viewMode === 'mini'
              ? 'z-40 bottom-[96px] right-4 w-72 md:w-80 rounded-lg overflow-hidden shadow-2xl shadow-black/80 border border-[#282828]'
              : 'pointer-events-none'
          }`}
          style={
            (showFullPlayer && !showVideoInFull) || (!showFullPlayer && viewMode === 'audio')
              ? { position: 'fixed', left: '-9999px', top: '0px', width: '320px', height: '180px' }
              : undefined
          }
        >
          <div
            className={
              showFullPlayer && showVideoInFull
                ? 'relative w-full aspect-video'
                : viewMode === 'full' && !showFullPlayer
                ? 'relative w-full'
                : viewMode === 'mini' && !showFullPlayer
                ? 'relative w-full aspect-video'
                : 'relative'
            }
            style={
              viewMode === 'full' && !showFullPlayer
                ? { paddingBottom: '36%', maxHeight: '320px' }
                : (showFullPlayer && !showVideoInFull) || (!showFullPlayer && viewMode === 'audio')
                ? { width: '320px', height: '180px' }
                : undefined
            }
          >
            <div
              id={containerRef.current}
              className="absolute top-0 left-0 w-full h-full"
              style={{ minWidth: '320px', minHeight: '180px' }}
            />
          </div>

          {/* Mini mode close button */}
          {viewMode === 'mini' && !showFullPlayer && (
            <button
              onClick={() => setViewMode('audio')}
              className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80 transition"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* ===== BOTTOM PLAYER BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#181818] border-t border-[#282828]">
        {/* Progress bar - clickable and draggable */}
        {/* Invisible touch area (taller for easy touch) */}
        <div
          ref={progressBarRef}
          className="w-full cursor-pointer group relative select-none"
          style={{ touchAction: 'none' }}
          onClick={handleSeek}
          onMouseDown={handleMouseDown}
          onTouchStart={(e) => { e.preventDefault(); setIsDragging(true); if (e.touches[0]) seekToPosition(e.touches[0].clientX); }}
        >
          {/* Touch target area - invisible but tall */}
          <div className="h-6 relative flex items-end">
            {/* Visible bar */}
            <div className={`w-full relative ${isDragging ? 'h-2' : 'h-1 group-hover:h-2'} transition-all`}>
              {/* Background */}
              <div className="absolute inset-0 bg-[#3a3a3a] rounded-full" />
              {/* Fill */}
              <div
                className={`absolute top-0 left-0 h-full rounded-full ${isDragging ? 'bg-amber-400' : 'bg-amber-500 group-hover:bg-amber-400'} transition-colors`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Thumb */}
            <div
              className={`absolute bottom-0 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg ${isDragging ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'} transition-all`}
              style={{ left: `${progress}%`, marginBottom: '-4px' }}
            />
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-3 py-2 flex items-center gap-2 md:gap-4">

          {/* === Left: Track info (click to open full player) === */}
          <button
            onClick={() => setShowFullPlayer(true)}
            className="flex items-center gap-3 flex-1 min-w-0 max-w-[30%] md:max-w-[25%] text-left hover:bg-white/5 rounded-md p-1 -m-1 transition"
          >
            <div className="w-12 h-12 rounded-md bg-[#282828] flex-shrink-0 overflow-hidden">
              {track.thumbnail ? (
                <img src={track.thumbnail} alt="" className="w-12 h-12 rounded-md object-cover" />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center text-[#6a6a6a]">♪</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs md:text-sm truncate text-white">{track.titulo}</p>
              <p className="text-[10px] md:text-xs text-[#b3b3b3] truncate">{track.artista}</p>
            </div>
            <ChevronUp size={14} className="text-[#6a6a6a] flex-shrink-0 hidden md:block" />
          </button>

          {/* === Center: Controls === */}
          <div className="flex flex-col items-center gap-0.5 flex-1">
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
            <div className="flex items-center gap-3 md:gap-5">
              <button
                onClick={onPrevious}
                disabled={!canPrevious}
                className={`p-1 transition ${canPrevious ? 'text-[#b3b3b3] hover:text-white' : 'text-[#3a3a3a] cursor-not-allowed'}`}
              >
                <SkipBack size={20} fill={canPrevious ? 'currentColor' : '#3a3a3a'} />
              </button>

              <button
                onClick={handlePlayPause}
                className="p-2.5 bg-white rounded-full hover:scale-105 active:scale-95 transition-transform"
              >
                {actuallyPlaying ? (
                  <Pause size={18} fill="black" className="text-black" />
                ) : (
                  <Play size={18} fill="black" className="text-black ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                disabled={!canNext}
                className={`p-1 transition ${canNext ? 'text-[#b3b3b3] hover:text-white' : 'text-[#3a3a3a] cursor-not-allowed'}`}
              >
                <SkipForward size={20} fill={canNext ? 'currentColor' : '#3a3a3a'} />
              </button>
            </div>

            {/* Time display */}
            <div className="flex items-center gap-2 text-[10px] text-[#6a6a6a]">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* === Right: Extra controls === */}
          <div className="flex items-center gap-1 flex-1 justify-end max-w-[30%] md:max-w-[25%]">
            {/* Score */}
            <div className="hidden md:flex items-center px-2 py-1 bg-amber-500/15 rounded text-xs font-bold text-amber-400">
              {track.evaluacion.puntuacionTotal}/100
            </div>

            {/* Video mode toggle */}
            {isYoutube && (
              <button
                onClick={cycleViewMode}
                className={`p-2 rounded-full transition ${
                  viewMode === 'audio'
                    ? 'text-[#6a6a6a] hover:text-white hover:bg-white/10'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-white/10'
                }`}
                title={viewMode === 'audio' ? 'Solo audio' : viewMode === 'mini' ? 'Mini video' : 'Video completo'}
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

            {/* Mode label */}
            {isYoutube && (
              <span className={`hidden sm:inline text-[10px] font-medium uppercase tracking-wider ${
                viewMode === 'audio' ? 'text-[#6a6a6a]' : 'text-amber-400'
              }`}>
                {viewMode === 'audio' ? 'Audio' : viewMode === 'mini' ? 'Mini' : 'Video'}
              </span>
            )}

            {/* External link */}
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-white/10 rounded-full transition text-[#b3b3b3] hover:text-white"
            >
              <ExternalLink size={16} />
            </a>

            {/* Close */}
            <button
              onClick={() => {
                if (playerRef.current) {
                  try { playerRef.current.destroy(); } catch {}
                  playerRef.current = null;
                }
                prevTrackId.current = null;
                setViewMode('audio');
                onClose();
              }}
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
