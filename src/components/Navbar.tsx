'use client';

import { useState } from 'react';
import { Search, Heart, Menu, X } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  onSearch?: (query: string) => void;
  onNavigate?: (section: string) => void;
  activeSection?: string;
  favoritesCount?: number;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Inicio' },
  { id: 'musica', label: 'Musica' },
  { id: 'peliculas', label: 'Peliculas' },
  { id: 'series', label: 'Series' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'artistas', label: 'Artistas' },
];

export default function Navbar({ onSearch, onNavigate, activeSection = 'home', favoritesCount = 0 }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) onSearch?.(searchQuery.trim());
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-black text-sm">GP</span>
              </div>
              <span className="text-white font-bold text-lg hidden sm:block">GospelPlay</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    activeSection === item.id
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-48 sm:w-64 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
                  autoFocus
                  onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                />
                <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); onSearch?.(''); }} className="p-2 text-white/60 hover:text-white">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 text-white/60 hover:text-white transition">
                <Search size={20} />
              </button>
            )}

            {/* Favorites */}
            <button
              onClick={() => onNavigate?.('favoritos')}
              className={`p-2 transition relative ${activeSection === 'favoritos' ? 'text-amber-400' : 'text-white/60 hover:text-white'}`}
            >
              <Heart size={20} />
              {favoritesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full text-[10px] font-bold text-black flex items-center justify-center">
                  {favoritesCount > 99 ? '99' : favoritesCount}
                </span>
              )}
            </button>

            {/* Mobile menu */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-white/60 hover:text-white">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-lg border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { onNavigate?.(item.id); setMobileOpen(false); }}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeSection === item.id
                    ? 'text-amber-400 bg-white/10'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
