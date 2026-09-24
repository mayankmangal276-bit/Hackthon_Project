const API =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  // Authentication
  demo: (role) =>
    request('/auth/demo', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  login: (body) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  register: (body) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Donations
  donations: () => request('/donations'),

  createDonation: (body) =>
    request('/donations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Shelters & Drivers
  shelters: () => request('/shelters'),

  drivers: () => request('/drivers'),

  // Matching
  findMatch: (donationId) =>
    request('/matching/find', {
      method: 'POST',
      body: JSON.stringify({ donationId }),
    }),

  confirmMatch: (body) =>
    request('/matching/confirm', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Rescues
  rescues: () => request('/rescues'),

  updateRescue: (id, status) =>
    request(`/rescues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Analytics
  impact: () => request('/analytics/impact'),

  dashboard: () => request('/analytics/dashboard'),

  donorAnalytics: () => request('/analytics/donor'),

  dailyAnalytics: (days = 7) =>
    request(`/analytics/daily?days=${days}`),

  // AI
  ai: (text) =>
    request('/ai/extract', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};
