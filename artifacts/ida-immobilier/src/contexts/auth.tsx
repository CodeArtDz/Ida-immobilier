import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import type { GetMeResponse } from "@workspace/api-client-react";

type User = GetMeResponse;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [cachedUser, setCachedUser] = useState<User | null>(null);

  const { data: fetchedUser, isLoading } = useGetMe({
    query: {
      enabled: !!token && !cachedUser,
      retry: false,
    }
  });

  const user = cachedUser ?? fetchedUser ?? null;

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setCachedUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCachedUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: !!token && isLoading && !cachedUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
