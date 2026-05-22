import { create } from "zustand";
import { subscriptionService } from "../services/subscriptionService";

/**
 * useSubscriptionStore
 * Global state for premium subscription status.
 * Loaded on app startup via useAuthStore.initialize().
 *
 * State shape:
 *   isPremium   — whether the user has an active premium plan
 *   plan        — "free" | "premium"
 *   activatedAt — ISO timestamp or null
 *   expiresAt   — ISO timestamp or null (null = no expiry in Phase 1)
 *   isLoading   — async operation in progress
 *   error       — last error message or null
 */
export const useSubscriptionStore = create((set, get) => ({
  isPremium: false,
  plan: "free",
  activatedAt: null,
  expiresAt: null,
  isLoading: false,
  error: null,

  /**
   * Fetch subscription status from the API.
   * Called on app init and after activate/cancel.
   * Silently fails — user is treated as free tier on error.
   */
  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await subscriptionService.getStatus();
      set({
        isPremium: data.is_premium,
        plan: data.plan,
        activatedAt: data.activated_at,
        expiresAt: data.expires_at,
        isLoading: false,
      });
    } catch {
      // Network/auth failure — treat as free tier, don't surface error
      set({ isPremium: false, plan: "free", isLoading: false });
    }
  },

  /**
   * Activate premium subscription (Phase 1: no payment needed).
   * Updates local state on success, throws on failure.
   */
  activatePremium: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await subscriptionService.activate();
      set({
        isPremium: data.is_premium,
        plan: data.plan,
        activatedAt: data.activated_at,
        expiresAt: data.expires_at,
        isLoading: false,
      });
      return data;
    } catch (err) {
      const message =
        err.response?.data?.detail || "Failed to activate premium.";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  /**
   * Cancel premium subscription.
   * Updates local state on success, throws on failure.
   */
  cancelPremium: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await subscriptionService.cancel();
      set({
        isPremium: data.is_premium,
        plan: data.plan,
        activatedAt: data.activated_at,
        expiresAt: data.expires_at,
        isLoading: false,
      });
      return data;
    } catch (err) {
      const message =
        err.response?.data?.detail || "Failed to cancel subscription.";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  /** Reset subscription state to free tier defaults. */
  reset: () =>
    set({
      isPremium: false,
      plan: "free",
      activatedAt: null,
      expiresAt: null,
      isLoading: false,
      error: null,
    }),

  clearError: () => set({ error: null }),
}));
