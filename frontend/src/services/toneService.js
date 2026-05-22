/**
 * toneService.js
 * API client for AI tone coaching endpoints (premium only).
 * Architecture: Component → Store → Service → API
 */
import { api } from "./api";

export const toneService = {
  /**
   * Submit tone analysis payload and receive a coaching report.
   * @param {{ audio_metrics: Object, emotion_records: Array, session_id: string|null }} payload
   * @returns {Promise<Object>} Full coaching report with scores and recommendations
   */
  analyze: async (payload) => {
    const res = await api.post("/tone/analyze", payload);
    return res.data;
  },

  /**
   * Get paginated list of past tone coaching reports.
   * @param {number} page  - Page number (1-indexed)
   * @param {number} size  - Items per page
   * @returns {Promise<{ total: number, page: number, size: number, reports: Array }>}
   */
  getHistory: async (page = 1, size = 10) => {
    const res = await api.get("/tone/history", { params: { page, size } });
    return res.data;
  },

  /**
   * Get full detail of one tone report by ID.
   * @param {string} reportId - UUID of the report
   * @returns {Promise<Object>} Full report detail
   */
  getReport: async (reportId) => {
    const res = await api.get(`/tone/${reportId}`);
    return res.data;
  },
};

export default toneService;
