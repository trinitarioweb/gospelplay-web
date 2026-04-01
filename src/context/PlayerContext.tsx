'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Contenido } from '@/types/content';
import MiniPlayer from '@/components/MiniPlayer';

interface PlaylistContextData {
  nombre: string;
  items: Contenido[];
  currentIndex: number;
}

interface PlayerContextType {
  currentTrack: Contenido | null;
  isPlaying: boolean;
  playlistContext: PlaylistContextData | null;
  likedSongs: Set<string>;
  radioLoading: boolean;
  playTrack: (track: Contenido, allTracks?: Contenido[]) => void;
  playFromList: (nombre: string, items: Contenido[], startIndex: number) => void;
  startRadio: (artistName: string, trackName?: string) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  toggleLike: (id: string) => void;
  setIsPlaying: (v: boolean) => void;
  closePlayer: () => void;
}

const PlayerCtx = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Contenido | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [playlistCtx, setPlaylistCtx] = useState<PlaylistContextData | null>(null);
  const [radioLoading, setRadioLoading] = useState(false);

  const startRadio = useCallback(async (artistName: string, trackName?: string) => {
    setRadioLoading(true);
    try {
      const params = new URLSearchParams({ artist: artistName });
      if (trackName) params.set('track', trackName);
      const res = await fetch(`/api/radio?${params}`);
      if (!res.ok) throw new Error('Radio API error');
      const data = await res.json();
      if (data.tracks?.length > 0) {
        setPlaylistCtx({ nombre: data.nombre, items: data.tracks, currentIndex: 0 });
        setCurrentTrack(data.tracks[0]);
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Error starting radio:', e);
    } finally {
      setRadioLoading(false);
    }
  }, []);

  const playTrack = useCallback((track: Contenido, allTracks?: Contenido[]) => {
    setCurrentTrack(track);
    setIsPlaying(true);

    setPlaylistCtx(prev => {
      // If already in playlist with this track, just update index
      if (prev?.items.find(i => i.id === track.id)) {
        const idx = prev.items.findIndex(i => i.id === track.id);
        if (idx >= 0) return { ...prev, currentIndex: idx };
        return prev;
      }

      // Generate auto-queue from provided tracks
      const source = allTracks || [];
      const similar = source.filter(m =>
        m.id !== track.id && (
          m.clasificacion.generoMusical === track.clasificacion.generoMusical ||
          m.artista === track.artista
        )
      ).slice(0, 20);

      return {
        nombre: `Radio: ${track.titulo}`,
        items: [track, ...similar],
        currentIndex: 0,
      };
    });
  }, []);

  const playFromList = useCallback((nombre: string, items: Contenido[], startIndex: number) => {
    if (items.length === 0) return;
    const idx = Math.min(startIndex, items.length - 1);
    setPlaylistCtx({ nombre, items, currentIndex: idx });
    setCurrentTrack(items[idx]);
    setIsPlaying(true);
  }, []);

  const handleNext = useCallback(() => {
    setPlaylistCtx(prev => {
      if (!prev) return prev;
      const nextIdx = prev.currentIndex + 1;
      if (nextIdx < prev.items.length) {
        setCurrentTrack(prev.items[nextIdx]);
        setIsPlaying(true);
        return { ...prev, currentIndex: nextIdx };
      }
      return prev;
    });
  }, []);

  const handlePrevious = useCallback(() => {
    setPlaylistCtx(prev => {
      if (!prev) return prev;
      const prevIdx = prev.currentIndex - 1;
      if (prevIdx >= 0) {
        setCurrentTrack(prev.items[prevIdx]);
        setIsPlaying(true);
        return { ...prev, currentIndex: prevIdx };
      }
      return prev;
    });
  }, []);

  const toggleLike = useCallback((id: string) => {
    setLikedSongs(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const closePlayer = useCallback(() => {
    setCurrentTrack(null);
    setIsPlaying(false);
    setPlaylistCtx(null);
  }, []);

  return (
    <PlayerCtx.Provider value={{
      currentTrack, isPlaying, playlistContext: playlistCtx, likedSongs, radioLoading,
      playTrack, playFromList, startRadio, handleNext, handlePrevious, toggleLike, setIsPlaying, closePlayer,
    }}>
      {children}
      <MiniPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(p => !p)}
        onClose={closePlayer}
        playlistContext={playlistCtx}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLiked={currentTrack ? likedSongs.has(currentTrack.id) : false}
        onLike={toggleLike}
        onStartRadio={startRadio}
        radioLoading={radioLoading}
      />
    </PlayerCtx.Provider>
  );
}
