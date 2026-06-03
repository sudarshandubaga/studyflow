import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 font-bold tracking-widest uppercase text-sm animate-pulse">Checking Authorization...</p>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/school-panel/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
