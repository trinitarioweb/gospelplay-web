'use client';

import { BookOpen, Play, ChevronRight } from 'lucide-react';
import type { GuiaEstudio, Contenido } from '@/types/content';

interface GuiaEstudioCardProps {
  guia: GuiaEstudio;
  onPlay: (contenido: Contenido) => void;
  expanded?: boolean;
  onToggle?: () => void;
}

const tipoEmoji: Record<string, string> = {
  musica: '🎵',
  predicacion: '🎤',
  estudio_biblico: '📖',
  podcast: '🎙️',
  testimonio: '🙌',
  oracion: '🙏',
};

export default function GuiaEstudioCard({ guia, onPlay, expanded = false, onToggle }: GuiaEstudioCardProps) {
  return (
    <div className="bg-white/5 border border-orange-500/20 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-start gap-4 hover:bg-white/5 transition text-left"
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
          <BookOpen size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-orange-400 font-bold mb-1">📖 {guia.pasajePrincipal}</p>
          <h3 className="font-black text-lg leading-tight">{guia.titulo}</h3>
          <p className="text-sm text-orange-300/60 mt-1 line-clamp-2">{guia.contexto}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {guia.versiculosClave.slice(0, 4).map((v, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-amber-300">
                {v}
              </span>
            ))}
          </div>
        </div>
        <ChevronRight size={20} className={`text-orange-400 transition-transform flex-shrink-0 mt-1 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Contenido expandido */}
      {expanded && (
        <div className="border-t border-orange-500/20">
          {/* Contexto */}
          <div className="p-5 bg-orange-500/5">
            <p className="text-sm text-orange-100/80 leading-relaxed">{guia.contexto}</p>
          </div>

          {/* Ruta de estudio */}
          <div className="p-5">
            <h4 className="font-bold text-sm text-orange-400 mb-4">🎯 Ruta de Estudio Recomendada</h4>
            <div className="space-y-3">
              {guia.pasos.map((paso) => (
                <div key={paso.orden} className="flex items-center gap-3 p-3 bg-white/5 border border-orange-500/10 rounded-lg hover:bg-white/10 transition">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-sm font-bold text-orange-400 flex-shrink-0">
                    {paso.orden}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-orange-300/60 mb-0.5">{paso.titulo}</p>
                    <p className="font-bold text-sm truncate">{paso.contenido.titulo}</p>
                    <p className="text-xs text-gray-400 truncate">{paso.contenido.artista}</p>
                  </div>
                  <span className="text-lg flex-shrink-0">{tipoEmoji[paso.contenido.clasificacion.tipo]}</span>
                  <div className="text-xs font-bold text-orange-400 flex-shrink-0">
                    ⭐ {paso.contenido.evaluacion.puntuacionTotal}
                  </div>
                  <button
                    onClick={() => onPlay(paso.contenido)}
                    className="p-2 rounded-full bg-orange-500 hover:bg-orange-600 transition flex-shrink-0"
                  >
                    <Play size={14} fill="white" className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Temas relacionados */}
          <div className="px-5 pb-5">
            <h4 className="font-bold text-sm text-orange-400 mb-2">📚 Temas Relacionados</h4>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {guia.temasRelacionados.map((tema, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 cursor-pointer hover:bg-orange-500/30 transition">
                  {tema}
                </span>
              ))}
            </div>

            <h4 className="font-bold text-sm text-orange-400 mb-2">📖 Pasajes Conectados</h4>
            <div className="flex flex-wrap gap-1.5">
              {guia.pasajesConectados.map((pasaje, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 cursor-pointer hover:bg-amber-500/30 transition">
                  {pasaje}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
