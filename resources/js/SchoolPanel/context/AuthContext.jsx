import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const response = await api.get('me');
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('login', { email, password });
        const { user: userData, token: userToken } = response.data;
        
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
    };

    const logout = async () => {
        try {
            if (token) {
                await api.post('logout');
            }
        } catch (error) {
            console.error('Error logging out', error);
        } finally {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            navigate('/school-panel/login');
        }
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
