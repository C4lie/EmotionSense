import { create } from "zustand";
import { authService } from "../services/authService";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  /**
   * Initialize user session from localStorage token
   */
  initialize: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const userData = await authService.getMe();
      set({ user: userData, isAuthenticated: true, error: null });
    } catch (err) {
      console.error("[AuthStore] Token verification failed:", err);
      // Clean up invalid session
      localStorage.removeItem("token");
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Log in user using credentials
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      localStorage.setItem("token", data.access_token);
      set({
        user: data.user,
        token: data.access_token,
        isAuthenticated: true,
        error: null,
      });
      return data;
    } catch (err) {
      const message = err.response?.data?.detail || "Invalid email or password.";
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Register a new user account
   */
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(name, email, password);
      localStorage.setItem("token", data.access_token);
      set({
        user: data.user,
        token: data.access_token,
        isAuthenticated: true,
        error: null,
      });
      return data;
    } catch (err) {
      const message = err.response?.data?.detail || "Registration failed. Email may already be in use.";
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * End current user session and discard stored token
   */
  logout: () => {
    localStorage.removeItem("token");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
