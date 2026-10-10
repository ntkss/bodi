import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
}

export interface FarmProfile {
  id: string;
  name: string;
  timezone: string;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  waterSourceCanal?: string | null;
  tidalInfluence?: string | null;
  waterPathNotes?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  farm: FarmProfile | null;
  token: string | null;
  isLoading: boolean;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginWithDevAccount: () => Promise<boolean>;
  logout: () => void;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  setFarmProfile: (farm: FarmProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'bodi_auth_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authenticated fetch wrapper
  const authFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(input, { ...init, headers });
  };

  // Restore user session on mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser(data.user);
            setFarm(data.farm);
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          if (isMounted) {
            setToken(null);
            setUser(null);
            setFarm(null);
          }
        }
      } catch (err) {
        console.error('Failed to verify session token:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Login handler
  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Login error:', err);
        return false;
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setFarm(data.farm);
      return true;
    } catch (err) {
      console.error('Network error during Google login:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Dev login handler (for localhost development)
  const loginWithDevAccount = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Dev login error:', err);
        return false;
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setFarm(data.farm);
      return true;
    } catch (err) {
      console.error('Network error during dev login:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setFarm(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        farm,
        token,
        isLoading,
        loginWithGoogle,
        loginWithDevAccount,
        logout,
        authFetch,
        setFarmProfile: setFarm,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
