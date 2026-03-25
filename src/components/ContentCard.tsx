'use client';

import { Heart, Play, ExternalLink } from 'lucide-react';
import type { Contenido } from '@/types/content';

interface ContentCardProps {
  contenido: Contenido;
  onPlay: (contenido: Contenido) => void;
  onLike: (id: string) => void;
  isLiked: boolean;
  compact?: boolean;
}

const plataformaLabel: Record<string, { text: string; color: string }> = {
  spotify: { text: 'Spotify', color: 'bg-green-600' },
  youtube: { text: 'YouTube', color: 'bg-red-600' },
  apple_music: { text: 'Apple', color: 'bg-pink-600' },
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-amber-500/20 text-amber-400' : score >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>
      {score}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const info = plataformaLabel[platform] || { text: platform, color: 'bg-gray-600' };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${info.color} text-white`}>
      {info.text}
    </span>
  );
}

export default function ContentCard({ contenido, onPlay, onLike, isLiked, compact = false }: ContentCardProps) {
  // Compact row variant (for search results, lists, trending)
  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-md hover:bg-[#282828] transition-colors group cursor-pointer"
        onClick={() => onPlay(contenido)}
      >
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-md bg-[#282828] flex-shrink-0 overflow-hidden">
          {contenido.thumbnail ? (
            <img src={contenido.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#282828] to-[#3a3a3a] flex items-center justify-center text-[#6a6a6a] text-lg">
              {contenido.clasificacion.tipo === 'musica' ? '♪' : contenido.clasificacion.tipo === 'predicacion' ? '🎤' : '📖'}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={16} fill="white" className="text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{contenido.titulo}</p>
          <div className="flex items-center gap-2 text-xs text-[#b3b3b3]">
            <span className="truncate">{contenido.artista}</span>
            <span className="flex-shrink-0">
              <PlatformBadge platform={contenido.plataforma} />
            </span>
          </div>
        </div>

        {/* Score */}
        <ScoreBadge score={contenido.evaluacion.puntuacionTotal} />

        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); onLike(contenido.id); }}
          className="p-1.5 rounded-full hover:bg-white/10 transition opacity-0 group-hover:opacity-100"
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'text-amber-400' : 'text-[#b3b3b3]'} />
        </button>

        {/* Duration */}
        <span className="text-xs text-[#6a6a6a] w-10 text-right flex-shrink-0">{contenido.duracion}</span>
      </div>
    );
  }

  // Card variant (Spotify-style vertical card with art on top)
  return (
    <div className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors duration-300 group cursor-pointer relative">
      {/* Thumbnail */}
      <div className="relative mb-4">
        <div className="aspect-square rounded-md overflow-hidden bg-[#282828] shadow-lg shadow-black/40">
          {contenido.thumbnail ? (
            <img src={contenido.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#282828] to-[#3e3e3e] flex items-center justify-center">
              <span className="text-5xl text-[#535353]">
                {contenido.clasificacion.tipo === 'musica' ? '♪' : contenido.clasificacion.tipo === 'predicacion' ? '🎤' : '📖'}
              </span>
            </div>
          )}
        </div>

        {/* Play button - appears on hover */}
        <button
          onClick={() => onPlay(contenido)}
          className="card-play-btn absolute bottom-2 right-2 w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 hover:scale-105 flex items-center justify-center shadow-xl shadow-black/50 transition-all"
        >
          <Play size={22} fill="black" className="text-black ml-0.5" />
        </button>
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm text-white line-clamp-1 mb-1">{contenido.titulo}</h3>

      {/* Artist */}
      <p className="text-xs text-[#b3b3b3] line-clamp-1 mb-2">{contenido.artista}</p>

      {/* Badges row: platform + score */}
      <div className="flex items-center gap-1.5">
        <PlatformBadge platform={contenido.plataforma} />
        <ScoreBadge score={contenido.evaluacion.puntuacionTotal} />
      </div>

      {/* Hover actions (like + external link) */}
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onLike(contenido.id); }}
          className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition"
        >
          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'text-amber-400' : 'text-white'} />
        </button>
        <a
          href={contenido.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition"
        >
          <ExternalLink size={14} className="text-white" />
        </a>
      </div>
    </div>
  );
}
