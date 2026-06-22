import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const http = axios.create({
  baseURL,
});

export const getStaticUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const rootUrl = baseURL.replace(/\/api\/?$/, '');
  return `${rootUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
