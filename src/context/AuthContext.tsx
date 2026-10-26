import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or construct profile from profiles table or metadata fallback
  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data && !error) {
        setProfile(data as UserProfile);
        return;
      }

      // If profile does not exist yet (or table pending migration), create/fallback gracefully
      const fallbackProfile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Operator',
        callsign: currentUser.user_metadata?.callsign || `AEGIS-${currentUser.id.substring(0, 4).toUpperCase()}`,
        role: 'TACTICAL_OPERATOR',
      };

      // Try inserting into profiles table if available
      try {
        const { data: inserted } = await supabase
          .from('profiles')
          .insert([fallbackProfile])
          .select()
          .maybeSingle();

        if (inserted) {
          setProfile(inserted as UserProfile);
          return;
        }
      } catch {
        // Table may not exist yet if user hasn't run the SQL migration
      }

      setProfile(fallbackProfile);
    } catch (err) {
      console.warn('[AEGIS AIR Auth] Profile fetch note:', err);
      setProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.email?.split('@')[0] || 'Operator',
        callsign: `AEGIS-${currentUser.id.substring(0, 4).toUpperCase()}`,
        role: 'TACTICAL_OPERATOR',
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  // Initialize and observe session
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AEGIS AIR Auth] getSession notice:', error.message);
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await fetchProfile(initialSession.user);
          }
        }
      } catch (err) {
        console.error('[AEGIS AIR Auth] Session initialization error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In with email and password
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to sign in') };
    }
  };

  // Sign Up with email, password, full name, and tactical callsign
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    callsign?: string
  ): Promise<{ error: Error | null; user: User | null }> => {
    try {
      const trimmedEmail = email.trim();
      const derivedCallsign = callsign?.trim() || `AEGIS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: fullName?.trim() || trimmedEmail.split('@')[0],
            callsign: derivedCallsign,
          },
        },
      });

      if (error) {
        return { error: new Error(error.message), user: null };
      }

      return { error: null, user: data.user };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to sign up'), user: null };
    }
  };

  // Sign Out
  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AEGIS AIR Auth] signOut notice:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
