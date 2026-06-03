import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(email, password);
            navigate('/school-panel');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-lg shadow-blue-200 mb-4">
                        <GraduationCap size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 font-outfit tracking-tight">StudyFlow ERP</h1>
                    <p className="text-slate-500 text-sm mt-1">Sign in to access your dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 font-medium border border-red-100 flex items-start gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5 flex flex-col group">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 p-3.5 pl-11 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400" 
                                placeholder="admin@studyflow.com" 
                                required 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 flex flex-col group">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 p-3.5 pl-11 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400" 
                                placeholder="••••••••" 
                                required 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full mt-2 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95 uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                    
                    <div className="text-center mt-6">
                        <button type="button" className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors decoration-2 underline-offset-4 hover:underline">
                            Forgot your password?
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="fixed bottom-4 text-center w-full text-slate-400 text-xs font-medium content-center">
                StudyFlow © 2026. All rights reserved.
            </div>
        </div>
    );
};

export default Login;
