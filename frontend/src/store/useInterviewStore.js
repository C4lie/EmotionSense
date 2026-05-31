import { create } from "zustand";
import { interviewService } from "../services/interviewService";

export const useInterviewStore = create((set, get) => ({
  questions: [],
  currentQuestionIndex: 0,
  activeMode: "self_intro",
  interviewSession: null,
  report: null,
  isInterviewRunning: false,
  showReportModal: false,
  answers: [],

  // Live telemetry dashboard gauges values
  telemetry: {
    confidence: 60,
    focus: 60,
    stability: 60,
    energy: 60,
  },

  fetchQuestions: async (mode) => {
    try {
      const qs = await interviewService.getQuestions(mode);
      set({ questions: qs, currentQuestionIndex: 0, activeMode: mode });
    } catch (err) {
      console.error("Failed to load interview questions:", err);
    }
  },

  startInterview: async (mode) => {
    set({ report: null, showReportModal: false, answers: [], currentQuestionIndex: 0 });
    try {
      const session = await interviewService.startSession(mode);
      set({ interviewSession: session, isInterviewRunning: true });
      return session;
    } catch (err) {
      console.error("Failed to start interview session:", err);
      throw err;
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex + 1 < questions.length) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
      return true;
    }
    return false;
  },

  endInterview: async (audioMetrics) => {
    const { interviewSession } = get();
    if (!interviewSession) return;
    try {
      const sessionReport = await interviewService.closeSession(interviewSession.id, audioMetrics);
      set({
        report: sessionReport,
        isInterviewRunning: false,
        showReportModal: true,
        interviewSession: null,
      });
      return sessionReport;
    } catch (err) {
      console.error("Failed to close interview session:", err);
      throw err;
    }
  },

  setShowReportModal: (showReportModal) => set({ showReportModal }),

  setTelemetry: (telemetry) => set({ telemetry }),

  resetInterview: () => set({
    questions: [],
    currentQuestionIndex: 0,
    interviewSession: null,
    report: null,
    isInterviewRunning: false,
    showReportModal: false,
    answers: [],
  }),
}));
