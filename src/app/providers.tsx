'use client';

import { PlayerProvider } from '@/context/PlayerContext';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlayerProvider>
        {children}
      </PlayerProvider>
    </AuthProvider>
  );
}
