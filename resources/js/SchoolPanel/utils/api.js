import axios from 'axios';

const api = axios.create({
    baseURL: '/api/school-panel/',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor to add auth token and session/branch info
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const sessionId = localStorage.getItem('selectedSessionId');
        if (sessionId) {
            config.headers['session-id'] = sessionId;
        }

        const branchId = localStorage.getItem('selectedBranchId'); // Likely key, let's verify
        if (branchId) {
            config.headers['branch-id'] = branchId;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle unauthenticated errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Unauthenticated: Token expired or invalid
            localStorage.removeItem('token');
            if (window.location.pathname !== '/school-panel/login') {
                window.location.href = '/school-panel/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
