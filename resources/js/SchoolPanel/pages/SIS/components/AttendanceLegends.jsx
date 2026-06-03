import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useSession } from '../../../context/SessionContext';
import { useBranch } from '../../../context/BranchContext';
import { useAuth } from '../../../context/AuthContext';
import { Loader2, Plus, PenBox, Trash2, CalendarCheck2, Search, X, Check, XCircle, Briefcase, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AttendanceLegends = ({ type = 'Student' }) => {
    const { user } = useAuth();
    const { selectedSession } = useSession();
    const { selectedBranch } = useBranch();
    const [legends, setLegends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal & Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', short_name: '', type: type, treat_as: 'present' });

    useEffect(() => {
        if (selectedSession?.id) fetchLegends();
    }, [selectedSession, selectedBranch]);

    const fetchLegends = async () => {
        if (!selectedSession?.id) return;
        setLoading(true);
        try {
            const res = await api.get('attendance-legends', {
                params: { session_id: selectedSession.id },
                headers: { 'branch-id': selectedBranch?.id || user?.school_branch_id || user?.school_id }
            });
            setLegends(res.data);
        } catch (err) {
            toast.error('Failed to fetch legends');
        } finally { setLoading(false); }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setForm({ name: item.name, short_name: item.short_name, type: item.type || 'Employee', treat_as: item.treat_as });
        } else {
            setEditingItem(null);
            setForm({ name: '', short_name: '', type: 'Student', treat_as: 'present' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSession?.id) return toast.error('Please select a session');

        setSaving(true);
        try {
            const data = {
                ...form,
                session_id: selectedSession.id,
                branch_id: selectedBranch?.id || user?.school_branch_id || user?.school_id
            };
            if (editingItem) {
                await api.put(`attendance-legends/${editingItem.id}`, data);
                toast.success('Legend updated');
            } else {
                await api.post('attendance-legends', data);
                toast.success('Legend created');
            }
            fetchLegends();
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this attendance legend?')) return;
        try {
            await api.delete(`attendance-legends/${id}`);
            toast.success('Legend deleted');
            fetchLegends();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const filtered = legends.filter(leg =>
        (leg.type === type) && (
            leg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            leg.short_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                        <CalendarCheck2 size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 font-outfit">Attendance Legends</h3>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Configure status codes for tracking daily attendance.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-sm font-medium focus:ring-4 focus:ring-emerald-100 outline-none w-48 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> New Legend
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest">Loading Records...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(leg => (
                        <div key={leg.id} className="bg-white border border-slate-100 p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-100/50 transition-all group overflow-hidden relative">
                            <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${leg.treat_as === 'present'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                            {leg.short_name}
                                        </div>
                                        <h4 className="font-bold text-slate-800 font-outfit">{leg.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-1.5 pt-2">
                                        <div className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 flex items-center gap-1.5">
                                            {leg.type === 'Employee' ? <Briefcase size={10} /> : <GraduationCap size={10} />}
                                            {leg.type}
                                        </div>
                                        {leg.treat_as === 'present' ? (
                                            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 bg-emerald-50/50 px-2 py-1 rounded-md border border-emerald-100">
                                                <Check size={10} /> Present
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-rose-500 bg-rose-50/50 px-2 py-1 rounded-md border border-rose-100">
                                                <XCircle size={10} /> Absent
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleOpenModal(leg)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><PenBox size={16} /></button>
                                    <button onClick={() => handleDelete(leg.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-16 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl">
                            <CalendarCheck2 size={40} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-slate-400 font-bold text-sm">No attendance legends found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/12 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800 font-outfit">{editingItem ? 'Edit Legend' : 'New Legend'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-1.5 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none font-bold text-slate-700 transition-all"
                                        placeholder="e.g. Present, Absent, Half Day"
                                    />
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Code *</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={2}
                                        value={form.short_name}
                                        onChange={e => setForm({ ...form, short_name: e.target.value.toUpperCase() })}
                                        className="bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none font-bold text-slate-700 transition-all text-center"
                                        placeholder="P"
                                    />
                                </div>
                            </div>


                            <div className="space-y-2 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Treat Attendance As</label>
                                <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                                    {[
                                        { id: 'present', label: 'Present Status', icon: Check, color: 'text-emerald-600' },
                                        { id: 'absent', label: 'Absent Status', icon: XCircle, color: 'text-rose-600' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setForm({ ...form, treat_as: opt.id })}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${form.treat_as === opt.id
                                                ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            <opt.icon size={14} className={form.treat_as === opt.id ? opt.color : ''} />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] bg-emerald-600 text-white px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : editingItem ? 'Save Changes' : 'Create Legend'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceLegends;
