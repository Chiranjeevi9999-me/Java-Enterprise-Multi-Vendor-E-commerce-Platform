import api from './axios';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getReviews: (id) => api.get(`/products/${id}/reviews`),
  create: (data) => api.post('/products', data),
  updateStatus: (id, status) => api.put(`/products/${id}/status?status=${status}`),
  delete: (id) => api.delete(`/products/${id}`),
  getByVendor: (vendorId) => api.get(`/products/vendor/${vendorId}`),
};

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
};

export const vendorApi = {
  getAll: () => api.get('/vendors'),
  getById: (id) => api.get(`/vendors/${id}`),
  getMyProfile: () => api.get('/vendors/me'),
  updateStatus: (vendorId, status) => api.put(`/vendors/admin/${vendorId}/status?status=${status}`),
  updateProfile: (data) => api.put('/vendors/profile', data),
};
