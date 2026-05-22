import { create } from "zustand";
import { toneService } from "../services/toneService";

/**
 * useToneAnalysisStore
 * State management for AI tone coaching sessions.
 *
 * Coordinates between the useToneEngine hook (audio capture) and
 * toneService (API calls). Holds the final coaching report and live metrics.
 *
 * State shape:
 *   isSessionActive  — whether audio capture is running
 *   coachingReport   — last completed coaching report from the API
 *   showReport       — whether the report modal/panel is visible
 *   isAnalyzing      — API call in progress
 *   error            — last error message or null
 *   liveMetrics      — real-time values updated by useToneEngine during capture
 */
export const useToneAnalysisStore = create((set, get) => ({
  isSessionActive: false,
  coachingReport: null,
  showReport: false,
  isAnalyzing: false,
  error: null,

  // Live metrics updated by useToneEngine during an active session
  liveMetrics: {
    energyLevel: 0,
    paceScore: 0,
    hesitationRate: 0,
    expressiveness: 0,
  },

  /** Toggle session active state (called by useToneEngine). */
  setSessionActive: (active) => set({ isSessionActive: active }),

  /**
   * Update live metrics during an active capture session.
   * @param {Partial<typeof initialLiveMetrics>} metrics
   */
  updateLiveMetrics: (metrics) =>
    set({ liveMetrics: { ...get().liveMetrics, ...metrics } }),

  /**
   * Submit audio metrics and emotion records to the API for analysis.
   * Stores the resulting report and shows it.
   *
   * @param {Object}      audioMetrics   - Computed by useToneEngine on session end
   * @param {Array}       emotionRecords - Captured facial emotion records (optional)
   * @param {string|null} sessionId      - UUID of a linked EmotionSession (optional)
   */
  submitForAnalysis: async (audioMetrics, emotionRecords = [], sessionId = null) => {
    set({ isAnalyzing: true, error: null });
    try {
      const report = await toneService.analyze({
        audio_metrics: audioMetrics,
        emotion_records: emotionRecords,
        session_id: sessionId,
      });
      set({ coachingReport: report, showReport: true, isAnalyzing: false });
      return report;
    } catch (err) {
      const message =
        err.response?.data?.detail || "Failed to generate coaching report.";
      set({ error: message, isAnalyzing: false });
      throw new Error(message);
    }
  },

  /** Hide the report panel without discarding data. */
  closeReport: () => set({ showReport: false }),

  /** Discard the current report entirely. */
  clearReport: () => set({ coachingReport: null, showReport: false }),

  clearError: () => set({ error: null }),
}));
