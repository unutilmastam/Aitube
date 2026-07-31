import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch, clearTokens, getTokens, setTokens } from "@/api/client";
import { User } from "@/api/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { accessToken } = getTokens();
    if (!accessToken) {
      setLoading(false);
      return;
    }
    // Hozircha /me endpoint yo'q — tokenlar bo'lsa, birinchi so'rovda 401 kelsa logout bo'ladi.
    // Bu yerda faqat localStorage'dan saqlangan user ma'lumotini tiklaymiz.
    const cachedUser = localStorage.getItem("user");
    if (cachedUser) setUser(JSON.parse(cachedUser));
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const data = await apiFetch<{ user: User; accessToken: string; refreshToken: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function register(email: string, password: string) {
    const data = await apiFetch<{ user: User; accessToken: string; refreshToken: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    clearTokens();
    localStorage.removeItem("user");
    setUser(null);
  }

  async function refreshUser() {
    // Credit balansini yangilash uchun — hozircha loyihalar ro'yxati chaqirilganda qo'lda yangilanadi
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}
