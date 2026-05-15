import { supabase } from '@/lib/supabase';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@/lib/index';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendEmailCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailCode: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

const getDefaultAvatar = (): string => {
  return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
};

const mapSupabaseUser = (supabaseUser: any): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  name:
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    supabaseUser.email?.split('@')[0] ||
    'User',
  avatar: supabaseUser.user_metadata?.avatar_url || getDefaultAvatar(),
  accountType: 'Creator',
  createdAt: supabaseUser.created_at || new Date().toISOString(),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setAuthState({
          isAuthenticated: true,
          user: mapSupabaseUser(data.session.user),
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthState({
          isAuthenticated: true,
          user: mapSupabaseUser(session.user),
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    },
    []
  );

  const signInWithGoogle = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:8080',
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }, []);

  const sendEmailCode = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: 'http://localhost:8080',
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    },
    []
  );

  const verifyEmailCode = useCallback(
    async (
      email: string,
      token: string
    ): Promise<{ success: boolean; error?: string }> => {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    },
    []
  );

  const signOut = useCallback((): void => {
    supabase.auth.signOut();
    setAuthState({
      isAuthenticated: false,
      user: null,
    });
  }, []);

  const value = useMemo<UseAuthReturn>(
    () => ({
      isAuthenticated: authState.isAuthenticated,
      user: authState.user,
      signIn,
      signInWithGoogle,
      sendEmailCode,
      verifyEmailCode,
      signOut,
    }),
    [authState, signIn, signInWithGoogle, sendEmailCode, verifyEmailCode, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): UseAuthReturn => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};