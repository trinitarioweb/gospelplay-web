'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

export default function SpotifyCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Conectando Spotify...');

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        setStatus('Error al conectar Spotify');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      if (!code) {
        setStatus('No se recibio codigo de Spotify');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      try {
        // Exchange code for tokens via our API
        const res = await fetch('/api/spotify/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            codeVerifier: sessionStorage.getItem('spotify_code_verifier'),
          }),
        });

        if (!res.ok) throw new Error('Token exchange failed');

        const data = await res.json();

        // Save refresh token to user profile
        const supabase = createSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from('user_profiles')
            .update({ spotify_refresh_token: data.refresh_token })
            .eq('id', user.id);
        }

        sessionStorage.removeItem('spotify_code_verifier');
        setStatus('Spotify conectado! Redirigiendo...');
        setTimeout(() => router.push('/'), 1000);
      } catch {
        setStatus('Error al conectar. Intenta de nuevo.');
        setTimeout(() => router.push('/'), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="black">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <p className="text-white text-lg font-semibold">{status}</p>
      </div>
    </div>
  );
}
