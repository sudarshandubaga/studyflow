import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, FileText, Search, X, Check, CheckSquare, Square, Tags } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const StaffDocumentTypes = () => {
    const { user } = useAuth();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    
    // Inline Add State
    const [isAdding, setIsAdding] = useState(false);
    const [newDoc, setNewDoc] = useState({ name: '', short_name: '', is_active: true });
    const [saving, setSaving] = useState(false);

    // Inline Edit State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', short_name: '', is_active: true });

    useEffect(() => {
        if (user?.school_id) {
            fetchDocs();
            setSelectedIds([]);
        }
    }, [user]);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const res = await api.get('staff-document-types', {
                headers: { 'branch-id': user.branch_id || user.school_id }
            });
            setDocs(res.data);
        } catch (err) { toast.error('Failed to fetch document types'); }
        finally { setLoading(false); }
    };

    const handleAdd = async () => {
        if (!newDoc.name.trim()) return;
        setSaving(true);
        try {
            const res = await api.post('staff-document-types', { ...newDoc, branch_id: user.branch_id || user.school_id });
            setDocs([...docs, res.data]);
            setNewDoc({ name: '', short_name: '', is_active: true });
            setIsAdding(false);
            toast.success('Document type added');
        } catch (err) { toast.error('Failed to add'); }
        finally { setSaving(false); }
    };

    const handleSaveEdit = async (id) => {
        if (!editForm.name.trim()) return;
        setSaving(true);
        try {
            const res = await api.put(`staff-document-types/${id}`, { ...editForm, branch_id: user.branch_id || user.school_id });
            setDocs(docs.map(d => d.id === id ? res.data : d));
            setEditingId(null);
            toast.success('Document updated');
        } catch (err) { toast.error('Failed to update'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this document type?')) return;
        try {
            await api.delete(`staff-document-types/${id}`);
            setDocs(docs.filter(d => d.id !== id));
            toast.success('Document deleted');
        } catch (err) { toast.error('Failed to delete'); }
    };

    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;
        setIsBulkLoading(true);
        try {
            await api.post('staff-document-types/bulk', { ids: selectedIds, action });
            if (action === 'delete') {
                setDocs(docs.filter(d => !selectedIds.includes(d.id)));
                setSelectedIds([]);
            } else {
                fetchDocs();
                setSelectedIds([]);
            }
            toast.success('Bulk operation successful');
        } catch (err) { toast.error('Bulk operation failed'); }
        finally { setIsBulkLoading(false); }
    };

    const filtered = docs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <FileText size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Staff Documents</h3>
                        <p className="text-sm text-slate-400 font-medium">Manage types of documents required for employee verification.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find document..."
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
                            <Plus size={18} /> New Document
                        </button>
                    )}
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex items-center gap-6 bg-slate-900 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl shadow-slate-900/40 border border-slate-800">
                        <div className="px-3 py-1 bg-indigo-500 rounded-full font-black text-xs">{selectedIds.length}</div>
                        <button onClick={() => handleBulkAction('enable')} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:bg-white/10 rounded-xl transition-all">Enable</button>
                        <button onClick={() => handleBulkAction('disable')} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:bg-white/10 rounded-xl transition-all">Disable</button>
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
                        <div className="bg-white border-2 border-indigo-600 rounded-[2.5rem] p-6 space-y-5 shadow-2xl shadow-indigo-100 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Create Document</span>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="space-y-4">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Aadhaar, Degree Certificate, etc."
                                    value={newDoc.name}
                                    onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm mb-3"
                                />
                                <input
                                    type="text"
                                    placeholder="Short Name (e.g. ADH)"
                                    value={newDoc.short_name}
                                    onChange={e => setNewDoc({ ...newDoc, short_name: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm"
                                />
                                <button 
                                    onClick={handleAdd}
                                    disabled={saving || !newDoc.name}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all"
                                >
                                    {saving ? 'Creating...' : 'Save Document'}
                                </button>
                            </div>
                        </div>
                    )}

                    {filtered.map(doc => {
                        const isSelected = selectedIds.includes(doc.id);
                        return (
                            <div 
                                key={doc.id}
                                onClick={() => setSelectedIds(prev => prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id])}
                                className={`group bg-white border-2 cursor-pointer rounded-[2.5rem] p-6 hover:shadow-xl transition-all relative overflow-hidden ${
                                    isSelected ? 'border-indigo-600 bg-indigo-50/10 shadow-lg' : 'border-slate-50'
                                }`}
                            >
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-100 bg-white'
                                            }`}>
                                                {isSelected && <Check size={14} strokeWidth={4} />}
                                            </div>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 shadow-sm'
                                            }`}>
                                                <FileText size={18} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setEditingId(doc.id); setEditForm({...doc}); }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                            >
                                                <PenBox size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {editingId === doc.id ? (
                                        <div onClick={e => e.stopPropagation()} className="space-y-4">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={editForm.short_name || ''}
                                                onChange={e => setEditForm({ ...editForm, short_name: e.target.value })}
                                                className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSaveEdit(doc.id)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Save</button>
                                                <button onClick={() => setEditingId(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-slate-800 font-outfit text-lg">{doc.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 bg-slate-50 text-[10px] font-black text-slate-400 rounded-lg">{doc.short_name || 'N/A'}</span>
                                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    doc.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                }`}>{doc.is_active ? 'Active' : 'Disabled'}</span>
                                            </div>
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

export default StaffDocumentTypes;
