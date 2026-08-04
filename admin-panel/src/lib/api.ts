import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://gmsilver-production.up.railway.app/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = Cookies.get('refreshToken');
      if (!refreshToken) {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = data.data;

        Cookies.set('accessToken', accessToken, { secure: true, sameSite: 'strict' });
        Cookies.set('refreshToken', newRefreshToken, {
          secure: true,
          sameSite: 'strict',
        });

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// ─── API SERVICES ─────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getMostViewed: (limit = 10) =>
    api.get(`/analytics/products/most-viewed?limit=${limit}`),
  getMostOrdered: (limit = 10) =>
    api.get(`/analytics/products/most-ordered?limit=${limit}`),
  getRevenueChart: (months = 6) =>
    api.get(`/analytics/revenue/chart?months=${months}`),
  getActiveUsers: () => api.get('/analytics/users/active'),
  getSearchKeywords: () => api.get('/analytics/search/keywords'),
};

export const usersApi = {
  create: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role?: string;
    status?: string;
  }) => api.post('/users', data),
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/users/${id}/status`, { status }),
  updateCredentials: (
    id: string,
    data: {
      password?: string;
      mpin?: string;
    },
  ) => api.patch(`/users/${id}/credentials`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const categoriesApi = {
  getAll: (params?: any) => api.get('/categories', { params }),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: FormData) =>
    api.post('/categories', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: FormData) =>
    api.put(`/categories/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const productsApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: FormData) =>
    api.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: FormData) =>
    api.put(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/products/${id}`),
  bulkDelete: (ids: string[]) => api.delete('/products/bulk', { data: { ids } }),
  addImages: (id: string, data: FormData) =>
    api.post(`/products/${id}/images`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removeImage: (productId: string, imageId: string) =>
    api.delete(`/products/${productId}/images/${imageId}`),
};

export const ordersApi = {
  getAll: (params?: any) => api.get('/orders/all', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/orders/${id}/status`, { status, reason }),
};

export const invoicesApi = {
  generateInvoice: (orderId: string) =>
    api.post(`/invoices/generate/${orderId}`),
  getByOrderId: (orderId: string) =>
    api.get(`/invoices/order/${orderId}`),
};

export const notificationsApi = {
  sendBroadcast: (title: string, body: string, link?: string, data?: any) =>
    api.post('/notifications/send', {
      title,
      body,
      ...(link ? { link } : {}),
      ...(data ? { data } : {}),
    }),
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/notifications/history', { params }),
};

export const excelApi = {
  exportProducts: () =>
    api.get('/excel/export/products', { responseType: 'blob' }),
  importProducts: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/excel/import/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportUsers: () =>
    api.get('/excel/export/users', { responseType: 'blob' }),
  exportOrders: (params?: any) =>
    api.get('/excel/export/orders', { params, responseType: 'blob' }),
};

export const bannersApi = {
  getAll: (params?: any) => api.get('/banners', { params }),
  getById: (id: string) => api.get(`/banners/${id}`),
  create: (data: FormData) =>
    api.post('/banners', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: FormData) =>
    api.put(`/banners/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/banners/${id}`),
};

export const homeWidgetsApi = {
  getTopProducts: () => api.get('/home-widgets/top-products'),
  updateTopProducts: (data: any) => api.put('/home-widgets/top-products', data),
};

export const auditLogsApi = {
  getAll: (params?: any) => api.get('/audit-logs', { params }),
  getSummary: (startDate?: string, endDate?: string) =>
    api.get('/audit-logs/summary', { params: { startDate, endDate } }),
};
