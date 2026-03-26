'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronDown, SkipBack, SkipForward, Play, Pause, Shuffle, Repeat,
  ListPlus, ListMusic, Share2, Video, VideoOff, Heart, ExternalLink, Loader2,
  Speaker
} from 'lucide-react';
import type { Contenido } from '@/types/content';
import { obtenerPlaylists, agregarAPlaylist, crearPlaylist } from '@/lib/database';
import type { Playlist } from '@/types/content';

interface PlaylistContext {
  nombre: string;
  items: Contenido[];
  currentIndex: number;
}

interface SyncedLine {
  time: number; // seconds
  text: string;
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
  showVideo: boolean;
  onToggleVideo: () => void;
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

// Parse synced lyrics format: [mm:ss.xx] text
function parseSyncedLyrics(text: string): SyncedLine[] {
  const lines: SyncedLine[] = [];
  for (const line of text.split('\n')) {
    const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/);
    if (match) {
      const mins = parseInt(match[1]);
      const secs = parseInt(match[2]);
      const ms = parseInt(match[3]);
      const time = mins * 60 + secs + ms / (match[3].length === 3 ? 1000 : 100);
      lines.push({ time, text: match[4] });
    }
  }
  return lines;
}

export default function FullPlayer({
  track, isPlaying, isOpen, onClose, onTogglePlay,
  onNext, onPrevious, playlistContext,
  playerRef, currentTime, duration, onSeek,
  isLiked, onLike, showVideo, onToggleVideo,
}: FullPlayerProps) {
  const [showQueue, setShowQueue] = useState(false);
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isDragging, setIsDragging] = useState(false);

  // Lyrics state
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsRaw, setLyricsRaw] = useState<string | null>(null);
  const [lyricsSynced, setLyricsSynced] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [lyricsCachedFor, setLyricsCachedFor] = useState<string | null>(null);

  const progressRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const youtubeId = extraerYouTubeId(track.url);
  const isYoutube = track.plataforma === 'youtube' && youtubeId;

  const hasPlaylist = playlistContext && playlistContext.items.length > 1;
  const canPrevious = hasPlaylist && playlistContext.currentIndex > 0;
  const canNext = hasPlaylist && playlistContext.currentIndex < playlistContext.items.length - 1;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Auto-fetch lyrics when track changes and player opens
  useEffect(() => {
    if (!isOpen) return;
    if (lyricsCachedFor === track.id) return;

    let cancelled = false;

    const fetchLyrics = async () => {
      setLyricsLoading(true);
      setLyricsRaw(null);
      setLyricsSynced(false);
      setLyricsError(null);

      try {
        const res = await fetch('/api/letras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo: track.titulo, artista: track.artista }),
        });

        const data = await res.json();

        if (!cancelled) {
          if (data.encontrada && data.letras) {
            setLyricsRaw(data.letras);
            setLyricsSynced(!!data.sincronizada);
          } else {
            setLyricsError('Letra no disponible');
          }
          setLyricsCachedFor(track.id);
        }
      } catch {
        if (!cancelled) setLyricsError('Error de conexion');
      } finally {
        if (!cancelled) setLyricsLoading(false);
      }
    };

    fetchLyrics();
    return () => { cancelled = true; };
  }, [isOpen, track.id, track.titulo, track.artista, lyricsCachedFor]);

  // Parse lyrics - synced or plain
  const syncedLines = useMemo(() => {
    if (!lyricsRaw || !lyricsSynced) return [];
    return parseSyncedLyrics(lyricsRaw);
  }, [lyricsRaw, lyricsSynced]);

  const plainLines = useMemo(() => {
    if (!lyricsRaw || lyricsSynced) return [];
    return lyricsRaw.split('\n');
  }, [lyricsRaw, lyricsSynced]);

  // Current synced lyric index (based on real timestamps)
  const currentSyncedIndex = useMemo(() => {
    if (!syncedLines.length) return -1;
    let idx = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      if (syncedLines[i].time <= currentTime) idx = i;
      else break;
    }
    return idx;
  }, [syncedLines, currentTime]);

  // Current plain lyric index (based on time proportion)
  const currentPlainIndex = useMemo(() => {
    if (!plainLines.length || !duration) return -1;
    const proportion = currentTime / duration;
    const nonEmpty = plainLines.map((l, i) => ({ l, i })).filter(x => x.l.trim().length > 0);
    if (!nonEmpty.length) return -1;
    const target = Math.min(Math.floor(proportion * nonEmpty.length), nonEmpty.length - 1);
    return nonEmpty[target]?.i ?? -1;
  }, [plainLines, currentTime, duration]);

  // Unified current line
  const currentLyricLine = useMemo(() => {
    if (lyricsSynced && syncedLines.length > 0) {
      if (currentSyncedIndex >= 0) {
        const line = syncedLines[currentSyncedIndex].text.trim();
        return line || null;
      }
      return null;
    }
    if (plainLines.length > 0 && currentPlainIndex >= 0) {
      const line = plainLines[currentPlainIndex]?.trim();
      return line || null;
    }
    return null;
  }, [lyricsSynced, syncedLines, currentSyncedIndex, plainLines, currentPlainIndex]);

  // Current index for highlighting in full lyrics view
  const currentLyricIndex = lyricsSynced ? currentSyncedIndex : currentPlainIndex;

  // All lines for full lyrics view
  const allLyricsForDisplay = useMemo(() => {
    if (lyricsSynced) return syncedLines.map(l => l.text);
    return plainLines;
  }, [lyricsSynced, syncedLines, plainLines]);

  // Auto-scroll full lyrics view
  useEffect(() => {
    if (!showFullLyrics || currentLyricIndex < 0 || !lyricsContainerRef.current) return;
    const container = lyricsContainerRef.current;
    const lineEl = container.querySelector(`[data-lyric-index="${currentLyricIndex}"]`) as HTMLElement | null;
    if (lineEl) {
      const containerRect = container.getBoundingClientRect();
      const lineRect = lineEl.getBoundingClientRect();
      const offset = lineRect.top - containerRect.top - containerRect.height / 3;
      container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' });
    }
  }, [currentLyricIndex, showFullLyrics]);

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
    onSeek(percent * duration);
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

  const handleAddToPlaylist = async (playlistId: string) => {
    await agregarAPlaylist(playlistId, track.id);
    setShowAddPlaylist(false);
  };

  const handleCreateAndAdd = async () => {
    const pl = await crearPlaylist('Mi Playlist', '');
    if (pl) await agregarAPlaylist(pl.id, track.id);
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

  // ===== FULL LYRICS VIEW =====
  if (showFullLyrics && lyricsRaw) {
    return (
      <div className="fixed inset-0 z-[80] bg-gradient-to-b from-[#1a1a2e] to-[#121212] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <button onClick={() => setShowFullLyrics(false)} className="p-2 hover:bg-white/10 rounded-full transition">
            <ChevronDown size={24} className="text-white" />
          </button>
          <div className="text-center flex-1">
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Letra</p>
            <p className="text-xs text-white font-bold truncate max-w-[200px] mx-auto">{track.titulo}</p>
          </div>
          <div className="w-10" />
        </div>

        <div ref={lyricsContainerRef} className="flex-1 overflow-y-auto px-6 pb-32">
          <div className="max-w-md mx-auto py-8">
            {allLyricsForDisplay.map((line, idx) => (
              <p
                key={idx}
                data-lyric-index={idx}
                className={`py-1.5 transition-all duration-500 text-lg leading-relaxed ${
                  line.trim().length === 0
                    ? 'h-6'
                    : idx === currentLyricIndex
                    ? 'text-amber-400 font-bold text-xl scale-[1.02] origin-left'
                    : Math.abs(idx - currentLyricIndex) <= 2
                    ? 'text-white/60'
                    : 'text-white/25'
                }`}
              >
                {line || '\u00A0'}
              </p>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 bg-[#181818] border-t border-[#282828] px-6 py-3">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{track.titulo}</p>
              <p className="text-xs text-[#b3b3b3] truncate">{track.artista}</p>
            </div>
            <button onClick={onTogglePlay} className="p-3 bg-white rounded-full hover:scale-105 active:scale-95 transition-transform">
              {isPlaying ? <Pause size={20} fill="black" className="text-black" /> : <Play size={20} fill="black" className="text-black ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN PLAYER VIEW =====
  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden">
      {/* Background - thumbnail blur or gradient */}
      {track.thumbnail && (
        <div className="absolute inset-0 z-0">
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover scale-110 blur-3xl opacity-30" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}
      {!track.thumbnail && <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#1a1a2e] to-[#121212]" />}

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 relative z-10">
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
        <div className="flex-1 overflow-y-auto px-4 pb-4 relative z-10">
          <h3 className="text-lg font-bold text-white mb-3">Cola de reproduccion</h3>
          {hasPlaylist ? (
            <div className="space-y-1">
              {playlistContext.items.map((item, idx) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg transition ${idx === playlistContext.currentIndex ? 'bg-amber-500/15' : 'hover:bg-white/5'}`}>
                  <span className={`text-sm font-bold w-6 text-right ${idx === playlistContext.currentIndex ? 'text-amber-400' : 'text-[#6a6a6a]'}`}>{idx + 1}</span>
                  <div className="w-10 h-10 rounded bg-[#282828] flex-shrink-0 overflow-hidden">
                    {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-10 h-10 object-cover" /> : <div className="w-10 h-10 flex items-center justify-center text-[#6a6a6a] text-xs">&#9835;</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${idx === playlistContext.currentIndex ? 'text-amber-400' : 'text-white'}`}>{item.titulo}</p>
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
        <div className="flex-1 flex flex-col items-center px-6 pb-2 overflow-y-auto relative z-10">
          {/* Video area - spacer for iframe overlay from MiniPlayer */}
          {isYoutube && showVideo && (
            <div className="w-full max-w-md aspect-video rounded-xl bg-black mb-2 flex-shrink-0 mt-2 relative">
              <button
                onClick={onToggleVideo}
                className="absolute top-3 right-3 p-2.5 bg-black/70 rounded-full hover:bg-black/90 transition z-[80]"
                title="Desactivar video"
              >
                <VideoOff size={18} className="text-white" />
              </button>
            </div>
          )}

          {/* Thumbnail when video is off */}
          {(!isYoutube || !showVideo) && (
            <div className="w-full max-w-md rounded-xl overflow-hidden bg-black mb-2 flex-shrink-0 mt-2 relative shadow-2xl shadow-black/50">
              <div className="w-full aspect-square max-h-[360px] bg-gradient-to-br from-[#282828] to-[#181818] flex items-center justify-center">
                {track.thumbnail ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="text-6xl text-[#3a3a3a]">&#9835;</div>}
              </div>
              {isYoutube && (
                <button onClick={onToggleVideo} className="absolute top-3 right-3 p-2.5 bg-black/70 rounded-full hover:bg-black/90 transition z-10 flex items-center gap-1.5" title="Activar video">
                  <Video size={18} className="text-white" />
                  <span className="text-white text-xs font-medium pr-1">Video</span>
                </button>
              )}
            </div>
          )}

          {/* === CURRENT LYRIC LINE === */}
          <button
            onClick={() => lyricsRaw && setShowFullLyrics(true)}
            className="w-full max-w-md min-h-[40px] flex items-center justify-center mb-1 flex-shrink-0 rounded-lg hover:bg-white/5 transition"
          >
            {lyricsLoading ? (
              <span className="flex items-center gap-2 text-white/40 text-xs">
                <Loader2 size={12} className="animate-spin" />
                Buscando letra...
              </span>
            ) : currentLyricLine ? (
              <p className="text-amber-400 text-sm font-medium text-center px-4 animate-pulse-subtle">
                &#9835; {currentLyricLine}
              </p>
            ) : lyricsError ? (
              <span className="text-white/20 text-xs">{lyricsError}</span>
            ) : null}
          </button>

          {/* Title & Artist */}
          <div className="w-full max-w-md mb-4 flex-shrink-0 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl md:text-2xl font-extrabold text-white truncate">{track.titulo}</h2>
              <p className="text-sm text-[#b3b3b3] mt-0.5">{track.artista}</p>
            </div>
            <button
              onClick={() => onLike(track.id)}
              className={`p-2 ml-3 transition flex-shrink-0 ${isLiked ? 'text-amber-400' : 'text-[#b3b3b3] hover:text-white'}`}
            >
              <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
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
                  <div className="absolute inset-0 bg-white/20 rounded-full" />
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full ${isDragging ? 'bg-amber-400' : 'bg-white group-hover:bg-amber-400'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div
                  className={`absolute -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'} transition-all`}
                  style={{ left: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-white/40 mt-0.5 px-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* ===== MAIN CONTROLS ===== */}
          <div className="flex items-center justify-center gap-6 md:gap-8 mb-6 w-full max-w-md">
            <button onClick={() => setShuffle(!shuffle)} className={`p-2 transition ${shuffle ? 'text-amber-400' : 'text-white/60 hover:text-white'}`}>
              <Shuffle size={20} />
            </button>
            <button onClick={onPrevious} disabled={!canPrevious} className={`p-2 transition ${canPrevious ? 'text-white hover:scale-105' : 'text-white/20 cursor-not-allowed'}`}>
              <SkipBack size={28} fill="currentColor" />
            </button>
            <button onClick={onTogglePlay} className="p-4 bg-white rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg">
              {isPlaying ? <Pause size={28} fill="black" className="text-black" /> : <Play size={28} fill="black" className="text-black ml-1" />}
            </button>
            <button onClick={onNext} disabled={!canNext} className={`p-2 transition ${canNext ? 'text-white hover:scale-105' : 'text-white/20 cursor-not-allowed'}`}>
              <SkipForward size={28} fill="currentColor" />
            </button>
            <button onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')} className={`p-2 transition relative ${repeatMode !== 'off' ? 'text-amber-400' : 'text-white/60 hover:text-white'}`}>
              <Repeat size={20} />
              {repeatMode === 'one' && <span className="absolute -top-0.5 -right-0.5 text-[8px] font-black text-amber-400">1</span>}
            </button>
          </div>

          {/* ===== BOTTOM ACTIONS ===== */}
          <div className="flex items-center justify-between w-full max-w-md px-2">
            <div className="flex items-center gap-4">
              <button className="p-2 text-white/50 hover:text-white transition" title="Dispositivos">
                <Speaker size={18} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={() => setShowAddPlaylist(!showAddPlaylist)} className={`p-2 transition ${showAddPlaylist ? 'text-amber-400' : 'text-white/50 hover:text-white'}`} title="Agregar a playlist">
                  <ListPlus size={18} />
                </button>
                {showAddPlaylist && (
                  <div className="absolute bottom-10 right-0 w-56 bg-[#282828] rounded-lg shadow-2xl py-2 border border-[#3a3a3a] max-h-60 overflow-y-auto z-[90]">
                    <p className="text-[10px] text-[#6a6a6a] uppercase tracking-wider px-3 py-1 font-bold">Agregar a playlist</p>
                    <button onClick={handleCreateAndAdd} className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/10 transition flex items-center gap-2">
                      <ListPlus size={14} className="text-amber-400" /> Nueva playlist
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    {playlists.map(pl => (
                      <button key={pl.id} onClick={() => handleAddToPlaylist(pl.id)} className="w-full text-left px-3 py-2 text-sm text-[#b3b3b3] hover:text-white hover:bg-white/10 transition truncate">{pl.nombre}</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setShowQueue(true)} className="p-2 text-white/50 hover:text-white transition" title="Cola">
                <ListMusic size={18} />
              </button>
              <button onClick={handleShare} className="p-2 text-white/50 hover:text-white transition" title="Compartir">
                <Share2 size={18} />
              </button>
              <a href={track.url} target="_blank" rel="noopener noreferrer" className="p-2 text-white/50 hover:text-white transition" title="Abrir en YouTube">
                <ExternalLink size={18} />
              </a>
            </div>
          </div>

          <div className="mt-4 px-3 py-1 bg-amber-500/15 rounded-full text-xs font-bold text-amber-400">
            Puntuacion teologica: {track.evaluacion.puntuacionTotal}/100
          </div>
        </div>
      )}
    </div>
  );
}
