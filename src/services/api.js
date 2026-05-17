import axios from 'axios';

const isProd = true; // Set to true when deploying to Render

const api = axios.create({
  baseURL: isProd ? 'https://grademasterapi.onrender.com/api' : 'http://localhost:10000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to log successful responses
api.interceptors.response.use(response => {
  //console.log(`API Response [${response.status}] ${response.config.method.toUpperCase()} ${response.config.url}:`, response.data);
  return response;
}, error => {
  console.error(`API Error [${error.response?.status || 'N/A'}] ${error.config?.method?.toUpperCase() || 'N/A'} ${error.config?.url || 'N/A'}:`, error.response?.data || error.message);
  return Promise.reject(error);
});

export default api;
