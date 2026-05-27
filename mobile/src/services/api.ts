import { Platform } from 'react-native';

// For Android emulator, 10.0.2.2 is mapped to host's localhost
// For iOS emulator or web, 127.0.0.1 works
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }
  return 'http://127.0.0.1:8000/api';
};

const BASE_URL = getBaseUrl();

let userToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  userToken = token;
};

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `API request failed with status ${response.status}`);
  }

  return response.json();
};

export const authService = {
  login: async (email: string, password: string) => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.access_token);
    return data;
  },
  register: async (name: string, email: string, password: string) => {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setAuthToken(data.access_token);
    return data;
  },
  getMe: async () => {
    return apiCall('/auth/me');
  },
};

export const challengeService = {
  getToday: async () => {
    return apiCall('/challenges/today');
  },
  verify: async (sessionId: string) => {
    return apiCall('/challenges/verify', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  },
  getHistory: async () => {
    return apiCall('/challenges/history');
  },
};

export const streakService = {
  getStatus: async () => {
    return apiCall('/streaks/status');
  },
  freeze: async () => {
    return apiCall('/streaks/freeze', {
      method: 'POST',
    });
  },
};

export const subscriptionService = {
  getStatus: async () => {
    return apiCall('/subscription/status');
  },
  activate: async () => {
    return apiCall('/subscription/activate', {
      method: 'POST',
    });
  },
};

export const sessionService = {
  startSession: async (type: string = 'speaking') => {
    return apiCall('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ session_type: type }),
    });
  },
  addFrame: async (sessionId: string, emotion: string, confidence: number) => {
    // Send a frame log to the session
    return apiCall(`/sessions/${sessionId}/frames`, {
      method: 'POST',
      body: JSON.stringify({
        dominant_emotion: emotion,
        confidence: confidence,
        emotion_scores: {
          happy: emotion === 'happy' ? 100.0 : 0.0,
          neutral: emotion === 'neutral' ? 100.0 : 0.0,
          sad: emotion === 'sad' ? 100.0 : 0.0,
          angry: emotion === 'angry' ? 100.0 : 0.0,
        }
      }),
    });
  },
  closeSession: async (sessionId: string) => {
    return apiCall(`/sessions/${sessionId}/close`, {
      method: 'POST',
    });
  },
};
