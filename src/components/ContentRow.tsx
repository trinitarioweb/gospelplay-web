'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Heart } from 'lucide-react';

interface ContentItem {
  id: string;
  titulo: string;
  subtitulo?: string;
  imagen: string;
  url: string;
  plataforma?: string;
  tipo?: string;
  valoracion?: number;
}

interface ContentRowProps {
  title: string;
  subtitle?: string;
  items: ContentItem[];
  onFavorite?: (id: string) => void;
  isFavorite?: (id: string) => boolean;
  variant?: 'poster' | 'wide' | 'circle';
  onViewAll?: () => void;
}

const PLATAFORMA_COLORS: Record<string, string> = {
  youtube: 'bg-red-600',
  spotify: 'bg-green-600',
  netflix: 'bg-red-700',
  apple_music: 'bg-pink-600',
  angel_studios: 'bg-blue-600',
};

function StarRating({ score }: { score: number }) {
  const stars = Math.round(score / 20);
  return (
    <span className="text-amber-400 text-[11px]">
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
}

export default function ContentRow({ title, subtitle, items, onFavorite, isFavorite, variant = 'poster', onViewAll }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="py-6">
      {/* Header */}
      <div className="flex items-end justify-between px-4 sm:px-6 md:px-12 mb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition">
            VER TODO
          </button>
        )}
      </div>

      {/* Scrollable row */}
      <div className="relative group/row">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-[#0a0a0a] to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition"
        >
          <ChevronLeft size={28} className="text-white" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-[#0a0a0a] to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition"
        >
          <ChevronRight size={28} className="text-white" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 md:px-12"
        >
          {items.map(item => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-shrink-0 group/card relative ${
                variant === 'poster' ? 'w-[160px] sm:w-[180px]' :
                variant === 'wide' ? 'w-[280px] sm:w-[320px]' :
                'w-[130px] sm:w-[150px]'
              }`}
            >
              {/* Image */}
              <div className={`relative overflow-hidden bg-[#1a1a1a] mb-2 ${
                variant === 'poster' ? 'aspect-[2/3] rounded-lg' :
                variant === 'wide' ? 'aspect-video rounded-lg' :
                'aspect-square rounded-full'
              }`}>
                {item.imagen ? (
                  <img
                    src={item.imagen}
                    alt={item.titulo}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-white/10">
                    {item.tipo === 'musica' ? '♪' : '🎬'}
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-2">
                    <span className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <ExternalLink size={18} className="text-black" />
                    </span>
                  </div>
                </div>

                {/* Platform badge */}
                {item.plataforma && (
                  <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${PLATAFORMA_COLORS[item.plataforma] || 'bg-gray-600'}`}>
                    {item.plataforma === 'youtube' ? 'YT' : item.plataforma === 'spotify' ? 'SP' : item.plataforma.toUpperCase().slice(0, 2)}
                  </span>
                )}

                {/* Favorite button */}
                {onFavorite && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite(item.id); }}
                    className={`absolute top-2 right-2 p-1.5 rounded-full transition ${
                      isFavorite?.(item.id) ? 'bg-amber-500/80 text-black' : 'bg-black/40 text-white opacity-0 group-hover/card:opacity-100'
                    }`}
                  >
                    <Heart size={14} fill={isFavorite?.(item.id) ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>

              {/* Info */}
              <h3 className={`font-semibold text-white text-sm line-clamp-1 ${variant === 'circle' ? 'text-center' : ''}`}>
                {item.titulo}
              </h3>
              {item.subtitulo && (
                <p className={`text-xs text-white/40 line-clamp-1 mt-0.5 ${variant === 'circle' ? 'text-center' : ''}`}>
                  {item.subtitulo}
                </p>
              )}
              {item.valoracion != null && (
                <div className="mt-0.5">
                  <StarRating score={item.valoracion} />
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
