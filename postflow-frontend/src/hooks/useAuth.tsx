import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("pf_token"));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Restore user from saved token on every page load / refresh
  useEffect(() => {
    const saved = localStorage.getItem("pf_token");
    if (saved && !user) {
      axios
        .get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${saved}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => {
          // Token expired or invalid — clear everything
          localStorage.removeItem("pf_token");
          setToken(null);
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem("pf_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API}/auth/signup`, { name, email, password });
      localStorage.setItem("pf_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || "Signup failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("pf_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};