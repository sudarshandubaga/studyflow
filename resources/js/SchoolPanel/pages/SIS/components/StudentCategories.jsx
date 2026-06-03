import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useSession } from '../../../context/SessionContext';
import { Loader2, Plus, PenBox, Trash2, Tag, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentCategories = () => {
    const { selectedSession } = useSession();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal & Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });

    useEffect(() => {
        if (selectedSession) fetchCategories();
    }, [selectedSession]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get(`student-categories?session_id=${selectedSession.id}`);
            setCategories(res.data);
        } catch (err) {
            toast.error('Failed to fetch categories');
        } finally { setLoading(false); }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setForm({ name: item.name, description: item.description || '' });
        } else {
            setEditingItem(null);
            setForm({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = { ...form, session_id: selectedSession.id };
            if (editingItem) {
                await api.put(`student-categories/${editingItem.id}`, data);
                toast.success('Category updated');
            } else {
                await api.post('student-categories', data);
                toast.success('Category created');
            }
            fetchCategories();
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await api.delete(`student-categories/${id}`);
            toast.success('Category deleted');
            fetchCategories();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <Tag size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 font-outfit">Student Categories</h3>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Define custom categories for student classification.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-100 outline-none w-48 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> New Category
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Loader2 size={32} className="animate-spin text-indigo-500" />
                    <span className="text-xs font-black uppercase tracking-widest">Loading Records...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(cat => (
                        <div key={cat.id} className="bg-white border border-slate-100 p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-100/50 transition-all group overflow-hidden relative">
                            <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-800 font-outfit">{cat.name}</h4>
                                    <p className="text-xs text-slate-500 font-medium line-clamp-2">{cat.description || 'No description provided.'}</p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleOpenModal(cat)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><PenBox size={16} /></button>
                                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-16 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl">
                            <Tag size={40} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-slate-400 font-bold text-sm">No student categories found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800 font-outfit">{editingItem ? 'Edit Category' : 'New Category'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Category Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all"
                                    placeholder="e.g. Day Scholar, New Student, Old Student, etc."
                                />
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none font-medium text-slate-700 transition-all resize-none text-sm"
                                    placeholder="Optional category details..."
                                />
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] bg-indigo-600 text-white px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : editingItem ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentCategories;
