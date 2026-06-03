import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Only redirect when NOT already on an auth page to avoid reload loops
      if (!window.location.pathname.startsWith('/auth/')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Convenience wrappers ──────────────────────────────────────────────────────

export const courseApi = {
  list:    (params) => api.get('/courses', { params }),
  get:     (id)     => api.get(`/courses/${id}`),
  create:  (data)   => api.post('/admin/courses', data),
  update:  (id, d)  => api.put(`/admin/courses/${id}`, d),
  remove:  (id)     => api.delete(`/admin/courses/${id}`),
};

export const coursePlanApi = {
  list:           (params) => api.get('/course-plans', { params }),
  create:         (data)   => api.post('/admin/course-plans', data),
  update:         (id, d)  => api.put(`/admin/course-plans/${id}`, d),
  remove:         (id)     => api.delete(`/admin/course-plans/${id}`),
  addFeature:     (planId, d) => api.post(`/admin/course-plans/${planId}/features`, d),
  updateFeature:  (planId, fId, d) => api.put(`/admin/course-plans/${planId}/features/${fId}`, d),
  removeFeature:  (planId, fId) => api.delete(`/admin/course-plans/${planId}/features/${fId}`),
};

export const clientApi = {
  list:    (params) => api.get('/admin/crm', { params }),
  get:     (id)     => api.get(`/admin/crm/${id}`),
  create:  (data)   => api.post('/admin/crm', data),
  update:  (id, d)  => api.put(`/admin/crm/${id}`, d),
  remove:  (id)     => api.delete(`/admin/crm/${id}`),
  convert: (id)     => api.post(`/admin/crm/${id}/convert`),
};

export const blogApi = {
  list:   (params) => api.get('/blog', { params }),
  get:    (id)     => api.get(`/blog/${id}`),
  create: (data)   => api.post('/admin/blog', data),
  update: (id, d)  => api.put(`/admin/blog/${id}`, d),
  remove: (id)     => api.delete(`/admin/blog/${id}`),
};

export const campaignApi = {
  list:   ()       => api.get('/admin/marketing/campaigns'),
  create: (data)   => api.post('/admin/marketing/campaigns', data),
  update: (id, d)  => api.put(`/admin/marketing/campaigns/${id}`, d),
  remove: (id)     => api.delete(`/admin/marketing/campaigns/${id}`),
};

export const ticketApi = {
  list:   (params) => api.get('/admin/tickets', { params }),
  get:    (id)     => api.get(`/admin/tickets/${id}`),
  create: (data)   => api.post('/tickets', data),
  update: (id, d)  => api.put(`/admin/tickets/${id}`, d),
  remove: (id)     => api.delete(`/admin/tickets/${id}`),
};

export const appointmentApi = {
  list:   (params) => api.get('/admin/appointments', { params }),
  create: (data)   => api.post('/admin/appointments', data),
  update: (id, d)  => api.put(`/admin/appointments/${id}`, d),
  remove: (id)     => api.delete(`/admin/appointments/${id}`),
};

export const webinarApi = {
  list:   (params) => api.get('/webinars', { params }),
  create: (data)   => api.post('/admin/webinars', data),
  update: (id, d)  => api.put(`/admin/webinars/${id}`, d),
  remove: (id)     => api.delete(`/admin/webinars/${id}`),
};

export const financeApi = {
  transactions:       (params)  => api.get('/admin/finance/transactions', { params }),
  addTransaction:     (data)    => api.post('/admin/finance/transactions', data),
  updateTransaction:  (id, d)   => api.put(`/admin/finance/transactions/${id}`, d),
  removeTransaction:  (id)      => api.delete(`/admin/finance/transactions/${id}`),
  expenses:           (params)  => api.get('/admin/finance/expenses', { params }),
  addExpense:         (data)    => api.post('/admin/finance/expenses', data),
  removeExpense:      (id)      => api.delete(`/admin/finance/expenses/${id}`),
  wallet:             ()        => api.get('/admin/finance/wallet'),
  topUp:              (data)    => api.post('/admin/finance/wallet/topup', data),
  convert:            (data)    => api.post('/admin/finance/wallet/convert', data),
  updateRate:         (rate)    => api.post('/admin/finance/wallet/rate', { rate }),
};

export const marketingApi = {
  plans:           ()           => api.get('/admin/marketing/plans'),
  createPlan:      (data)       => api.post('/admin/marketing/plans', data),
  updatePlan:      (id, d)      => api.put(`/admin/marketing/plans/${id}`, d),
  removePlan:      (id)         => api.delete(`/admin/marketing/plans/${id}`),
  addItem:         (pId, d)     => api.post(`/admin/marketing/plans/${pId}/items`, d),
  updateItem:      (pId, iId, d)=> api.put(`/admin/marketing/plans/${pId}/items/${iId}`, d),
  removeItem:      (pId, iId)   => api.delete(`/admin/marketing/plans/${pId}/items/${iId}`),
  mediaItems:      (params)     => api.get('/admin/marketing/media', { params }),
  addMedia:        (data)       => api.post('/admin/marketing/media', data),
  updateMedia:     (id, d)      => api.put(`/admin/marketing/media/${id}`, d),
  removeMedia:     (id)         => api.delete(`/admin/marketing/media/${id}`),
  sentNotifications: ()         => api.get('/admin/marketing/sent-notifications'),
  sendNotification: (data)      => api.post('/admin/marketing/send-notification', data),
};

export const notificationApi = {
  list:       ()   => api.get('/notifications'),
  markRead:   (id) => api.post(`/notifications/${id}/read`),
  markAllRead: ()  => api.post('/notifications/read-all'),
  remove:     (id) => api.delete(`/notifications/${id}`),
};

export const dashboardApi = {
  overview: () => api.get('/admin/overview'),
};

export const coachApi = {
  list:   ()       => api.get('/admin/coaches'),
  create: (data)   => api.post('/admin/coaches', data),
  update: (id, d)  => api.put(`/admin/coaches/${id}`, d),
  remove: (id)     => api.delete(`/admin/coaches/${id}`),
};

export const roleApi = {
  list:        ()        => api.get('/admin/roles'),
  permissions: ()        => api.get('/admin/permissions'),
  create:      (data)    => api.post('/admin/roles', data),
  update:      (id, d)   => api.put(`/admin/roles/${id}`, d),
  remove:      (id)      => api.delete(`/admin/roles/${id}`),
};

export default api;
