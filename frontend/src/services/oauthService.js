import { api } from './apiClient.js';

export function getApiOrigin() {
  return api.defaults.baseURL.replace(/\/api\/?$/, '');
}

export function redirectToGoogleOAuth() {
  window.location.assign(`${getApiOrigin()}/api/auth/google`);
}

export async function hydrateSessionFromRefresh(setSession) {
  const { data } = await api.post('/auth/refresh');
  setSession(data.user, data.accessToken);
  return data.user;
}
