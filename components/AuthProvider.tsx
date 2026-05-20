"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try to refresh token on mount
  useEffect(() => {
    refreshToken().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) return null;
      const data = await res.json();
      setAccessToken(data.accessToken);
      // Decode user from token (simple base64 decode of payload)
      try {
        const payload = JSON.parse(atob(data.accessToken.split(".")[1]));
        setUser({
          id: payload.userId,
          email: payload.email,
          username: payload.email.split("@")[0],
          role: payload.role,
        });
      } catch {
        // ignore decode errors
      }
      return data.accessToken;
    } catch {
      return null;
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Login failed");
    }

    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Registration failed");
    }

    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAccessToken(null);
  };

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      let token = accessToken;

      // If no token, try refresh
      if (!token) {
        token = await refreshToken();
      }

      const headers = new Headers(options.headers);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      let res = await fetch(url, { ...options, headers });

      // If 401, try refresh once
      if (res.status === 401 && token) {
        const newToken = await refreshToken();
        if (newToken) {
          headers.set("Authorization", `Bearer ${newToken}`);
          res = await fetch(url, { ...options, headers });
        }
      }

      return res;
    },
    [accessToken, refreshToken]
  );

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, register, logout, refreshToken, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}
