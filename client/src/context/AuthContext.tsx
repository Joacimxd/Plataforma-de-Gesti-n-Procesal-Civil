import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | undefined>;
  refreshUser: () => Promise<void>;
  login: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (token: string) => {
    try {
      const res = await axios.get(`${baseURL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data as User;
    } catch {
      return null;
    }
  }, []);

  const login = useCallback((token: string, newUser: User) => {
    localStorage.setItem("plataforma_token", token);
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem("plataforma_token");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("plataforma_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const profile = await fetchProfile(token);
    if (!profile) {
      setUser(null);
      localStorage.removeItem("plataforma_token");
    } else {
      setUser(profile);
    }
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value: AuthContextValue = {
    user,
    loading,
    signOut,
    getToken: async () => localStorage.getItem("plataforma_token") || undefined,
    refreshUser,
    login,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
