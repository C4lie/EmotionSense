import { create } from "zustand";
import { authService } from "../services/authService";
import { useSubscriptionStore } from "./useSubscriptionStore";

/**
 * useAuthStore
 * Global authentication state.
 *
 * Handles login, register, logout, and session initialization.
 * On successful authentication, also triggers subscription status fetch
 * so premium features are available immediately after login.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  /**
   * Initialize user session from a token stored in localStorage.
   * Called once on app mount. Also loads subscription status.
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
      // Load subscription status non-blocking — failure is handled silently
      useSubscriptionStore.getState().fetchStatus().catch(() => {});
    } catch (err) {
      console.error("[AuthStore] Token verification failed:", err);
      localStorage.removeItem("token");
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Log in user using credentials.
   * On success, also loads subscription status.
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
      // Non-blocking subscription fetch after login
      useSubscriptionStore.getState().fetchStatus().catch(() => {});
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
   * Register a new user account.
   * On success, also loads subscription status.
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
      // Non-blocking subscription fetch after registration
      useSubscriptionStore.getState().fetchStatus().catch(() => {});
      return data;
    } catch (err) {
      const message =
        err.response?.data?.detail || "Registration failed. Email may already be in use.";
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * End current user session and discard stored token.
   * Resets subscription state to free tier.
   */
  logout: () => {
    localStorage.removeItem("token");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
    // Reset subscription state on logout
    useSubscriptionStore.getState().reset();
  },

  clearError: () => set({ error: null }),
}));
