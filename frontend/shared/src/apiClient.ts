import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

// Single Axios instance shared across all apps.
// JWT is read from sessionStorage on every request so token updates are
// picked up without needing to re-create the instance.
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = sessionStorage.getItem('bsc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 — clear stale token and redirect to login.
// Each app controls its login path via VITE_LOGIN_PATH env var (default: '/login').
apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('bsc_token');
      const loginPath = import.meta.env.VITE_LOGIN_PATH ?? '/login';
      window.location.href = loginPath;
    }
    return Promise.reject(err);
  }
);
