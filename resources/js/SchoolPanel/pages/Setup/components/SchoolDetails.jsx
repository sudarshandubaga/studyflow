import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Save } from 'lucide-react';

const SchoolDetails = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        domain: '',
        timezone: 'Asia/Kolkata',
    });

    useEffect(() => {
        fetchSchoolDetails();
    }, []);

    const fetchSchoolDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get('school');
            setFormData({
                name: res.data.name || '',
                email: res.data.email || '',
                phone: res.data.phone || '',
                address: res.data.address || '',
                domain: res.data.domain || '',
                timezone: res.data.timezone || 'Asia/Kolkata',
            });
        } catch (err) {
            console.error('Failed to fetch school details', err);
            setError('Could not load school details.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        try {
            await api.put('school', formData);
            setMessage('School details updated successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update details.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs gap-3">
                <Loader2 size={24} className="animate-spin text-blue-500" />
                Loading Data...
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-lg text-slate-800 font-outfit tracking-tight">Institution Details</h3>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {message && (
                    <div className="p-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-sm font-bold flex gap-2 items-center">
                        <span>✅</span> {message}
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold flex gap-2 items-center">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Institution Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400"
                            placeholder="e.g. Cambridge High School"
                            required
                        />
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Primary Domain *</label>
                        <input
                            type="text"
                            name="domain"
                            disabled
                            value={formData.domain}
                            className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400"
                            placeholder="e.g. cambridge.edu"
                            required
                        />
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Contact Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400"
                            placeholder="admin@school.com"
                        />
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Contact Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400"
                            placeholder="+1 234 567 8900"
                        />
                    </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Registered Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400 min-h-[100px]"
                        placeholder="Full registered address of the institution"
                    />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white px-8 py-3.5 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-70 flex items-center gap-2 font-bold tracking-wide"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SchoolDetails;
