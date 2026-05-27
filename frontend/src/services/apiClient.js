import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry && !original?.url?.includes('/auth/refresh')) {
      original._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        useAuthStore.getState().setSession(data.user, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearSession();
      }
    }
    return Promise.reject(error);
  }
);

export function getApiError(error) {
  return error.response?.data?.message || error.message || 'Request failed';
}
