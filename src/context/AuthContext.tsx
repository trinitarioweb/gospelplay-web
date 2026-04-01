'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  avatar: string;
  spotify_connected: boolean;
  spotify_refresh_token?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  connectSpotify: () => Promise<void>;
  disconnectSpotify: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  connectSpotify: async () => {},
  disconnectSpotify: async () => {},
});

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  // Fetch or create user profile
  const fetchProfile = useCallback(async (u: User) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', u.id)
      .single();

    if (data) {
      setProfile({
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        avatar: data.avatar || u.user_metadata?.avatar_url || '',
        spotify_connected: !!data.spotify_refresh_token,
        spotify_refresh_token: data.spotify_refresh_token,
      });
    } else {
      // Create profile
      const newProfile = {
        id: u.id,
        email: u.email || '',
        nombre: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Usuario',
        avatar: u.user_metadata?.avatar_url || '',
        spotify_refresh_token: null,
      };

      await supabase.from('user_profiles').insert(newProfile);

      setProfile({
        ...newProfile,
        spotify_connected: false,
        spotify_refresh_token: undefined,
      });
    }
  }, [supabase]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const connectSpotify = useCallback(async () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      console.error('Spotify Client ID not configured');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/spotify/callback`;
    const scopes = [
      'user-top-read',
      'user-library-read',
      'user-read-recently-played',
      'user-follow-read',
    ].join(' ');

    // Generate PKCE challenge
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store verifier for callback
    sessionStorage.setItem('spotify_code_verifier', codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }, []);

  const disconnectSpotify = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('user_profiles')
      .update({ spotify_refresh_token: null })
      .eq('id', user.id);

    setProfile(prev => prev ? { ...prev, spotify_connected: false, spotify_refresh_token: undefined } : null);
  }, [user, supabase]);

  return (
    <AuthCtx.Provider value={{ user, profile, loading, signInWithGoogle, signOut, connectSpotify, disconnectSpotify }}>
      {children}
    </AuthCtx.Provider>
  );
}

// PKCE helpers
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
