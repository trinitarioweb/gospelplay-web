'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroItem {
  titulo: string;
  descripcion: string;
  imagen: string;
  url: string;
  tags: string[];
  tipo: string;
  plataforma?: string;
}

interface HeroBannerProps {
  items: HeroItem[];
  onFavorite?: (titulo: string) => void;
}

export default function HeroBanner({ items, onFavorite }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Auto-advance every 8 seconds
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next, items.length]);

  if (items.length === 0) return null;

  const item = items[current];

  return (
    <div className="relative w-full h-[70vh] min-h-[400px] max-h-[600px] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={item.imagen}
          alt={item.titulo}
          className="w-full h-full object-cover transition-opacity duration-700"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 md:p-16">
        <div className="max-w-7xl mx-auto">
          {/* Tags */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">{item.tipo}</span>
            {item.tags.map(tag => (
              <span key={tag} className="text-[11px] px-2 py-0.5 bg-white/10 backdrop-blur rounded text-white/80">
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 max-w-2xl leading-tight">
            {item.titulo}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-white/70 mb-6 max-w-xl line-clamp-2">
            {item.descripcion}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition text-sm"
            >
              <ExternalLink size={18} />
              {item.plataforma === 'youtube' ? 'Ver en YouTube' : item.plataforma === 'spotify' ? 'Escuchar en Spotify' : 'Ver ahora'}
            </a>
            <button
              onClick={() => onFavorite?.(item.titulo)}
              className="w-11 h-11 rounded-full border-2 border-white/30 flex items-center justify-center hover:border-white/60 transition"
            >
              <Heart size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition opacity-0 hover:opacity-100 focus:opacity-100"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition opacity-0 hover:opacity-100 focus:opacity-100"
          >
            <ChevronRight size={24} className="text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-1 rounded-full transition-all ${
                  idx === current ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
