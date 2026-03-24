'use client';

import { Home, Search, BookOpen, Users, Radio, Music, Flame, LogOut, X, Menu } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navItems = [
  { icon: Home, label: 'Inicio', id: 'home' },
  { icon: Search, label: 'Buscar', id: 'buscar' },
  { icon: Flame, label: 'Trending', id: 'trending' },
  { icon: BookOpen, label: 'Estudios', id: 'estudios' },
  { icon: Radio, label: 'Predicadores', id: 'predicadores' },
  { icon: Users, label: 'Comunidades', id: 'comunidades' },
  { icon: Music, label: 'Biblioteca', id: 'biblioteca' },
];

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed md:relative z-40 w-64 bg-black/95 backdrop-blur-xl border-r border-orange-500/20 h-screen flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-orange-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xl font-black">
            GP
          </div>
          <div>
            <h1 className="font-black text-lg text-gradient">GospelPlay</h1>
            <p className="text-xs text-orange-300/60">Contenido curado con IA</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-1 hover:bg-white/10 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-orange-500/30 to-orange-600/20 border border-orange-400/50 text-white'
                  : 'hover:bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-orange-500/20">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-sm font-bold">
              U
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Usuario</p>
              <p className="text-xs text-orange-300/60">Perfil</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
