import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, Tags, Search, X, Check, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSession } from '../../../context/SessionContext';
import { useBranch } from '../../../context/BranchContext';
import { toast } from 'react-hot-toast';

const AttendanceLegends = ({ type = 'Employee' }) => {
    const { user } = useAuth();
    const { selectedSession } = useSession();
    const { selectedBranch } = useBranch();
    const [legends, setLegends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    
    // Inline Add State
    const [isAdding, setIsAdding] = useState(false);
    const [newLegend, setNewLegend] = useState({ name: '', short_name: '', type: type, treat_as: 'present', total_leaves: 0 });
    const [saving, setSaving] = useState(false);

    // Inline Edit State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', short_name: '', treat_as: 'present', total_leaves: 0 });

    useEffect(() => {
        if (selectedSession?.id) {
            fetchLegends();
            setSelectedIds([]);
        }
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
        } catch (err) { toast.error('Failed to fetch legends'); }
        finally { setLoading(false); }
    };

    const handleAdd = async () => {
        if (!newLegend.name.trim() || !newLegend.short_name.trim()) return;
        if (!selectedSession?.id) return toast.error('Please select an active session');
        
        setSaving(true);
        try {
            const res = await api.post('attendance-legends', { 
                ...newLegend, 
                branch_id: selectedBranch?.id || user?.school_branch_id || user?.school_id, 
                session_id: selectedSession.id 
            });
            setLegends([...legends, res.data]);
            setNewLegend({ name: '', short_name: '', type: type, treat_as: 'present', total_leaves: 0 });
            setIsAdding(false);
            toast.success('Legend added');
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Failed to add'); 
        }
        finally { setSaving(false); }
    };

    const handleSaveEdit = async (id) => {
        if (!editForm.name.trim()) return;
        if (!selectedSession?.id) return toast.error('Session expired. Please reload.');

        setSaving(true);
        try {
            const res = await api.put(`attendance-legends/${id}`, { 
                ...editForm, 
                branch_id: selectedBranch?.id || user?.school_branch_id || user?.school_id, 
                session_id: selectedSession.id 
            });
            setLegends(legends.map(l => l.id === id ? res.data : l));
            setEditingId(null);
            toast.success('Legend updated');
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Failed to update'); 
        }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this legend?')) return;
        try {
            await api.delete(`attendance-legends/${id}`);
            setLegends(legends.filter(l => l.id !== id));
            toast.success('Legend deleted');
        } catch (err) { toast.error('Failed to delete'); }
    };

    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;
        setIsBulkLoading(true);
        try {
            await api.post('attendance-legends/bulk', { ids: selectedIds, action });
            if (action === 'delete') {
                setLegends(legends.filter(l => !selectedIds.includes(l.id)));
                setSelectedIds([]);
            } else {
                fetchLegends();
                setSelectedIds([]);
            }
            toast.success('Bulk operation successful');
        } catch (err) { toast.error('Bulk operation failed'); }
        finally { setIsBulkLoading(false); }
    };

    const filtered = legends.filter(l => 
        (l.type === type) && (
            l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            l.short_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <Tags size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Attendance Legends</h3>
                        <p className="text-sm text-slate-400 font-medium">Define attendance statuses and their impacts on leave balance.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find legend..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-100 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-indigo-50 focus:border-indigo-500 outline-none w-64 transition-all"
                        />
                    </div>
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> New Legend
                        </button>
                    )}
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex items-center gap-6 bg-slate-900 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl shadow-slate-900/40 border border-slate-800">
                        <div className="px-3 py-1 bg-indigo-500 rounded-full font-black text-xs">{selectedIds.length}</div>
                        <button onClick={() => handleBulkAction('delete')} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all">Delete</button>
                        <button onClick={() => setSelectedIds([])} className="text-xs font-bold text-slate-500 ml-2">Clear</button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isAdding && (
                        <div className="bg-white border-2 border-indigo-600 rounded-[2.5rem] p-6 space-y-6 shadow-2xl shadow-indigo-100 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Create Legend</span>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="space-y-4">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Present, Absent, Sick Leave, etc."
                                    value={newLegend.name}
                                    onChange={e => setNewLegend({ ...newLegend, name: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Short (P, A, SL)"
                                        value={newLegend.short_name}
                                        onChange={e => setNewLegend({ ...newLegend, short_name: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Total Leaves"
                                        value={newLegend.total_leaves}
                                        onChange={e => setNewLegend({ ...newLegend, total_leaves: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm"
                                    />
                                </div>
                                <select 
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 text-sm"
                                    value={newLegend.treat_as}
                                    onChange={e => setNewLegend({ ...newLegend, treat_as: e.target.value })}
                                >
                                    <option value="present">Treat as Present</option>
                                    <option value="absent">Treat as Absent</option>
                                </select>
                                <button 
                                    onClick={handleAdd}
                                    disabled={saving || !newLegend.name || !newLegend.short_name}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
                                >
                                    {saving ? 'Creating...' : 'Save Legend'}
                                </button>
                            </div>
                        </div>
                    )}

                    {filtered.map(legend => {
                        const isSelected = selectedIds.includes(legend.id);
                        return (
                            <div 
                                key={legend.id}
                                onClick={() => setSelectedIds(prev => prev.includes(legend.id) ? prev.filter(id => id !== legend.id) : [...prev, legend.id])}
                                className={`group bg-white border-2 cursor-pointer rounded-[2.5rem] p-6 hover:shadow-xl transition-all relative overflow-hidden ${
                                    isSelected ? 'border-indigo-600 bg-indigo-50/10 shadow-lg' : 'border-slate-50'
                                }`}
                            >
                                <div className="absolute -right-2 -top-2 w-16 h-16 bg-slate-50/50 rounded-full blur-xl group-hover:bg-indigo-50 transition-all"></div>
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 shadow-sm'
                                            }`}>
                                                <Tags size={18} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="font-bold text-slate-800 font-outfit text-lg">{legend.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                        legend.treat_as === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                    }`}>{legend.treat_as}</span>
                                                    <span className="px-2 py-0.5 bg-slate-50 text-[10px] font-black text-slate-400 rounded-full">{legend.short_name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setEditingId(legend.id); setEditForm({...legend, type: legend.type}); }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                            >
                                                <PenBox size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(legend.id); }}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {editingId === legend.id ? (
                                        <div onClick={e => e.stopPropagation()} className="space-y-4 animate-in slide-in-from-top-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={editForm.short_name}
                                                    onChange={e => setEditForm({ ...editForm, short_name: e.target.value })}
                                                    className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                                />
                                                <input
                                                    type="number"
                                                    value={editForm.total_leaves}
                                                    onChange={e => setEditForm({ ...editForm, total_leaves: parseInt(e.target.value) })}
                                                    className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSaveEdit(legend.id)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Save</button>
                                                <button onClick={() => setEditingId(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle size={14} className="text-amber-500" />
                                                <span className="text-[10px] font-bold text-slate-500">{legend.total_leaves} Total Leaves</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-200">#LEGEND</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AttendanceLegends;
