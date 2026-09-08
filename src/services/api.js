// API Client for FMS Customer Feedback & Critic Report Module

const API_BASE = '/api';

export function getAuthHeaders() {
  const token = localStorage.getItem('fms_auth_token');
  const role = localStorage.getItem('fms_user_role') || 'ADMIN';
  
  const headers = {
    'Content-Type': 'application/json',
    'x-user-role': role
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export async function request(endpoint, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: `Request failed with status ${response.status}` };
    }
    const error = new Error(errorData.message || errorData?.error?.message || 'Server error occurred');
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),

  // Report Summary
  getSummary: async () => {
    try {
      return await request('/reports/summary');
    } catch (e) {
      return { data: { total: 0, positive: 0, negative: 0, avg_rating: 0 } };
    }
  },

  // Feedback Data Grid
  getFeedbackList: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    try {
      const res = await request(`/reports/feedback?${query.toString()}`);
      if (typeof res === 'string' || !res?.data) {
        throw new Error('Invalid feedback response');
      }
      return res;
    } catch (e) {
      return {
        success: true,
        data: [],
        pagination: {
          page: Number(params.page) || 1,
          limit: Number(params.limit) || 10,
          total: 0,
          totalPages: 1
        }
      };
    }
  },

  // ISBN Deep-Dive & Timeline
  getIsbnReport: (isbn) => request(`/reports/feedback/isbn/${encodeURIComponent(isbn)}`),

  // Book Title Rollup Matrix
  getBookTitleReport: (query = '') => request(`/reports/feedback/book-titles?query=${encodeURIComponent(query)}`),

  // Positive Feedback Report
  getPositiveFeedback: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/reports/feedback/positive?${query.toString()}`);
  },

  // Negative / Critic Feedback Report
  getNegativeFeedback: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/reports/feedback/negative?${query.toString()}`);
  },

  // Top Appreciated Books (10)
  getTopAppreciated: (limit = 10) => request(`/reports/feedback/top-appreciated?limit=${limit}`),

  // Top Criticized Books (10)
  getTopCriticized: (limit = 10) => request(`/reports/feedback/top-criticized?limit=${limit}`),

  // Rating Analytics
  getRatingAnalytics: () => request('/reports/feedback/analytics/ratings'),

  // Feedback Trends (Daily, Weekly, Monthly, Quarterly, Yearly)
  getTrends: (interval = 'monthly', compare = true) => 
    request(`/reports/feedback/analytics/trends?interval=${interval}&compare=${compare}`),

  // Export URLs
  getExportUrl: (format = 'csv', filters = {}) => {
    const query = new URLSearchParams({ format, ...filters });
    return `${API_BASE}/reports/feedback/export?${query.toString()}`;
  },

  // Public Customer Feedback Submission
  submitCustomerFeedback: (data) => request('/feedback/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

