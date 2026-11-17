const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('fb_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Check if response is file download (CSV)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return await response.text();
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || (data.errors && data.errors[0]) || 'An error occurred';
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status === 401 && !endpoint.includes('/auth/login')) {
      // Token might be expired
      // localStorage.removeItem('fb_token');
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  demoLogin: (roleType) => request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ roleType }) }),
  getMe: () => request('/auth/me'),

  // Food Listings
  getFoodListings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/food${query ? `?${query}` : ''}`);
  },
  getMyFoodListings: () => request('/food/my-listings'),
  getFoodListingById: (id) => request(`/food/${id}`),
  createFoodListing: (data) => request('/food', { method: 'POST', body: JSON.stringify(data) }),
  updateFoodListing: (id, data) => request(`/food/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancelFoodListing: (id, reason) => request(`/food/${id}/cancel`, { method: 'POST', body: JSON.stringify({ cancellation_reason: reason }) }),

  // Smart Matching
  getListingMatches: (listingId) => request(`/matches/listing/${listingId}`),
  getNgoMatches: () => request('/matches/ngo'),

  // Requests & Pickup
  acceptListing: (listing_id) => request('/requests/accept', { method: 'POST', body: JSON.stringify({ listing_id }) }),
  getMyNgoRequests: () => request('/requests/my-requests'),
  getRequestById: (id) => request(`/requests/${id}`),
  schedulePickup: (id, data) => request(`/requests/${id}/schedule`, { method: 'POST', body: JSON.stringify(data) }),
  confirmPickup: (id, data) => request(`/requests/${id}/confirm-pickup`, { method: 'POST', body: JSON.stringify(data) }),
  completeHandover: (id, data) => request(`/requests/${id}/complete-handover`, { method: 'POST', body: JSON.stringify(data) }),
  cancelRequest: (id, reason) => request(`/requests/${id}/cancel`, { method: 'POST', body: JSON.stringify({ cancellation_reason: reason }) }),

  // Organizations
  getMyOrg: () => request('/organizations/me'),
  updateMyOrg: (data) => request('/organizations/me', { method: 'PUT', body: JSON.stringify(data) }),
  getOrganizations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/organizations${query ? `?${query}` : ''}`);
  },
  updateVerification: (id, review_status, review_notes) =>
    request(`/organizations/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({ review_status, review_notes }),
    }),

  // Dashboards
  getOrganizerDashboard: () => request('/dashboard/organizer'),
  getNgoDashboard: () => request('/dashboard/ngo'),
  getAdminDashboard: () => request('/dashboard/admin'),
  getImpactStats: (scope = 'all') => request(`/dashboard/impact?dataScope=${scope}`),
  exportImpactCsv: async () => {
    const res = await fetch('/api/dashboard/impact/export-csv');
    return await res.text();
  },
  resetDemoData: () => request('/dashboard/admin/reset-demo', { method: 'POST' }),

  // Reports
  createReport: (data) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
  getReports: () => request('/reports'),
  resolveReport: (id, status, resolution_notes) =>
    request(`/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, resolution_notes }) }),
};
