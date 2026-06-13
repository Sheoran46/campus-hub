import axios from 'axios';

const api = axios.create({
    // Use the environment variable for the backend URL, fallback to localhost for local dev
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://campus-hub-backend-xgxf.onrender.com',
});

// Intercept EVERY outgoing request and attach the JWT token if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiration globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid, log out the user
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;