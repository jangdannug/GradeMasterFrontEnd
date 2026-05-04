import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:10000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Response interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect if the 401 comes from the login attempt itself
        if (error.response && error.response.status === 401 && !error.config.url.includes('auth/login')) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;