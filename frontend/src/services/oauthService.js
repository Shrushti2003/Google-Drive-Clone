import { api } from './apiClient.js';

export function getApiOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function redirectToGoogleOAuth() {
  window.location.assign(`${getApiOrigin()}/api/auth/google`);
}

export async function hydrateSessionFromRefresh(setSession) {
  const { data } = await api.post('/auth/refresh');
  setSession(data.user, data.accessToken);
  return data.user;
}
