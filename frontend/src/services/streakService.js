import { api } from "./api";

export const streakService = {
  getStatus: async () => {
    const response = await api.get("/streaks/status");
    return response.data;
  },
  freezeStreak: async () => {
    const response = await api.post("/streaks/freeze");
    return response.data;
  },
};
