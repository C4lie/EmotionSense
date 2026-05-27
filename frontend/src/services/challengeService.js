import { api } from "./api";

export const challengeService = {
  getTodayChallenge: async () => {
    const response = await api.get("/challenges/today");
    return response.data;
  },
  verifyChallenge: async (sessionId) => {
    const response = await api.post("/challenges/verify", { session_id: sessionId });
    return response.data;
  },
  getHistory: async (page = 1, size = 10) => {
    const response = await api.get(`/challenges/history?page=${page}&size=${size}`);
    return response.data;
  },
};
