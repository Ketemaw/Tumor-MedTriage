import { create } from "zustand";
import { authApi, getAccessToken, clearAccessToken, ApiError } from "@/lib/api";

interface DecodedUser {
  id: number;
}

interface AuthState {
  userId: number | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string | undefined, role: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

function decodeToken(token: string): DecodedUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { id: Number(payload.sub) };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  status: "idle",
  error: null,

  hydrate: () => {
    const token = getAccessToken();
    if (!token) {
      set({ status: "unauthenticated" });
      return;
    }
    const decoded = decodeToken(token);
    set({ userId: decoded?.id ?? null, status: decoded ? "authenticated" : "unauthenticated" });
  },

  login: async (email, password) => {
    set({ status: "loading", error: null });
    try {
      const data = await authApi.login(email, password);
      const decoded = decodeToken(data.access_token);
      set({ userId: decoded?.id ?? null, status: "authenticated" });
    } catch (e) {
      const detail = e instanceof ApiError ? e.detail : "Login failed";
      set({ status: "unauthenticated", error: detail });
      throw e;
    }
  },

  signup: async (email, password, fullName, role) => {
    set({ status: "loading", error: null });
    try {
      await authApi.signup(email, password, fullName, role);
      const data = await authApi.login(email, password);
      const decoded = decodeToken(data.access_token);
      set({ userId: decoded?.id ?? null, status: "authenticated" });
    } catch (e) {
      const detail = e instanceof ApiError ? e.detail : "Signup failed";
      set({ status: "unauthenticated", error: detail });
      throw e;
    }
  },

  logout: () => {
    clearAccessToken();
    set({ userId: null, status: "unauthenticated" });
  },
}));
