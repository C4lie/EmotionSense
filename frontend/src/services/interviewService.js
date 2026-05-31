import { api } from "./api";

export const interviewService = {
  /**
   * Fetches the questions for a specific interview mode.
   * @param {string} mode - self_intro, hr, or behavioral
   * @returns {Promise<Array>} - List of questions
   */
  getQuestions: async (mode) => {
    const response = await api.get("/interviews/questions", {
      params: { mode },
    });
    return response.data;
  },

  /**
   * Starts a new interview session.
   * @param {string} mode - The interview category
   * @returns {Promise<Object>} - The started session details
   */
  startSession: async (mode) => {
    const response = await api.post("/sessions/start", {
      mode: "interview",
      script_text: `Interview Practice: ${mode}`,
    });
    return response.data;
  },

  /**
   * Submits a single frame record during an interview answer.
   * @param {string} sessionId - Active session UUID
   * @param {Object} record - Frame details
   */
  submitFrame: async (sessionId, record) => {
    const response = await api.post(`/sessions/${sessionId}/frames`, record);
    return response.data;
  },

  /**
   * Finalizes the interview session and retrieves the coach's feedback report.
   * @param {string} sessionId - Active session UUID
   * @returns {Promise<Object>} - The closed session report with recommendations
   */
  closeSession: async (sessionId, audioMetrics) => {
    const response = await api.post(`/sessions/${sessionId}/close`, {
      audio_metrics: audioMetrics,
    });
    return response.data;
  },
};

export default interviewService;
