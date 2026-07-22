import api from './api';

export const authService = {
  register: (data)         => api.post('/auth/register', data),
  login:    (data)         => api.post('/auth/login', data),
  logout:   (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refresh:  (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export const dashboardService = { get: () => api.get('/dashboard') };

export const accountService = {
  getAll:  ()     => api.get('/accounts'),
  getById: (id)   => api.get(`/accounts/${id}`),
  create:  (data) => api.post('/accounts', data),
};

export const transactionService = {
  getAll:   (params) => api.get('/transactions', { params }),
  getById:  (id)     => api.get(`/transactions/${id}`),
  transfer: (data)   => api.post('/transactions/transfer', data),
};

export const beneficiaryService = {
  getAll:          (params)          => api.get('/beneficiaries', { params }),
  create:          (data)            => api.post('/beneficiaries', data),
  toggleFavourite: (id, isFavourite) => api.patch(`/beneficiaries/${id}/favourite`, { isFavourite }),
  delete:          (id)              => api.delete(`/beneficiaries/${id}`),
};

export const userService = {
  getProfile:    ()     => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

export const scheduledService = {
  create: (data) => api.post('/scheduled', data),
  getAll: ()     => api.get('/scheduled'),
  cancel: (id)   => api.patch(`/scheduled/${id}/cancel`),
};

export const standingService = {
  create: (data) => api.post('/standing', data),
  getAll: ()     => api.get('/standing'),
  pause:  (id)   => api.patch(`/standing/${id}/pause`),
  resume: (id)   => api.patch(`/standing/${id}/resume`),
  cancel: (id)   => api.patch(`/standing/${id}/cancel`),
};

export const upiService = {
  activate:    ()      => api.post('/upi/activate'),
  getMyUpiId:  ()      => api.get('/upi/me'),
  resolve:     (upiId) => api.get(`/upi/resolve/${encodeURIComponent(upiId)}`),
};

export const adminService = {
  getDashboard:    ()       => api.get('/admin/dashboard'),
  getUsers:        (params) => api.get('/admin/users', { params }),
  getUserById:     (id)     => api.get(`/admin/users/${id}`),
  getAccounts:     (params) => api.get('/admin/accounts', { params }),
  freezeAccount:   (id)     => api.patch(`/admin/accounts/${id}/freeze`),
  unfreezeAccount: (id)     => api.patch(`/admin/accounts/${id}/unfreeze`),
  getAuditLogs:    (params) => api.get('/admin/audit-logs', { params }),
};

// Phase 5 — AI
export const aiService = {
  chat:           (message, history) => api.post('/ai/chat', { message, history }),
  insights:       ()                 => api.get('/ai/insights'),
  fraud:          ()                 => api.get('/ai/fraud'),
  smartDashboard: ()                 => api.get('/ai/smart-dashboard'),
};
