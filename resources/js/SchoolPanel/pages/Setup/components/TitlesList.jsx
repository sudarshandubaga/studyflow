import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, UserSquare2, Search, X, Check, Hash, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const TitlesList = () => {
    const { user } = useAuth();
    const [titles, setTitles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    
    // Inline Add State
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState({ name: '', short_name: '', gender: 'Both' });
    const [saving, setSaving] = useState(false);

    // Inline Edit State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', short_name: '', gender: 'Both', is_active: true });

    useEffect(() => {
        if (user?.school_id) {
            fetchTitles();
            setSelectedIds([]);
        }
    }, [user]);

    const fetchTitles = async () => {
        setLoading(true);
        try {
            const res = await api.get(`student-titles`, {
                headers: { 'school-id': user.school_id }
            });
            setTitles(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            toast.error('Failed to fetch titles');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTitle = async () => {
        if (!newTitle.name.trim() || !newTitle.short_name.trim()) {
            toast.error('Please fill all required fields');
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('student-titles', {
                ...newTitle,
                is_active: true,
                school_id: user.school_id
            });
            setTitles([...titles, res.data]);
            setNewTitle({ name: '', short_name: '', gender: 'Both' });
            setIsAdding(false);
            toast.success('Title added');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add title');
        } finally { setSaving(false); }
    };

    const handleSaveEdit = async (id) => {
        if (!editForm.name.trim() || !editForm.short_name.trim()) return;
        setSaving(true);
        try {
            const res = await api.put(`student-titles/${id}`, {
                ...editForm,
                school_id: user.school_id
            });
            setTitles(titles.map(t => t.id === id ? res.data : t));
            setEditingId(null);
            toast.success('Title updated');
        } catch (err) {
            toast.error('Failed to update title');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this title?')) return;
        try {
            await api.delete(`student-titles/${id}`);
            setTitles(titles.filter(t => t.id !== id));
            toast.success('Title deleted');
        } catch (err) {
            toast.error('Failed to delete title');
        }
    };

    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;
        if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} titles forever?`)) return;
        
        setIsBulkLoading(true);
        try {
            await api.post('student-titles/bulk', {
                ids: selectedIds,
                action
            });
            
            if (action === 'delete') {
                setTitles(titles.filter(t => !selectedIds.includes(t.id)));
                setSelectedIds([]);
            } else {
                fetchTitles();
                setSelectedIds([]);
            }
            toast.success('Bulk operation success');
        } catch (err) {
            toast.error('Bulk operation failed');
        } finally {
            setIsBulkLoading(false);
        }
    };

    const toggleSelect = id => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const filtered = titles.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.short_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(t => t.id));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <UserSquare2 size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Title Settings</h3>
                        <p className="text-sm text-slate-400 font-medium">Manage student titles (Mr, Ms, etc) and gender associations.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find title..."
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
                            <Plus size={18} /> New Title
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex items-center gap-6 bg-slate-900 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl shadow-slate-900/40 border border-slate-800">
                        <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-black text-sm">
                                {selectedIds.length}
                            </div>
                            <span className="text-sm font-bold text-slate-300">Selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => handleBulkAction('enable')}
                                disabled={isBulkLoading}
                                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-white hover:text-slate-900 transition-all"
                            >
                                Enable
                            </button>
                            <button 
                                onClick={() => handleBulkAction('disable')}
                                disabled={isBulkLoading}
                                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-white hover:text-slate-900 transition-all"
                            >
                                Disable
                            </button>
                            <button 
                                onClick={() => handleBulkAction('delete')}
                                disabled={isBulkLoading}
                                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                            >
                                Delete
                            </button>
                            <button 
                                onClick={() => setSelectedIds([])}
                                className="ml-4 text-slate-500 hover:text-white text-xs font-bold"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5">
                    <Loader2 size={40} className="animate-spin text-indigo-500" />
                    Fetching records...
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-6">
                        <button 
                            onClick={toggleSelectAll}
                            className="flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            {selectedIds.length === filtered.length && filtered.length > 0 ? (
                                <CheckSquare size={20} className="text-indigo-600" />
                            ) : (
                                <Square size={20} />
                            )}
                            <span className="text-xs font-black uppercase tracking-widest">Select All {filtered.length > 0 && `(${filtered.length})`}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* Inline Add Card */}
                        {isAdding && (
                            <div className="bg-white border-2 border-indigo-600 rounded-[2.5rem] p-6 space-y-5 shadow-2xl shadow-indigo-100 animate-in zoom-in-95 duration-300 relative z-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Adding new title</span>
                                    <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                                </div>
                                <div className="space-y-4 font-inter">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Full Name (e.g. Mister)"
                                        value={newTitle.name}
                                        onChange={e => setNewTitle({ ...newTitle, name: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Short Name (e.g. Mr.)"
                                        value={newTitle.short_name}
                                        onChange={e => setNewTitle({ ...newTitle, short_name: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                    />
                                    <select
                                        value={newTitle.gender}
                                        onChange={e => setNewTitle({ ...newTitle, gender: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Both">Both</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleAddTitle}
                                    disabled={saving || !newTitle.name.trim() || !newTitle.short_name.trim()}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all text-xs font-black uppercase tracking-widest"
                                >
                                    {saving ? 'Adding...' : 'Confirm creation'}
                                </button>
                            </div>
                        )}

                        {filtered.map(title => {
                            const isSelected = selectedIds.includes(title.id);
                            return (
                                <div 
                                    key={title.id} 
                                    onClick={() => toggleSelect(title.id)}
                                    className={`group bg-white border cursor-pointer rounded-[2.5rem] p-6 hover:shadow-[0_40px_80px_rgb(0,0,0,0.05)] transition-all relative overflow-hidden ${
                                        isSelected ? 'ring-2 ring-indigo-600 border-transparent bg-indigo-50/10 shadow-xl' : 'border-slate-100'
                                    }`}
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                    
                                    <div className="relative z-10 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'
                                                }`}>
                                                    {isSelected && <Check size={14} strokeWidth={4} />}
                                                </div>
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                                }`}>
                                                    <UserSquare2 size={20} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-95 translate-x-2 group-hover:translate-x-0">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEditingId(title.id); setEditForm({ ...title }); }} 
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                                >
                                                    <PenBox size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(title.id); }} 
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {editingId === title.id ? (
                                            <div onClick={e => e.stopPropagation()} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="space-y-3">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                        className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editForm.short_name}
                                                        onChange={e => setEditForm({ ...editForm, short_name: e.target.value })}
                                                        className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800"
                                                    />
                                                    <select
                                                        value={editForm.gender}
                                                        onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                                        className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800"
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Both">Both</option>
                                                    </select>
                                                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-slate-100 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={editForm.is_active} 
                                                            onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                                                            className="w-4 h-4 rounded text-indigo-600" 
                                                        />
                                                        <span className="text-sm font-bold text-slate-700">Active Title</span>
                                                    </label>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleSaveEdit(title.id)} disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{saving ? '...' : 'Save'}</button>
                                                    <button onClick={() => setEditingId(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">X</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="space-y-0.5">
                                                    <h4 className="font-bold text-slate-800 font-outfit text-xl tracking-tight line-clamp-1">{title.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{title.short_name}</p>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">{title.gender}</p>
                                                    </div>
                                                </div>
                                                <div className="pt-2">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                        title.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        {title.is_active ? 'Active' : 'Disabled'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {filtered.length === 0 && !isAdding && (
                            <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/20">
                                <Hash size={48} className="text-slate-200 mb-6 mx-auto animate-bounce-slow" />
                                <h5 className="font-bold text-slate-700 text-lg uppercase tracking-tight">No titles yet</h5>
                                <button onClick={() => setIsAdding(true)} className="mt-6 text-indigo-600 font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white px-8 py-3 rounded-2xl border-2 border-indigo-600 transition-all">Start building list</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TitlesList;
