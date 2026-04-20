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

const AUTH_STORAGE_KEY = 'human_mind_ai_auth';
const USER_STORAGE_KEY = 'human_mind_ai_user';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, accountType: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

const loadAuthState = (): AuthState => {
  try {
    const authData = sessionStorage.getItem(AUTH_STORAGE_KEY);
    const userData = sessionStorage.getItem(USER_STORAGE_KEY);

    if (authData && userData) {
      return {
        isAuthenticated: JSON.parse(authData),
        user: JSON.parse(userData),
      };
    }
  } catch (error) {
    console.error('Failed to load auth state:', error);
  }

  return {
    isAuthenticated: false,
    user: null,
  };
};

const saveAuthState = (state: AuthState): void => {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state.isAuthenticated));

    if (state.user) {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state.user));
    } else {
      sessionStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to save auth state:', error);
  }
};

const clearAuthState = (): void => {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear auth state:', error);
  }
};

const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

const getDefaultAvatar = (): string => {
  const avatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    'https://images.unsplash.com/photo-1640960543409-dbe56ccc30e2?w=400',
    'https://images.unsplash.com/photo-1772371272174-392cf9cfabae?w=400',
    'https://images.unsplash.com/photo-1772371272206-0525c3183ca9?w=400',
  ];
  return avatars[Math.floor(Math.random() * avatars.length)];
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(loadAuthState);

  useEffect(() => {
    saveAuthState(authState);
  }, [authState]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (email === 'demo@humanmind.ai' && password === 'demo123') {
      const demoUser: User = {
        id: 'demo_user_001',
        email: 'demo@humanmind.ai',
        name: 'Alex Nova',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
        accountType: 'Creator',
        bio: 'Exploring the intersection of human creativity and AI.',
        createdAt: new Date().toISOString(),
      };

      setAuthState({ isAuthenticated: true, user: demoUser });
      return { success: true };
    }

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    if (!email.includes('@')) {
      return { success: false, error: 'Invalid email format' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    const existingUserData = localStorage.getItem(`user_${email}`);

    if (existingUserData) {
      const userData = JSON.parse(existingUserData) as User;
      setAuthState({
        isAuthenticated: true,
        user: userData,
      });
      return { success: true };
    }

    const newUser: User = {
      id: generateUserId(),
      email,
      name: email.split('@')[0],
      avatar: getDefaultAvatar(),
      accountType: 'Creator',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(`user_${email}`, JSON.stringify(newUser));

    setAuthState({
      isAuthenticated: true,
      user: newUser,
    });

    return { success: true };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const googleUser: User = {
      id: generateUserId(),
      email: 'user@gmail.com',
      name: 'Google User',
      avatar: getDefaultAvatar(),
      accountType: 'Creator',
      createdAt: new Date().toISOString(),
    };

    setAuthState({
      isAuthenticated: true,
      user: googleUser,
    });

    return { success: true };
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    accountType: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password || !name) {
      return { success: false, error: 'All fields are required' };
    }

    if (!email.includes('@')) {
      return { success: false, error: 'Invalid email format' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newUser: User = {
      id: generateUserId(),
      email,
      name,
      avatar: getDefaultAvatar(),
      accountType: accountType || 'Creator',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(`user_${email}`, JSON.stringify(newUser));

    setAuthState({
      isAuthenticated: true,
      user: newUser,
    });

    return { success: true };
  }, []);

  const signOut = useCallback((): void => {
    clearAuthState();
    setAuthState({
      isAuthenticated: false,
      user: null,
    });
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      clearAuthState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const value = useMemo<UseAuthReturn>(
    () => ({
      isAuthenticated: authState.isAuthenticated,
      user: authState.user,
      signIn,
      signInWithGoogle,
      register,
      signOut,
    }),
    [authState, register, signIn, signInWithGoogle, signOut]
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
