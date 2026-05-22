/**
 * subscriptionService.js
 * API client for subscription management endpoints.
 * Architecture: Component → Store → Service → API
 */
import { api } from "./api";

export const subscriptionService = {
  /**
   * Get the current user's subscription status.
   * @returns {Promise<{is_premium: boolean, plan: string, activated_at: string|null, expires_at: string|null}>}
   */
  getStatus: async () => {
    const res = await api.get("/subscription/status");
    return res.data;
  },

  /**
   * Activate premium subscription.
   * Phase 1: Mock activation — no payment required.
   * @returns {Promise<{is_premium: boolean, plan: string, activated_at: string, expires_at: string|null}>}
   */
  activate: async () => {
    const res = await api.post("/subscription/activate");
    return res.data;
  },

  /**
   * Cancel premium subscription.
   * @returns {Promise<{is_premium: boolean, plan: string, activated_at: string|null, expires_at: string}>}
   */
  cancel: async () => {
    const res = await api.post("/subscription/cancel");
    return res.data;
  },
};

export default subscriptionService;
