'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle, XCircle, Link } from 'lucide-react';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContentAdded?: () => void;
}

export default function AddContentModal({ isOpen, onClose, onContentAdded }: AddContentModalProps) {
  const [url, setUrl] = useState('');
  const [estado, setEstado] = useState<'idle' | 'analizando' | 'aprobado' | 'rechazado' | 'guardando' | 'guardado' | 'error'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resultado, setResultado] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAnalizar = async () => {
    if (!url.trim()) return;

    setEstado('analizando');
    setErrorMsg('');

    try {
      const res = await fetch('/api/clasificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Error al analizar');
        setEstado('error');
        return;
      }

      setResultado(data);
      setEstado(data.evaluacion?.aprobado ? 'aprobado' : 'rechazado');
    } catch {
      setErrorMsg('Error de conexión');
      setEstado('error');
    }
  };

  const handlePublicar = async () => {
    if (!resultado) return;

    setEstado('guardando');

    try {
      const res = await fetch('/api/contenido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultado),
      });

      if (res.ok) {
        setEstado('guardado');
        onContentAdded?.();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Error al guardar');
        setEstado('error');
      }
    } catch {
      setErrorMsg('Error de conexión al guardar');
      setEstado('error');
    }
  };

  const resetear = () => {
    setUrl('');
    setEstado('idle');
    setResultado(null);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#282828] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-bold text-lg text-white">Agregar Contenido</h2>
          <button onClick={() => { onClose(); resetear(); }} className="p-2 hover:bg-white/10 rounded-full transition text-[#b3b3b3] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {estado === 'idle' && (
            <>
              <p className="text-sm text-[#b3b3b3]">
                Pega un link de YouTube y nuestra IA teologica lo analizara automaticamente.
              </p>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a6a]" size={18} />
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=... o https://youtu.be/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#3a3a3a] border border-transparent rounded-md text-white placeholder-[#6a6a6a] focus:outline-none focus:border-white/20 transition text-sm"
                />
              </div>
              <button
                onClick={handleAnalizar}
                disabled={!url.trim()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-[#3a3a3a] disabled:text-[#6a6a6a] rounded-full font-bold text-sm text-black transition"
              >
                Analizar con IA Teologica
              </button>
            </>
          )}

          {estado === 'analizando' && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-4 text-amber-500" size={48} />
              <p className="font-bold text-lg text-white">Analizando contenido...</p>
              <p className="text-sm text-[#6a6a6a] mt-2">La IA esta evaluando la calidad teologica</p>
              <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-2 text-sm text-[#b3b3b3]">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  Extrayendo datos del video...
                </div>
                <div className="flex items-center gap-2 text-sm text-[#b3b3b3]">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  Evaluando contenido cristocentrico...
                </div>
                <div className="flex items-center gap-2 text-sm text-[#b3b3b3]">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  Clasificando genero y categoria...
                </div>
              </div>
            </div>
          )}

          {estado === 'aprobado' && resultado && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle className="mx-auto mb-3 text-emerald-400" size={48} />
                <p className="font-bold text-lg text-emerald-400">Contenido Aprobado</p>
                <p className="text-sm text-[#6a6a6a]">Puntuacion: {resultado.evaluacion?.puntuacionTotal}/100</p>
              </div>

              {resultado.thumbnail && (
                <div className="rounded-md overflow-hidden">
                  <img src={resultado.thumbnail} alt={resultado.titulo} className="w-full h-40 object-cover" />
                </div>
              )}

              <div className="bg-[#3a3a3a] rounded-md p-4 space-y-2 text-sm">
                <p><span className="text-amber-400 font-semibold">Titulo:</span> <span className="text-white">{resultado.titulo}</span></p>
                <p><span className="text-amber-400 font-semibold">Artista:</span> <span className="text-white">{resultado.artista}</span></p>
                <p><span className="text-amber-400 font-semibold">Tipo:</span> <span className="text-[#b3b3b3]">{resultado.clasificacion?.tipo}</span></p>
                <p><span className="text-amber-400 font-semibold">Categoria:</span> <span className="text-[#b3b3b3]">{resultado.clasificacion?.categoria}</span></p>
                {resultado.clasificacion?.generoMusical && (
                  <p><span className="text-amber-400 font-semibold">Genero:</span> <span className="text-[#b3b3b3]">{resultado.clasificacion?.generoMusical}</span></p>
                )}
                <p><span className="text-amber-400 font-semibold">Notas:</span> <span className="text-[#b3b3b3]">{resultado.evaluacion?.notas}</span></p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePublicar}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-full font-bold text-sm text-white transition"
                >
                  Publicar en GospelPlay
                </button>
                <button onClick={resetear} className="flex-1 py-3 bg-white/10 hover:bg-white/15 rounded-full font-bold text-sm text-white transition">
                  Agregar otro
                </button>
              </div>
            </div>
          )}

          {estado === 'rechazado' && resultado && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <XCircle className="mx-auto mb-3 text-red-400" size={48} />
                <p className="font-bold text-lg text-red-400">Contenido No Aprobado</p>
                <p className="text-sm text-[#6a6a6a]">Puntuacion: {resultado.evaluacion?.puntuacionTotal}/100 (minimo: 70)</p>
              </div>

              {resultado.thumbnail && (
                <div className="rounded-md overflow-hidden">
                  <img src={resultado.thumbnail} alt={resultado.titulo} className="w-full h-40 object-cover" />
                </div>
              )}

              <div className="bg-[#3a3a3a] rounded-md p-4 space-y-2 text-sm">
                <p><span className="text-amber-400 font-semibold">Titulo:</span> <span className="text-white">{resultado.titulo}</span></p>
                <p><span className="text-amber-400 font-semibold">Artista:</span> <span className="text-white">{resultado.artista}</span></p>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 text-sm">
                <p className="text-red-300">{resultado.evaluacion?.notas}</p>
              </div>

              <button onClick={resetear} className="w-full py-3 bg-white/10 hover:bg-white/15 rounded-full font-bold text-sm text-white transition">
                Intentar con otro link
              </button>
            </div>
          )}

          {estado === 'guardando' && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-4 text-emerald-400" size={48} />
              <p className="font-bold text-lg text-white">Guardando en GospelPlay...</p>
            </div>
          )}

          {estado === 'guardado' && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="mx-auto mb-3 text-emerald-400" size={64} />
              <p className="font-bold text-xl text-emerald-400">Publicado</p>
              <p className="text-sm text-[#6a6a6a]">El contenido ya esta disponible en GospelPlay</p>
              <div className="flex gap-2">
                <button onClick={resetear} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 rounded-full font-bold text-sm text-black transition">
                  Agregar otro
                </button>
                <button onClick={() => { onClose(); resetear(); }} className="flex-1 py-3 bg-white/10 hover:bg-white/15 rounded-full font-bold text-sm text-white transition">
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {estado === 'error' && (
            <div className="text-center py-8 space-y-4">
              <XCircle className="mx-auto mb-3 text-red-400" size={48} />
              <p className="font-bold text-lg text-red-400">Error</p>
              <p className="text-sm text-red-300">{errorMsg}</p>
              <button onClick={resetear} className="w-full py-3 bg-white/10 hover:bg-white/15 rounded-full font-bold text-sm text-white transition">
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
