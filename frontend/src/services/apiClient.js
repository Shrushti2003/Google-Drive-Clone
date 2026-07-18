import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8080/api' : undefined);

if (!apiBaseUrl) {
  throw new Error('Missing required frontend environment variable: VITE_API_URL');
}

export const api = axios.create({
  baseURL: apiBaseUrl,
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
