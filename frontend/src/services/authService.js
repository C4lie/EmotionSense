import { api } from "./api";

export const authService = {
  /**
   * Register a new user.
   * @param {string} name - User's full name
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<Object>} - User details and access token
   */
  register: async (name, email, password) => {
    const response = await api.post("/auth/register", { name, email, password });
    return response.data;
  },

  /**
   * Login with email and password.
   * @param {string} email - Registered email address
   * @param {string} password - User password
   * @returns {Promise<Object>} - User details and access token
   */
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  /**
   * Fetch profile data of the currently logged-in user.
   * @returns {Promise<Object>} - Current user info (id, name, email)
   */
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};
