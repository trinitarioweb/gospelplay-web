'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, SkipForward, Play, Pause, Video, VideoOff, Heart } from 'lucide-react';
import type { Contenido } from '@/types/content';
import FullPlayer from './FullPlayer';
import MarqueeText from './MarqueeText';

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
  const [showVideo, setShowVideo] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [actuallyPlaying, setActuallyPlaying] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [showVideoInFull, setShowVideoInFull] = useState(true);
  const [hideVideoForQueue, setHideVideoForQueue] = useState(false);
  const [playerError, setPlayerError] = useState(false);

  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevTrackId = useRef<string | null>(null);
  const containerRef = useRef<string>(`yt-player-${Date.now()}`);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const youtubeId = track ? extraerYouTubeId(track.url) : null;
  const isYoutube = track?.plataforma === 'youtube' && youtubeId;

  const hasPlaylist = playlistContext && playlistContext.items.length > 1;
  const canNext = hasPlaylist && playlistContext.currentIndex < playlistContext.items.length - 1;
  const canNextRef = useRef(canNext);
  canNextRef.current = canNext;

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
    setPlayerError(false);

    const createPlayer = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      setPlayerReady(false);
      setCurrentTime(0);
      setDuration(0);

      const container = document.getElementById(containerRef.current);
      if (!container) { setTimeout(createPlayer, 200); return; }

      // Timeout: if player doesn't become ready in 15s, mark as error and skip
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => {
        setPlayerError(true);
        if (canNextRef.current && onNextRef.current) setTimeout(() => onNextRef.current?.(), 1500);
      }, 15000);

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: youtubeId,
          playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3, disablekb: 1, fs: 0, playsinline: 1 },
          events: {
            onReady: (event: { target: YTPlayer }) => {
              if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
              setPlayerReady(true);
              setPlayerError(false);
              setDuration(event.target.getDuration());
              event.target.playVideo();
              setActuallyPlaying(true);
            },
            onStateChange: (event: { data: number; target: YTPlayer }) => {
              if (event.data === window.YT.PlayerState.PLAYING) { setActuallyPlaying(true); setDuration(event.target.getDuration()); }
              else if (event.data === window.YT.PlayerState.PAUSED) { setActuallyPlaying(false); }
              else if (event.data === window.YT.PlayerState.ENDED) {
                setActuallyPlaying(false);
                if (canNextRef.current && onNextRef.current) onNextRef.current();
              }
            },
            onError: () => {
              if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
              setPlayerError(true);
              // Auto-skip to next track after a brief delay
              if (canNextRef.current && onNextRef.current) setTimeout(() => onNextRef.current?.(), 2000);
            },
          },
        });
      } catch { setTimeout(createPlayer, 500); }
    };

    if (window.YT && window.YT.Player) setTimeout(createPlayer, 100);
    else window.onYouTubeIframeAPIReady = () => setTimeout(createPlayer, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, youtubeId]);

  // Update time - always run interval when player exists, check playing inside
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (playerRef.current && playerReady) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current) {
          try {
            const t = playerRef.current.getCurrentTime();
            setCurrentTime(t);
          } catch {}
        }
      }, 300);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playerReady, actuallyPlaying]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (playerRef.current) try { playerRef.current.destroy(); } catch {}
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current || !playerReady) return;
    try { if (actuallyPlaying) playerRef.current.pauseVideo(); else playerRef.current.playVideo(); } catch {}
    onTogglePlay();
  }, [actuallyPlaying, playerReady, onTogglePlay]);

  const handleSeekFromFull = useCallback((time: number) => {
    if (playerRef.current && playerReady) { playerRef.current.seekTo(time, true); setCurrentTime(time); }
  }, [playerReady]);

  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Video visible logic - hide when queue is showing
  const videoVisible =
    !hideVideoForQueue && (
      (showFullPlayer && showVideoInFull) ||
      (!showFullPlayer && showVideo)
    );

  return (
    <>
      {/* ===== FULL PLAYER ===== */}
      <FullPlayer
        track={track}
        isPlaying={actuallyPlaying}
        isOpen={showFullPlayer}
        onClose={() => setShowFullPlayer(false)}
        onTogglePlay={handlePlayPause}
        onHideVideo={setHideVideoForQueue}
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
        onToggleVideo={() => {
          setShowVideoInFull(v => {
            // Sync mini player video state
            setShowVideo(!v);
            return !v;
          });
        }}
      />

      {/* ===== VIDEO CONTAINER (YouTube iframe) ===== */}
      {isYoutube && (
        <div
          className={`fixed transition-all duration-300 ease-in-out ${
            showFullPlayer && showVideoInFull
              ? 'z-[70] top-[56px] left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md rounded-xl overflow-hidden'
              : !showFullPlayer && showVideo
              ? 'z-40 bottom-[72px] left-0 right-0 bg-black'
              : 'pointer-events-none'
          }`}
          style={
            !videoVisible
              ? { position: 'fixed', left: '-9999px', top: '0px', width: '320px', height: '180px' }
              : undefined
          }
        >
          <div
            className="relative w-full"
            style={
              videoVisible
                ? showFullPlayer
                  ? { paddingBottom: '56.25%' }
                  : { paddingBottom: '36%', maxHeight: '280px' }
                : { width: '320px', height: '180px' }
            }
          >
            <div id={containerRef.current} className="absolute top-0 left-0 w-full h-full" style={{ minWidth: '320px', minHeight: '180px' }} />
            {/* Click blocker and overlays */}
            {videoVisible && (
              <>
                {/* Only show gradient overlays in full player to hide YouTube UI */}
                {showFullPlayer && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/60 to-transparent z-[5] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/50 to-transparent z-[5] pointer-events-none" />
                  </>
                )}
                {/* Tap mini video to expand */}
                {!showFullPlayer && (
                  <button
                    onClick={() => { setShowVideoInFull(true); setShowFullPlayer(true); }}
                    className="absolute inset-0 z-[6]"
                  />
                )}
                {showFullPlayer && <div className="absolute inset-0 z-[4]" />}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== SPOTIFY-STYLE BOTTOM BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Progress bar thin line */}
        <div className="w-full h-[2px] bg-[#3a3a3a]">
          <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Player bar */}
        <div className="bg-[#181818] border-t border-[#282828]">
          <div className="max-w-screen-xl mx-auto px-3 py-2 flex items-center gap-3">

            {/* Left: Track info - tappable to expand (takes most space like Spotify) */}
            <button
              onClick={() => setShowFullPlayer(true)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left"
            >
              <div className="w-11 h-11 rounded bg-[#282828] flex-shrink-0 overflow-hidden">
                {track.thumbnail ? (
                  <img src={track.thumbnail} alt="" className="w-11 h-11 object-cover" />
                ) : (
                  <div className="w-11 h-11 flex items-center justify-center text-[#6a6a6a]">&#9835;</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <MarqueeText text={track.titulo} className="font-bold text-sm text-white" />
                <p className="text-xs text-[#b3b3b3] truncate">{track.artista}</p>
              </div>
            </button>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Video toggle */}
              {isYoutube && (
                <button
                  onClick={() => {
                    const next = !showVideo;
                    setShowVideo(next);
                    setShowVideoInFull(next);
                  }}
                  className={`p-2.5 rounded-full transition ${showVideo ? 'text-amber-400' : 'text-[#6a6a6a]'}`}
                >
                  {showVideo ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
              )}

              {/* Like */}
              {onLike && (
                <button
                  onClick={() => onLike(track.id)}
                  className={`p-2.5 transition ${isLiked ? 'text-amber-400' : 'text-[#6a6a6a]'}`}
                >
                  <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
              )}

              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="p-2 ml-1"
              >
                {actuallyPlaying ? (
                  <Pause size={24} fill="white" className="text-white" />
                ) : (
                  <Play size={24} fill="white" className="text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
