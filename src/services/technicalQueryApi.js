import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

// Mock technical queries dataset
export const INITIAL_TECHNICAL_QUERIES = [];

let queryStore = [...INITIAL_TECHNICAL_QUERIES];

export const technicalQueryApi = {
  myDashboard: async () => {
    try {
      const res = await client.get('/technical-queries/dashboard/my');
      return res.data;
    } catch (e) {
      return {
        data: {
          total_queries: queryStore.length,
          open_count: queryStore.filter((q) => q.status === 'open').length,
          resolved_count: queryStore.filter((q) => q.status === 'resolved').length,
          closed_count: queryStore.filter((q) => q.status === 'closed').length,
          pending_count: queryStore.filter((q) => q.status === 'open' || q.status === 'in_progress').length,
          urgent_count: queryStore.filter((q) => q.priority === 'urgent').length,
          reopened_count: queryStore.filter((q) => q.status === 'reopened').length,
          avg_resolution_hours: 0
        }
      };
    }
  },

  list: async (params = {}) => {
    try {
      const res = await client.get('/technical-queries', { params });
      return res.data;
    } catch (e) {
      let filtered = [...queryStore];
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (q) =>
            q.subject.toLowerCase().includes(s) ||
            q.query_number.toLowerCase().includes(s) ||
            (q.isbn && q.isbn.includes(s))
        );
      }
      if (params.status && params.status !== 'all') {
        filtered = filtered.filter((q) => q.status === params.status);
      }
      if (params.category && params.category !== 'all') {
        filtered = filtered.filter((q) => q.category === params.category);
      }
      if (params.priority && params.priority !== 'all') {
        filtered = filtered.filter((q) => q.priority === params.priority);
      }
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 10;
      const start = (page - 1) * limit;
      return {
        data: filtered.slice(start, start + limit),
        meta: {
          total: filtered.length,
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit) || 1
        }
      };
    }
  },

  get: async (id) => {
    try {
      const res = await client.get(`/technical-queries/${id}`);
      return res.data;
    } catch (e) {
      const q = queryStore.find((item) => String(item.id) === String(id) || item.query_number === id) || queryStore[0];
      return { data: q };
    }
  },

  create: async (formData) => {
    try {
      const res = await client.post('/technical-queries', formData);
      return res.data;
    } catch (e) {
      const subject = formData.get ? formData.get('subject') : formData.subject;
      const desc = formData.get ? formData.get('description') : formData.description;
      const cat = formData.get ? formData.get('category') : formData.category;
      const priority = formData.get ? formData.get('priority') : formData.priority;
      const isbn = formData.get ? formData.get('isbn') : formData.isbn;
      const newQuery = {
        id: Date.now(),
        query_number: `TQ-2026-${Math.floor(100 + Math.random() * 900)}`,
        subject: subject || 'New Technical Query',
        description: desc || '',
        isbn: isbn || null,
        category: cat || 'other',
        priority: priority || 'normal',
        status: 'open',
        created_by_name: 'Current User',
        assigned_to_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: null,
        attachment_count: 0,
        attachments: [],
        timeline: [{ id: Date.now(), action: 'Query raised', user: 'Current User', timestamp: new Date().toISOString() }],
        comments: []
      };
      queryStore.unshift(newQuery);
      return { data: newQuery };
    }
  },

  addComment: async (id, commentText) => {
    const q = queryStore.find((item) => String(item.id) === String(id));
    if (q) {
      const comment = {
        id: Date.now(),
        user_name: 'Current User',
        comment: commentText,
        created_at: new Date().toISOString()
      };
      q.comments.push(comment);
      return { data: comment };
    }
    return { data: {} };
  },

  updateStatus: async (id, newStatus) => {
    const q = queryStore.find((item) => String(item.id) === String(id));
    if (q) {
      q.status = newStatus;
      q.updated_at = new Date().toISOString();
      q.timeline.push({
        id: Date.now(),
        action: `Status changed to ${newStatus}`,
        user: 'Current User',
        timestamp: new Date().toISOString()
      });
      return { data: q };
    }
    return { data: {} };
  },

  isbnHistory: async (isbn) => {
    try {
      const res = await client.get(`/technical-queries/isbn/${isbn}`);
      return res.data;
    } catch (e) {
      const matches = queryStore.filter((q) => q.isbn === isbn);
      return { data: matches };
    }
  }
};

export const reportApi = {
  dashboard: async () => {
    try {
      const res = await client.get('/reports/technical-queries/dashboard');
      return res.data;
    } catch (e) {
      return {
        data: {
          total_queries: queryStore.length,
          open_count: queryStore.filter((q) => q.status === 'open').length,
          resolved_count: queryStore.filter((q) => q.status === 'resolved').length,
          closed_count: queryStore.filter((q) => q.status === 'closed').length,
          urgent_count: queryStore.filter((q) => q.priority === 'urgent').length,
          high_count: queryStore.filter((q) => q.priority === 'high').length,
          pending_count: queryStore.filter((q) => q.status === 'open' || q.status === 'in_progress').length,
          reopened_count: queryStore.filter((q) => q.status === 'reopened').length,
          avg_resolution_hours: 0
        }
      };
    }
  },

  categoryAnalytics: async () => {
    const catCounts = {};
    queryStore.forEach((q) => {
      catCounts[q.category] = (catCounts[q.category] || 0) + 1;
    });
    const total = queryStore.length || 1;
    return {
      data: Object.entries(catCounts).map(([cat, count]) => ({
        category: cat,
        count,
        percentage: Number(((count / total) * 100).toFixed(1))
      }))
    };
  },

  trendReport: async () => {
    return {
      data: []
    };
  }
};

export const notificationApi = {
  list: async () => ({ data: [] }),
  markRead: async (id) => ({ success: true })
};
