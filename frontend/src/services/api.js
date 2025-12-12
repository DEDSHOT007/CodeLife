import { auth } from '../firebase';  // Your firebase.js config

const API_BASE_URL = 'http://localhost:8000';  // Adjust if backend runs elsewhere

/**
 * Makes an authenticated API request to backend with Firebase ID token
 * @param {string} endpoint - API endpoint (e.g. '/user/profile')
 * @param {object} options - fetch options (method, body, headers)
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
  runNmapScan: (data) =>
    authenticatedRequest('/pentest/nmap', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  runNiktoScan: (data) =>
    authenticatedRequest('/pentest/nikto', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  runDirbScan: (data) =>
    authenticatedRequest('/pentest/dirb', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // Threat Intelligence API methods
  getLatestThreats: () => authenticatedRequest('/threats/latest'),
  getThreatStats: () => authenticatedRequest('/threats/stats'),
  refreshThreats: () =>
    authenticatedRequest('/threats/refresh', {
      method: 'POST',
    }),
};
