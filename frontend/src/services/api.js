import { auth } from '../firebase';  // Your firebase.js config

const API_BASE_URL = 'http://localhost:8000';  // Adjust if backend runs elsewhere

/**
 * Makes an authenticated API request to backend with Firebase ID token
 * @param {string} endpoint - API endpoint (e.g. '/user/profile')
 * @param {object} options - fetch options (method, body, headers, signal)
 * @returns {Promise<object>} - JSON response
 */
async function authenticatedRequest(endpoint, options = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'API request failed');
  }

  return response.json();
}

// API methods

export const api = {
  getUserProfile: () => authenticatedRequest('/user/profile'),
  getUserProgress: () => authenticatedRequest('/user/progress'),
  getEnrolledCourses: () => authenticatedRequest('/user/courses'),
  updateUserProfile: (data) =>
    authenticatedRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  // Pentesting Toolkit API methods
  runNmapScan: (data, signal) =>
    authenticatedRequest('/pentest/nmap', {
      method: 'POST',
      body: JSON.stringify(data),
      signal, // Pass signal for abort support
    }),
  runNiktoScan: (data, signal) =>
    authenticatedRequest('/pentest/nikto', {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    }),
  runDirbScan: (data, signal) =>
    authenticatedRequest('/pentest/dirb', {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    }),
  // Threat Intelligence API methods
  getLatestThreats: () => authenticatedRequest('/threats/latest'),
  getThreatStats: () => authenticatedRequest('/threats/stats'),
  refreshThreats: () =>
    authenticatedRequest('/threats/refresh', {
      method: 'POST',
    }),
  // Command Post news API methods
  getLatestNews: () => authenticatedRequest('/news/latest'),
  refreshNews: () =>
    authenticatedRequest('/news/refresh', {
      method: 'POST',
    }),
  // Phishing Analyzer API methods
  analyzePhishing: (data) =>
    authenticatedRequest('/phishing/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // Cy AI Tutor API methods
  cyChat: (data) =>
    authenticatedRequest('/cy/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cyHistory: () => authenticatedRequest('/cy/history'),

  // Sandbox API methods
  startLab: (labId) => {
    const user = auth.currentUser;
    return authenticatedRequest('/sandbox/start', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.uid, lab_id: labId }),
    });
  },
  stopLab: (containerId) =>
    authenticatedRequest(`/sandbox/stop/${containerId}`, {
      method: 'POST',
    }),
  getLabStatus: () => authenticatedRequest('/sandbox/status'),

  // Code Analysis API methods
  analyzeCode: (data) =>
    authenticatedRequest('/analysis/scan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // PQC Lab API methods
  executePQC: (algorithm) => {
    // Routes to either /execute/kyber or /execute/dilithium based on frontend algo selection
    const endpoint = algorithm.includes("Kyber") ? "/execute/kyber" : "/execute/dilithium";
    return authenticatedRequest(`/pqc${endpoint}`, {
      method: 'POST',
    });
  },
  benchmarkPQC: (data) => {
    const user = auth.currentUser;
    return authenticatedRequest('/pqc/benchmark', {
      method: 'POST',
      body: JSON.stringify({ ...data, user_id: user?.uid }),
    });
  },
  submitPQCScore: (scoreDelta) => {
    const user = auth.currentUser;
    return authenticatedRequest('/pqc/score', {
      method: 'POST',
      body: JSON.stringify({ user_id: user?.uid, score_delta: scoreDelta }),
    });
  },
  completePQCModule: () => {
    const user = auth.currentUser;
    return authenticatedRequest('/pqc/complete', {
      method: 'POST',
      body: JSON.stringify({ user_id: user?.uid, score_delta: 0 }),
    });
  },

  // Helper for sandboxApi which uses its own routing structure
  sandboxRequest: (endpoint, options) => authenticatedRequest(endpoint, options)
};
