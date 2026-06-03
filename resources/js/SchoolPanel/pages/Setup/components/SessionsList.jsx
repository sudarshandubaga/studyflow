import React, { useState } from 'react';
import api from '../../../utils/api';
import { Loader2, PenBox, Trash2, Plus } from 'lucide-react';
import { useSession } from '../../../context/SessionContext';
import { useBranch } from '../../../context/BranchContext';

const SessionsList = () => {
    const { sessions, loading, refreshSessions } = useSession();
    const { selectedBranch } = useBranch();
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        is_active: 'inactive'
    });
    const [error, setError] = useState('');

    const handleOpenModal = (session = null) => {
        setError('');
        if (session) {
            setEditingSession(session);
            setFormData({
                name: session.name,
                start_date: session.start_date,
                end_date: session.end_date || '',
                is_active: session.is_active
            });
        } else {
            setEditingSession(null);
            setFormData({
                name: '',
                start_date: '',
                end_date: '',
                is_active: 'inactive'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSession(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!selectedBranch) {
            setError('Please select a school branch first.');
            return;
        }

        setError('');
        setSaving(true);
        
        try {
            const payload = { 
                ...formData, 
                branch_id: selectedBranch.id 
            }; 
            
            if (editingSession) {
                await api.put(`sessions/${editingSession.id}`, payload);
            } else {
                await api.post('sessions', payload);
            }
            refreshSessions();
            handleCloseModal();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save session');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this session?')) return;
        
        try {
            await api.delete(`sessions/${id}`);
            refreshSessions();
        } catch (err) {
            alert('Failed to delete session');
        }
    };

    const handleToggleActive = async (session) => {
        const newStatus = session.is_active === 'active' ? 'inactive' : 'active';
        try {
            await api.put(`sessions/${session.id}`, {
                name: session.name,
                start_date: session.start_date,
                end_date: session.end_date,
                is_active: newStatus
            });
            refreshSessions();
        } catch (err) {
            alert('Failed to toggle status');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 relative">
                <h3 className="font-bold text-lg text-slate-800 font-outfit tracking-tight">Academic Sessions</h3>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95 flex items-center gap-1 uppercase tracking-widest text-[10px]"
                >
                    <Plus size={14} /> Add New Session
                </button>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs gap-3">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    Loading Data...
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="py-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] px-6">Session Name</th>
                                <th className="py-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] px-4">Duration</th>
                                <th className="py-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] px-4 text-center">Status</th>
                                <th className="py-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sessions.length > 0 ? sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-5 px-6 font-bold text-slate-700 font-outfit text-base">
                                        {session.name}
                                    </td>
                                    <td className="py-5 px-4">
                                        <div className="text-slate-700 font-medium text-sm">{session.start_date}</div>
                                        <div className="text-slate-400 text-xs">to {session.end_date || 'Ongoing'}</div>
                                    </td>
                                    <td className="py-5 px-4 text-center">
                                        <button 
                                            onClick={() => handleToggleActive(session)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                                session.is_active === 'active' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {session.is_active === 'active' ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenModal(session)}
                                                className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-colors tooltip"
                                                title="Edit Session"
                                            >
                                                <PenBox size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(session.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg hover:border-rose-200 hover:bg-rose-50 transition-colors"
                                                title="Delete Session"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        No sessions found. Create one to get started!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 font-outfit">
                                {editingSession ? 'Edit Academic Session' : 'Create New Session'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}
                            
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Session Name *</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400" 
                                    placeholder="e.g. 2025-2026"
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Start Date *</label>
                                    <input 
                                        type="date" 
                                        value={formData.start_date}
                                        onChange={e => setFormData({...formData, start_date: e.target.value})}
                                        className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all" 
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">End Date</label>
                                    <input 
                                        type="date" 
                                        value={formData.end_date}
                                        onChange={e => setFormData({...formData, end_date: e.target.value})}
                                        className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all" 
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                                <select 
                                    value={formData.is_active}
                                    onChange={e => setFormData({...formData, is_active: e.target.value})}
                                    className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all"
                                >
                                    <option value="inactive">Inactive</option>
                                    <option value="active">Active (Primary Session)</option>
                                </select>
                                {formData.is_active === 'active' && (
                                    <p className="text-[10px] text-blue-500 font-bold px-1 mt-1">
                                        Setting as Active will deactivate all other sessions.
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 text-white px-7 py-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-70 flex items-center gap-2 font-bold text-sm"
                                >
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    {saving ? 'Saving...' : 'Save Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionsList;
