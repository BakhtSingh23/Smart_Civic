import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL,
});

export const getStaticUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const rootUrl = baseURL.replace(/\/api\/?$/, '');
  return `${rootUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred';
    let type = 'error';

    if (!error.response) {
      message = 'Network error. Please check your connection.';
    } else {
      const { status, data } = error.response;
      message = data?.message || message;

      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message = 'Session expired. Please log in again.';
        window.location.href = '/login';
      } else if (status === 403) {
        message = 'You do not have permission for this action.';
        type = 'warning';
      } else if (status === 500) {
        message = 'Server error. Please try again later.';
      }
    }

    // Dispatch custom event for ToastProvider
    window.dispatchEvent(
      new CustomEvent('global-toast', {
        detail: { message, type, duration: 4000 },
      })
    );

    return Promise.reject(error);
  }
);

export default axiosInstance;
