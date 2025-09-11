import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('app_jwt') || sessionStorage.getItem('liff_jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding auth token to request:', config.url, token.substring(0, 20) + '...');
    } else {
      console.log('No auth token found for request:', config.url);
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      headers: error.config?.headers,
    });

    if (error.response?.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        console.log('401 Unauthorized - clearing tokens and redirecting');
        localStorage.removeItem('app_jwt');
        sessionStorage.removeItem('liff_jwt');
        
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else if (window.location.pathname.startsWith('/liff')) {
          // For LIFF routes, try to re-initialize LIFF
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  }
);

export { api };

// API endpoints
export const authAPI = {
  adminLogin: (email: string, password: string) =>
    api.post('/auth/admin/login', { email, password }),
  
  verifyLiff: (idToken: string) =>
    api.post('/auth/liff/verify', { idToken }),
};

export const bookingsAPI = {
  create: (data: any) => api.post('/bookings', data),
  get: (id: string) => api.get(`/bookings/${id}`),
  hold: (data: any) => api.post('/bookings/hold', data),
  uploadSlip: (id: string, formData: FormData) =>
    api.post(`/bookings/${id}/payment-slip`, formData),
  getUserBookings: () => api.get('/bookings/user'),
  adminGetAll: () => api.get('/admin/bookings'),
  transition: (id: string, status: string) =>
    api.post(`/admin/bookings/${id}/transition`, { status }),
  cancelHold: (id: string) => api.post(`/bookings/${id}/cancel-hold`),
};

export const capacityAPI = {
  getAvailability: (date: string) =>
    api.get(`/capacity/availability?date=${date}`),
};

export const settingsAPI = {
  getServiceArea: () => api.get('/settings/service-area'),
  getPaymentChannels: () => api.get('/settings/payment-channels'),
  getBusinessHours: () => api.get('/settings/business-hours'),
  updateSettings: (type: string, data: any) =>
    api.post(`/admin/settings/${type}`, data),
};

export const reviewsAPI = {
  create: (data: any) => api.post('/reviews', data),
};

export const adminAPI = {
  getPendingSlips: () => api.get('/admin/pending-slips'),
  reviewSlip: (bookingId: string, action: string, reason?: string) =>
    api.post(`/admin/bookings/${bookingId}/review-slip`, { action, reason }),
};