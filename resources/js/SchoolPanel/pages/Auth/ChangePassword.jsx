import React, { useState } from 'react';
import api from '../../utils/api';
import { KeyRound, ShieldCheck, Loader2, Save } from 'lucide-react';

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            await api.post('change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword
            });
            
            setMessage('Password successfully changed!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.current_password?.[0] || 'Failed to change password. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-outfit">Security Settings</h1>
                    <p className="text-slate-500 text-sm">Update your account password and security preferences.</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                    <ShieldCheck size={24} />
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {message && (
                        <div className="bg-emerald-50 text-emerald-600 text-sm p-4 rounded-xl font-bold border border-emerald-100 flex items-center gap-2">
                            <span>✅</span>
                            <span>{message}</span>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl font-bold border border-red-100 flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5 flex flex-col group">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Current Password</label>
                        <div className="relative">
                            <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="password" 
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 p-3.5 pl-11 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400" 
                                placeholder="Enter current password" 
                                required 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 flex flex-col group">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">New Password</label>
                            <div className="relative">
                                <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 p-3.5 pl-11 rounded-xl focus:ring-2 focus:ring-emerald-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400" 
                                    placeholder="Enter new password" 
                                    required 
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 flex flex-col group">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Confirm New Password</label>
                            <div className="relative">
                                <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 p-3.5 pl-11 rounded-xl focus:ring-2 focus:ring-emerald-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400" 
                                    placeholder="Confirm new password" 
                                    required 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide font-outfit"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {loading ? 'Processing...' : <><Save size={18} /> Update Password</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
