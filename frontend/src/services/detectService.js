import { api } from "./api";

export const detectService = {
  /**
   * Sends an image Blob or File to the backend for emotion analysis.
   * @param {Blob|File} imageBlob - The image to analyze
   * @returns {Promise<Object>} - Bounding boxes and confidence scores
   */
  detectImage: async (imageBlob, persist = true) => {
    const formData = new FormData();
    formData.append("file", imageBlob, "frame.jpg");

    const response = await api.post(`/detect/image?persist=${persist}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Checks the readiness status of the backend AI model.
   * @returns {Promise<Object>} - Model status details
   */
  getModelStatus: async () => {
    const response = await api.get("/detect/status");
    return response.data;
  },
};
