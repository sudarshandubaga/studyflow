import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, LayoutGrid, Search, X, Check, Hash, CheckSquare, Square, Tags, ListOrdered } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const CustomFieldCategoriesList = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    
    // Inline Add State
    const [isAdding, setIsAdding] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', short_name: '', type: 'Student', sort_order: 0 });
    const [saving, setSaving] = useState(false);

    // Inline Edit State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', short_name: '', type: 'Student', sort_order: 0, is_active: true });

    useEffect(() => {
        if (user?.school_id) {
            fetchCategories();
            setSelectedIds([]);
        }
    }, [user]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('custom-field-categories', {
                headers: { 'school-id': user.school_id }
            });
            setCategories(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            toast.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            toast.error('Please enter a name');
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('custom-field-categories', {
                ...newCategory,
                school_id: user.school_id
            });
            setCategories([...categories, res.data]);
            setNewCategory({ name: '', short_name: '', type: 'Student', sort_order: 0 });
            setIsAdding(false);
            toast.success('Category added');
        } catch (err) {
            toast.error('Failed to add category');
        } finally { setSaving(false); }
    };

    const handleSaveEdit = async (id) => {
        if (!editForm.name.trim()) return;
        setSaving(true);
        try {
            const res = await api.put(`custom-field-categories/${id}`, {
                ...editForm,
                school_id: user.school_id
            });
            setCategories(categories.map(c => c.id === id ? res.data : c));
            setEditingId(null);
            toast.success('Category updated');
        } catch (err) {
            toast.error('Failed to update category');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category? Fields within it will also be deleted.')) return;
        try {
            await api.delete(`custom-field-categories/${id}`);
            setCategories(categories.filter(c => c.id !== id));
            toast.success('Category deleted');
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;
        if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} categories?`)) return;
        
        setIsBulkLoading(true);
        try {
            await api.post('custom-field-categories/bulk', { ids: selectedIds, action });
            if (action === 'delete') {
                setCategories(categories.filter(c => !selectedIds.includes(c.id)));
                setSelectedIds([]);
            } else {
                fetchCategories();
                setSelectedIds([]);
            }
            toast.success('Bulk operation successful');
        } catch (err) {
            toast.error('Bulk operation failed');
        } finally { setIsBulkLoading(false); }
    };

    const filtered = categories.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <LayoutGrid size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Custom Field Categories</h3>
                        <p className="text-sm text-slate-400 font-medium">Group custom fields for Student and Employee profiles.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find category..."
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
                            <Plus size={18} /> New Category
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk Action Bar */}
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
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <Loader2 size={40} className="animate-spin text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading categories...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isAdding && (
                        <div className="bg-white border-2 border-indigo-600 rounded-[2.5rem] p-6 space-y-5 shadow-2xl shadow-indigo-100 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Create Category</span>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="space-y-4">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Category Name"
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Short Name"
                                        value={newCategory.short_name}
                                        onChange={e => setNewCategory({ ...newCategory, short_name: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Order"
                                        value={newCategory.sort_order}
                                        onChange={e => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm"
                                    />
                                </div>
                                <select 
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm"
                                    value={newCategory.type}
                                    onChange={e => setNewCategory({ ...newCategory, type: e.target.value })}
                                >
                                    <option value="Student">Student Fields</option>
                                    <option value="Employee">Employee Fields</option>
                                </select>
                                <button 
                                    onClick={handleAddCategory}
                                    disabled={saving || !newCategory.name}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all"
                                >
                                    {saving ? 'Creating...' : 'Save Category'}
                                </button>
                            </div>
                        </div>
                    )}

                    {filtered.map(category => {
                        const isSelected = selectedIds.includes(category.id);
                        return (
                            <div 
                                key={category.id}
                                onClick={() => setSelectedIds(prev => prev.includes(category.id) ? prev.filter(id => id !== category.id) : [...prev, category.id])}
                                className={`group bg-white border-2 cursor-pointer rounded-[2.5rem] p-6 hover:shadow-[0_40px_80px_rgb(0,0,0,0.05)] transition-all relative overflow-hidden ${
                                    isSelected ? 'border-indigo-600 bg-indigo-50/10' : 'border-slate-50'
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
                                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                            }`}>
                                                <Tags size={18} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setEditingId(category.id); setEditForm({...category}); }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                            >
                                                <PenBox size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {editingId === category.id ? (
                                        <div onClick={e => e.stopPropagation()} className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="number"
                                                    value={editForm.sort_order}
                                                    onChange={e => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) })}
                                                    className="bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                                />
                                                <select 
                                                    className="bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                                    value={editForm.type}
                                                    onChange={e => setEditForm({...editForm, type: e.target.value})}
                                                >
                                                    <option value="Student">Student</option>
                                                    <option value="Employee">Employee</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSaveEdit(category.id)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Save</button>
                                                <button onClick={() => setEditingId(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-slate-800 font-outfit text-lg">{category.name}</h4>
                                                <span className="text-[10px] font-black text-slate-300">#{category.sort_order}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    category.type === 'Student' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'
                                                }`}>{category.type} profile</span>
                                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    category.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                }`}>{category.is_active ? 'Active' : 'Disabled'}</span>
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

export default CustomFieldCategoriesList;
