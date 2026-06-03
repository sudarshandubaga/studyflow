import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, MapPin, Mail, Phone } from 'lucide-react';

const SchoolBranches = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await api.get('school-branches');
            console.log('branches', res);

            setBranches(res.data);
        } catch (err) {
            console.error('Failed to fetch branches', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (branch = null) => {
        setError('');
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                name: branch.name || '',
                email: branch.email || '',
                phone: branch.phone || '',
                address: branch.address || ''
            });
        } else {
            setEditingBranch(null);
            setFormData({ name: '', email: '', phone: '', address: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editingBranch) {
                await api.put(`school-branches/${editingBranch.id}`, formData);
            } else {
                await api.post('school-branches', formData);
            }
            fetchBranches();
            handleCloseModal();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save branch.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-lg text-slate-800 font-outfit tracking-tight">Branch Management</h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95 flex items-center gap-1 uppercase tracking-widest text-[10px]"
                >
                    <Plus size={14} /> Add New Branch
                </button>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs gap-3">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    Loading Data...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.length > 0 ? branches.map(branch => (
                        <div key={branch.id} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl group transition-all hover:bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(branch)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white rounded-lg shadow-sm border border-slate-100 transition-colors">
                                    <PenBox size={14} />
                                </button>
                            </div>

                            <h4 className="font-bold text-slate-800 font-outfit text-lg mb-4">{branch.name}</h4>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{branch.address || 'No address provided'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone size={16} className="text-slate-400 shrink-0" />
                                    <p className="text-sm text-slate-600 font-medium">{branch.phone || 'N/A'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail size={16} className="text-slate-400 shrink-0" />
                                    <p className="text-sm text-slate-600 font-medium truncate">{branch.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-100 rounded-3xl">
                            No branches found. Create one to get started!
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 font-outfit">
                                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Branch Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400"
                                    placeholder="e.g. South Wing Campus"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all"
                                        placeholder="+1 234 567"
                                    />
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all"
                                        placeholder="branch@school.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Branch Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400 min-h-[80px]"
                                />
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
                                    {saving ? 'Saving...' : 'Save Branch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolBranches;
