import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, PenBox, Search, X, Check, AlertTriangle, Calendar, Clock, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { toast } from 'react-hot-toast';

const FineList = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();
    
    const [fines, setFines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingFine, setEditingFine] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    const [formData, setFormData] = useState({
        grace_period: 0,
        fine_type: 'Normal',
        time_period: 'Daily',
        amount: 0
    });

    useEffect(() => {
        if (selectedBranch && selectedSession) fetchFines();
    }, [selectedBranch, selectedSession]);

    const fetchFines = async () => {
        setLoading(true);
        try {
            const res = await api.get('fee-fines', { params: { branch_id: selectedBranch.id, session_id: selectedSession.id } });
            setFines(res.data);
        } catch { toast.error('Failed to load fines'); }
        setLoading(false);
    };

    const handleEdit = (fine) => {
        setEditingFine(fine);
        setFormData({
            grace_period: fine.grace_period,
            fine_type: fine.fine_type,
            time_period: fine.time_period,
            amount: fine.amount
        });
        setShowModal(true);
    };

    const handleOpenAdd = () => {
        setEditingFine(null);
        setFormData({
            grace_period: 0,
            fine_type: 'Normal',
            time_period: 'Daily',
            amount: 0
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this fine rule?')) return;
        try {
            await api.delete(`fee-fines/${id}`);
            toast.success('Fine rule deleted');
            fetchFines();
        } catch { toast.error('Delete failed'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            branch_id: selectedBranch.id,
            session_id: selectedSession.id
        };

        try {
            if (editingFine) {
                await api.put(`fee-fines/${editingFine.id}`, payload);
                toast.success('Fine rules updated');
            } else {
                await api.post('fee-fines', payload);
                toast.success('Fine rules created');
            }
            fetchFines();
            setShowModal(false);
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Action failed'); 
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-2xl shadow-amber-100">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 font-outfit tracking-tight">Fine Configuration</h2>
                        <p className="text-slate-400 text-sm font-medium italic">Manage late fee penalties and grace periods session-wise.</p>
                    </div>
                </div>
                <button onClick={handleOpenAdd} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-200 italic">
                    <Plus size={18} /> Configure New Fine
                </button>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5">
                    <Loader2 size={40} className="animate-spin text-amber-500" />
                    Loading Fine Rules...
                </div>
            ) : fines.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center space-y-6">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-200 shadow-sm">
                        <AlertTriangle size={40} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">No fine rules configured</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto">Set up your session-wise fine rules to automate late fee penalties.</p>
                    </div>
                    <button onClick={handleOpenAdd} className="text-amber-600 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                        Create Now <Plus size={14} />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {fines.map(f => (
                        <div key={f.id} className="bg-white rounded-[2.5rem] p-1 border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:border-amber-100 transition-all group relative">
                            <div className="bg-slate-50/50 rounded-[2.3rem] p-8">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:bg-amber-50 group-hover:text-amber-600 transition-all text-slate-400">
                                        <Clock size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(f)} className="p-3 bg-white text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100">
                                            <PenBox size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(f.id)} className="p-3 bg-white text-slate-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-slate-100">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex justify-between items-center border-b border-white pb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fine Type</span>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${f.fine_type === 'Normal' ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-50 text-violet-600'}`}>{f.fine_type}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white pb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Time Period</span>
                                        <span className="text-xs font-black text-slate-800 italic uppercase tracking-wider">{f.time_period}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white pb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Grace Period</span>
                                        <span className="text-xs font-black text-slate-800">{f.grace_period} Days</span>
                                    </div>
                                    <div className="pt-4">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Penalty Amount</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold text-amber-500">₹</span>
                                            <span className="text-4xl font-black text-slate-900 font-outfit tracking-tighter">{parseFloat(f.amount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-12 py-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1 italic">Rules Engine</p>
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">{editingFine ? 'Update Fine Policy' : 'Configure New Policy'}</h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-4 bg-white hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-600 border border-slate-100 shadow-sm"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Grace Period (Days)*</label>
                                    <input type="number" required value={formData.grace_period} onChange={e => setFormData({...formData, grace_period: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl text-sm font-bold focus:border-amber-500 outline-none transition-all shadow-inner" placeholder="0" />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Fine Amount (₹)*</label>
                                    <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl text-sm font-bold focus:border-amber-500 outline-none transition-all shadow-inner" placeholder="0.00" />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Fine Type*</label>
                                    <div className="relative">
                                        <select value={formData.fine_type} onChange={e => setFormData({...formData, fine_type: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl text-sm font-bold focus:border-amber-500 outline-none appearance-none cursor-pointer">
                                            <option value="Normal">Normal</option>
                                            <option value="Slab">Slab</option>
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><Clock size={16} /></div>
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Time Period*</label>
                                    <div className="relative">
                                        <select value={formData.time_period} onChange={e => setFormData({...formData, time_period: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl text-sm font-bold focus:border-amber-500 outline-none appearance-none cursor-pointer">
                                            <option value="Daily">Daily</option>
                                            <option value="Weekly">Weekly</option>
                                            <option value="Forthnightly">Forthnightly</option>
                                            <option value="Monthly">Monthly</option>
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><Calendar size={16} /></div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex gap-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all italic">Dismiss</button>
                                <button type="submit" className="flex-[2] bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-200 italic">
                                    {editingFine ? 'Confirm Changes' : 'Activate Policy'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FineList;
