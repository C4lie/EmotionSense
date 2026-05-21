import { api } from "./api";

export const analyticsService = {
  /**
   * Fetches aggregated analytics stats.
   * @param {number} rangeDays - The date range in days (default: 7)
   * @returns {Promise<Object>} - Aggregated dashboard analytics
   */
  getDashboardAnalytics: async (rangeDays = 7) => {
    const response = await api.get(`/analytics/dashboard`, {
      params: { range: rangeDays },
    });
    return response.data;
  },

  /**
   * Fetches paginated past sessions for the logged-in user.
   * @param {number} page - Current page
   * @param {number} size - Items per page
   * @returns {Promise<Object>} - Paginated list of sessions
   */
  getSessions: async (page = 1, size = 10) => {
    const response = await api.get(`/sessions`, {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Fetches detailed data for a specific session.
   * @param {string} sessionId - UUID of the session
   * @returns {Promise<Object>} - Session summary and all detailed frame-by-frame records
   */
  getSessionDetails: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Deletes a session.
   * @param {string} sessionId - UUID of the session
   * @returns {Promise<Object>} - Success confirmation
   */
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Saves a completed emotion detection session with all its frame records.
   * @param {Object} sessionData - Session creation data with records
   * @returns {Promise<Object>} - The finalized session detail
   */
  saveSession: async (sessionData) => {
    const response = await api.post(`/sessions`, sessionData);
    return response.data;
  },
};
export default analyticsService;
