import { api } from "./api";

export const scriptsService = {
  /**
   * Fetches pre-defined script presets for the Public Speaking Trainer.
   * @returns {Promise<Array>} - List of script presets
   */
  getPresets: async () => {
    const response = await api.get("/scripts/presets");
    return response.data;
  },
};

export default scriptsService;
