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
      // Only redirect when we actually had a token stored (real session expiry).
      // If there is no token, the user is in mock/offline mode — do NOT redirect,
      // let the caller handle the error gracefully via onError / catch.
      const hadToken = !!localStorage.getItem('authToken');
      if (hadToken && !window.location.pathname.startsWith('/auth/')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Convenience wrappers ──────────────────────────────────────────────────────

export const marketApi = {
  quotes: () => api.get('/market-quotes'),
};

export const statsApi = {
  get: () => api.get('/stats'),
};

export const myApi = {
  appointments: () => api.get('/my/appointments'),
};

export const coursePlanApi = {
  list:          (params)           => api.get('/course-plans', { params }),
  create:        (data)             => api.post('/admin/course-plans', data),
  update:        (id, d)            => api.put(`/admin/course-plans/${id}`, d),
  remove:        (id)               => api.delete(`/admin/course-plans/${id}`),
  addFeature:    (planId, d)        => api.post(`/admin/course-plans/${planId}/features`, d),
  updateFeature: (planId, fId, d)   => api.put(`/admin/course-plans/${planId}/features/${fId}`, d),
  removeFeature: (planId, fId)      => api.delete(`/admin/course-plans/${planId}/features/${fId}`),
};

export const courseAccessApi = {
  allGrants:    ()               => api.get('/admin/courses/all-grants'),
  grants:       (planId)         => api.get(`/admin/courses/${planId}/access-grants`),
  grant:        (planId, data)   => api.post(`/admin/courses/${planId}/access-grants`, data),
  extend:       (planId, grantId, data) => api.patch(`/admin/courses/${planId}/access-grants/${grantId}`, data),
  revoke:       (planId, grantId) => api.delete(`/admin/courses/${planId}/access-grants/${grantId}`),
  updateBotPlan:(planId, data)   => api.patch(`/admin/courses/${planId}/bot-plan`, data),
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

export const courseRequestApi = {
  mine:         ()         => api.get('/my/course-requests'),
  create:       (data)     => api.post('/my/course-requests', data),
  list:         ()         => api.get('/admin/course-requests'),
  updateStatus: (id, status) => api.put(`/admin/course-requests/${id}`, { status }),
};

export const calendarApi = {
  events:      ()       => api.get('/admin/calendar'),
  createTask:  (data)   => api.post('/admin/calendar/tasks', data),
  updateTask:  (id, d)  => api.put(`/admin/calendar/tasks/${id}`, d),
  removeTask:  (id)     => api.delete(`/admin/calendar/tasks/${id}`),
};

export const webinarApi = {
  list:   (params) => api.get('/webinars', { params }),
  create: (data)   => api.post('/admin/webinars', data),
  update: (id, d)  => api.put(`/admin/webinars/${id}`, d),
  remove: (id)     => api.delete(`/admin/webinars/${id}`),
};

export const financeApi = {
  transactions:      (params) => api.get('/admin/finance/transactions', { params }),
  addTransaction:    (data)   => api.post('/admin/finance/transactions', data),
  updateTransaction: (id, d)  => api.put(`/admin/finance/transactions/${id}`, d),
  removeTransaction: (id)     => api.delete(`/admin/finance/transactions/${id}`),
  expenses:          (params) => api.get('/admin/finance/expenses', { params }),
  addExpense:        (data)   => api.post('/admin/finance/expenses', data),
  removeExpense:     (id)     => api.delete(`/admin/finance/expenses/${id}`),
  wallet:            ()       => api.get('/admin/finance/wallet'),
  topUp:             (data)   => api.post('/admin/finance/wallet/topup', data),
  convert:           (data)   => api.post('/admin/finance/wallet/convert', data),
  updateRate:        (rate)   => api.post('/admin/finance/wallet/rate', { rate }),
};

export const marketingApi = {
  plans:             ()           => api.get('/admin/marketing/plans'),
  createPlan:        (data)       => api.post('/admin/marketing/plans', data),
  updatePlan:        (id, d)      => api.put(`/admin/marketing/plans/${id}`, d),
  removePlan:        (id)         => api.delete(`/admin/marketing/plans/${id}`),
  addItem:           (pId, d)     => api.post(`/admin/marketing/plans/${pId}/items`, d),
  updateItem:        (pId, iId, d)=> api.put(`/admin/marketing/plans/${pId}/items/${iId}`, d),
  removeItem:        (pId, iId)   => api.delete(`/admin/marketing/plans/${pId}/items/${iId}`),
  mediaItems:        (params)     => api.get('/admin/marketing/media', { params }),
  addMedia:          (data)       => api.post('/admin/marketing/media', data),
  updateMedia:       (id, d)      => api.put(`/admin/marketing/media/${id}`, d),
  removeMedia:       (id)         => api.delete(`/admin/marketing/media/${id}`),
  sentNotifications: ()           => api.get('/admin/marketing/sent-notifications'),
  sendNotification:  (data)       => api.post('/admin/marketing/send-notification', data),
};

export const notificationApi = {
  list:        ()   => api.get('/notifications'),
  markRead:    (id) => api.post(`/notifications/${id}/read`),
  markAllRead: ()   => api.post('/notifications/read-all'),
  remove:      (id) => api.delete(`/notifications/${id}`),
};

export const dashboardApi = {
  overview: () => api.get('/admin/overview'),
};

export const analyticsApi = {
  get: () => api.get('/admin/analytics'),
};

export const kpiApi = {
  definitions:       ()           => api.get('/admin/kpi/definitions'),
  updateDefinition:  (id, d)      => api.put(`/admin/kpi/definitions/${id}`, d),
  entries:           (params)     => api.get('/admin/kpi/entries', { params }),
  addEntry:          (data)       => api.post('/admin/kpi/entries', data),
  updateEntry:       (id, d)      => api.put(`/admin/kpi/entries/${id}`, d),
  deleteEntry:       (id)         => api.delete(`/admin/kpi/entries/${id}`),
  summary:           (params)     => api.get('/admin/kpi/summary', { params }),
  scorecard:         (params)     => api.get('/coach/kpi/scorecard', { params }),
};

export const contentApi = {
  list:     ()       => api.get('/admin/content'),
  generate: (data)   => api.post('/admin/content/generate', data),
  save:     (data)   => api.post('/admin/content', data),
  remove:   (id)     => api.delete(`/admin/content/${id}`),
};

export const settingsApi = {
  get:    ()       => api.get('/admin/settings'),
  update: (data)   => api.put('/admin/settings', data),
};

export const activityLogApi = {
  list: (params) => api.get('/admin/activity-logs', { params }),
};

export const coachApi = {
  list:   ()       => api.get('/admin/coaches'),
  create: (data)   => api.post('/admin/coaches', data),
  update: (id, d)  => api.put(`/admin/coaches/${id}`, d),
  remove: (id)     => api.delete(`/admin/coaches/${id}`),
};

export const roleApi = {
  list:        ()      => api.get('/admin/roles'),
  permissions: ()      => api.get('/admin/permissions'),
  create:      (data)  => api.post('/admin/roles', data),
  update:      (id, d) => api.put(`/admin/roles/${id}`, d),
  remove:      (id)    => api.delete(`/admin/roles/${id}`),
};

export default api;
