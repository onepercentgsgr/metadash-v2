/**
 * API Client for MetaDash Frontend
 * Handles JWT authentication and all API calls to backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

function getAuthHeader() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
  };

  const res = await fetch(url, config);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `API Error: ${res.status}`);
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export const api = {
  // Auth endpoints
  login: (email, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password, name = "") =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name: name || email.split("@")[0] }),
    }),

  getMe: () => apiFetch("/auth/me"),

  // Config endpoints
  getConfig: () => apiFetch("/config"),

  updateConfig: (config) =>
    apiFetch("/config", {
      method: "POST",
      body: JSON.stringify(config),
    }),

  // Campaign endpoints
  getCampaigns: (period = "last_7d") =>
    apiFetch(`/campaigns?date_preset=${period}`),

  toggleCampaign: (campaignId, action) =>
    apiFetch("/campaigns/action", {
      method: "POST",
      body: JSON.stringify({ campaign_id: campaignId, action }),
    }),

  // Agent endpoints
  runOptimizer: (payload) =>
    apiFetch("/agent/optimize", {
      method: "POST",
      body: JSON.stringify(payload || { prompt: "", context: {} }),
    }),

  runFinance: (payload) =>
    apiFetch("/agent/finance", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  runScripts: (payload) =>
    apiFetch("/agent/scripts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  runCreatives: () => apiFetch("/agent/creatives", { method: "POST" }),

  runGrowth: (payload) =>
    apiFetch("/agent/growth", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  runCro: () => apiFetch("/agent/cro", { method: "POST" }),

  runLandingAudit: (payload) =>
    apiFetch("/agent/landing-audit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  runFullAudit: (payload) =>
    apiFetch("/agent/full-audit", {
      method: "POST",
      body: JSON.stringify(payload || { prompt: "", context: {} }),
    }),

  // Google Analytics endpoints
  runAnalytics: (days = 30) =>
    apiFetch("/agent/analytics", {
      method: "POST",
      body: JSON.stringify({ prompt: "", context: { days } }),
    }),

  getAnalyticsData: (days = 30) => apiFetch(`/analytics/data?days=${days}`),

  // Autonomous actions endpoints
  getAutonomousActions: (limit = 50, status = null) => {
    const url = `/autonomous/actions?limit=${limit}${status ? `&status=${status}` : ''}`;
    return apiFetch(url);
  },

  approveAutonomousAction: (actionId) =>
    apiFetch(`/autonomous/actions/${actionId}/approve`, { method: "POST" }),

  rejectAutonomousAction: (actionId) =>
    apiFetch(`/autonomous/actions/${actionId}/reject`, { method: "POST" }),

  // Admin endpoints
  getUsers: () => apiFetch("/admin/users"),

  toggleUser: (userId, active) =>
    apiFetch(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),

  extendTrial: (userId) =>
    apiFetch(`/admin/users/${userId}/extend-trial`, {
      method: "POST",
    }),

  setPlan: (userId, plan) =>
    apiFetch(`/admin/users/${userId}/plan`, {
      method: "POST",
      body: JSON.stringify({ plan }),
    }),

  getStats: () => apiFetch("/admin/stats"),

  // Finance endpoints
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_URL}/finance/upload`, {
      method: "POST",
      headers: { Authorization: getAuthHeader().Authorization },
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    });
  },

  getRecords: () => apiFetch("/finance/records"),

  // Orders endpoints
  getOrders: () => apiFetch("/orders"),

  // Exposed apiFetch for custom calls
  apiFetch,
};
