import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, Search, X, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BillBookList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ book_name: '', prefix: 'RCT', start_number: 1, end_number: '', is_active: true });
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        setLoading(true);
        try { const res = await api.get('fee-bill-books'); setItems(Array.isArray(res.data) ? res.data : []); }
        catch { toast.error('Failed to fetch'); }
        finally { setLoading(false); }
    };

    const handleAdd = async () => {
        if (!newItem.book_name.trim()) return toast.error('Name is required');
        setSaving(true);
        try {
            const res = await api.post('fee-bill-books', { ...newItem, end_number: newItem.end_number || null, branch_id: localStorage.getItem('selectedBranchId'), session_id: localStorage.getItem('selectedSessionId') });
            setItems([...items, res.data]);
            setNewItem({ book_name: '', prefix: 'RCT', start_number: 1, end_number: '', is_active: true });
            setIsAdding(false);
            toast.success('Bill book created');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleSaveEdit = async (id) => {
        setSaving(true);
        try {
            const res = await api.put(`fee-bill-books/${id}`, { ...editForm, end_number: editForm.end_number || null });
            setItems(items.map(i => i.id === id ? res.data : i));
            setEditingId(null);
            toast.success('Updated');
        } catch { toast.error('Failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this bill book?')) return;
        try { await api.delete(`fee-bill-books/${id}`); setItems(items.filter(i => i.id !== id)); toast.success('Deleted'); }
        catch { toast.error('Failed'); }
    };

    const filtered = items.filter(i => i.book_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm"><BookOpen size={28} /></div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Fee Bill Books</h3>
                        <p className="text-sm text-slate-400 font-medium">Manage receipt number series and prefixes.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-100 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold focus:border-amber-500 outline-none w-64 transition-all" />
                    </div>
                    {!isAdding && <button onClick={() => setIsAdding(true)} className="bg-amber-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all flex items-center gap-2"><Plus size={18} /> Add Book</button>}
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5"><Loader2 size={40} className="animate-spin text-amber-500" /> Loading...</div>
            ) : (
                <div className="space-y-4">
                    {isAdding && (
                        <div className="bg-white border-2 border-amber-600 rounded-[2rem] p-6 space-y-5 shadow-2xl shadow-amber-100 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">New Bill Book</span>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input autoFocus type="text" placeholder="Book Name *" value={newItem.book_name} onChange={e => setNewItem({ ...newItem, book_name: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-amber-500 text-sm" />
                                <input type="text" placeholder="Prefix (e.g. RCT)" value={newItem.prefix} onChange={e => setNewItem({ ...newItem, prefix: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-amber-500 text-sm" />
                                <input type="number" placeholder="Start Number" value={newItem.start_number} onChange={e => setNewItem({ ...newItem, start_number: parseInt(e.target.value) || 1 })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-amber-500 text-sm" />
                                <input type="number" placeholder="End Number (Optional)" value={newItem.end_number} onChange={e => setNewItem({ ...newItem, end_number: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-amber-500 text-sm" />
                            </div>
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Preview: </span>
                                <span className="font-black text-amber-800 font-mono text-lg">{newItem.prefix || 'RCT'}-{String(newItem.start_number || 1).padStart(6, '0')}</span>
                            </div>
                            <button onClick={handleAdd} disabled={saving || !newItem.book_name.trim()} className="w-full py-4 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 disabled:opacity-50 text-xs font-black uppercase tracking-widest">
                                {saving ? 'Creating...' : 'Create Bill Book'}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map(item => (
                            <div key={item.id} className="group bg-white border border-slate-100 rounded-[2.5rem] p-6 hover:shadow-lg transition-all relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-amber-50/80 blur-2xl -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100"><BookOpen size={24} /></div>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => { setEditingId(item.id); setEditForm({ ...item }); }} className="p-2 text-slate-400 hover:text-amber-600 rounded-xl"><PenBox size={16} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-xl"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-slate-800 font-outfit text-lg">{item.book_name}</h4>
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[9px] font-black uppercase text-slate-400">Prefix</span>
                                            <span className="font-bold text-slate-700 font-mono">{item.prefix || '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[9px] font-black uppercase text-slate-400">Range</span>
                                            <span className="font-bold text-slate-700">{item.start_number} → {item.end_number || '∞'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[9px] font-black uppercase text-slate-400">Current</span>
                                            <span className="font-black text-amber-700 font-mono">{item.prefix || 'RCT'}-{String(item.current_number).padStart(6, '0')}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                            <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all"
                                                style={{ width: item.end_number ? `${((item.current_number - item.start_number) / (item.end_number - item.start_number)) * 100}%` : '10%' }} />
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{item.is_active ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && !isAdding && (
                            <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                                <BookOpen size={48} className="text-slate-200 mb-4 mx-auto" />
                                <h5 className="font-bold text-slate-700 text-lg">No bill books</h5>
                                <button onClick={() => setIsAdding(true)} className="mt-4 text-amber-600 font-black text-[11px] uppercase tracking-widest hover:bg-amber-600 hover:text-white px-8 py-3 rounded-2xl border-2 border-amber-600 transition-all">Create first</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillBookList;
