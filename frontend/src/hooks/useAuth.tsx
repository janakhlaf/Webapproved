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

  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;

  signInWithGoogle: () => Promise<{
    success: boolean;
    error?: string;
  }>;

  register: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;

  signOut: () => void;
}

const AuthContext = createContext<
  UseAuthReturn | undefined
>(undefined);

const getDefaultAvatar = (): string => {
  return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
};

const mapSupabaseUser = (
  supabaseUser: any
): User => ({
  id: supabaseUser.id,

  email: supabaseUser.email || '',

  name:
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    supabaseUser.email?.split('@')[0] ||
    'User',

  avatar:
    supabaseUser.user_metadata?.avatar_url ||
    getDefaultAvatar(),

  accountType: 'Creator',

  createdAt:
    supabaseUser.created_at ||
    new Date().toISOString(),
});

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [authState, setAuthState] =
    useState<AuthState>({
      isAuthenticated: false,
      user: null,
    });

  useEffect(() => {
  supabase.auth.getSession().then(async ({ data }) => {
    if (data.session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', data.session.user.id)
        .single();

        if (!profile?.profile_image) {
  const googleAvatar =
    data.session.user.user_metadata?.avatar_url ||
    data.session.user.user_metadata?.picture;

  if (googleAvatar) {
    await supabase
      .from('users')
      .update({
        profile_image: googleAvatar,
      })
      .eq(
        'auth_user_id',
        data.session.user.id
      );

    profile.profile_image =
      googleAvatar;
  }
}

      setAuthState({
        isAuthenticated: true,
        user: {
          id: profile.id,
          email: data.session.user.email || '',
          name:
            profile?.full_name ||
            data.session.user.email?.split('@')[0] ||
            'User',
          avatar:
            profile?.profile_image ||
            data.session.user.user_metadata?.avatar_url ||
            getDefaultAvatar(),
          accountType: 'Creator',
          createdAt:
            data.session.user.created_at ||
            new Date().toISOString(),
        },
      });
    }
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const loadProfile = async () => {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();

          if (!profile?.profile_image) {
  const googleAvatar =
    session.user.user_metadata?.avatar_url ||
    session.user.user_metadata?.picture;

  if (googleAvatar) {
    await supabase
      .from('users')
      .update({
        profile_image: googleAvatar,
      })
      .eq(
        'auth_user_id',
        session.user.id
      );

    profile.profile_image =
      googleAvatar;
  }
}

        setAuthState({
          isAuthenticated: true,
          user: {
            id: profile.id,
            email: session.user.email || '',
            name:
              profile?.full_name ||
              session.user.email?.split('@')[0] ||
              'User',
            avatar:
              profile?.profile_image ||
              session.user.user_metadata?.avatar_url ||
              getDefaultAvatar(),
            accountType: 'Creator',
            createdAt:
              session.user.created_at ||
              new Date().toISOString(),
          },
        });
      };

      loadProfile();
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
    async (
      email: string,
      password: string
    ): Promise<{
      success: boolean;
      error?: string;
    }> => {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    },
    []
  );

  const signInWithGoogle = useCallback(
    async (): Promise<{
      success: boolean;
      error?: string;
    }> => {
      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',

          options: {
            redirectTo: 'http://localhost:8080',

            queryParams: {
              prompt: 'select_account',
            },
          },
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    },
    []
  );

  const register = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{
      success: boolean;
      error?: string;
    }> => {
      const { error } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
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
      isAuthenticated:
        authState.isAuthenticated,

      user: authState.user,

      signIn,
      signInWithGoogle,
      register,
      signOut,
    }),

    [
      authState,
      signIn,
      signInWithGoogle,
      register,
      signOut,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth =
  (): UseAuthReturn => {
    const context =
      useContext(AuthContext);

    if (!context) {
      throw new Error(
        'useAuth must be used within an AuthProvider'
      );
    }

    return context;
  };