import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, FileJson, Search, X, Check, Hash, CheckSquare, Square, Tags, ListOrdered, Settings, ToggleLeft, ToggleRight, MoreVertical, LayoutGrid, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const CustomFieldsList = () => {
    const { user } = useAuth();
    const [fields, setFields] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    
    // Inline Add State
    const [isAdding, setIsAdding] = useState(false);
    const [newField, setNewField] = useState({ 
        custom_field_category_id: '', 
        name: '', 
        field_type: 'Textbox', 
        data_type: 'Alpha-Numeric', 
        options: '', 
        is_mandatory: false, 
        show_on_table: true, 
        default_value: '', 
        placeholder: '', 
        validation_message: '', 
        max_length: '', 
        sort_order: 0,
        is_active: true
    });
    const [saving, setSaving] = useState(false);

    // Inline Edit State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        if (user?.school_id) {
            fetchCategories();
            fetchFields();
            setSelectedIds([]);
        }
    }, [user]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('custom-field-categories', {
                headers: { 'school-id': user.school_id }
            });
            setCategories(Array.isArray(res.data) ? res.data : []);
        } catch (err) { toast.error('Failed to fetch categories'); }
    };

    const fetchFields = async () => {
        setLoading(true);
        try {
            const res = await api.get('custom-fields', {
                headers: { 'school-id': user.school_id }
            });
            setFields(Array.isArray(res.data) ? res.data : []);
        } catch (err) { toast.error('Failed to fetch fields'); }
        finally { setLoading(false); }
    };

    const handleAddField = async () => {
        if (!newField.name.trim() || !newField.custom_field_category_id) {
            toast.error('Please fill required fields');
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                const res = await api.put(`custom-fields/${editingId}`, {
                    ...newField,
                    school_id: user.school_id
                });
                setFields(fields.map(f => f.id === editingId ? res.data : f));
                toast.success('Field updated successfully');
            } else {
                const res = await api.post('custom-fields', {
                    ...newField,
                    school_id: user.school_id
                });
                setFields([...fields, res.data]);
                toast.success('Field created successfully');
            }
            
            setNewField({ 
                custom_field_category_id: '', 
                name: '', 
                field_type: 'Textbox', 
                data_type: 'Alpha-Numeric', 
                options: '', 
                is_mandatory: false, 
                show_on_table: true, 
                default_value: '', 
                placeholder: '', 
                validation_message: '', 
                max_length: '', 
                sort_order: 0,
                is_active: true
            });
            setIsAdding(false);
            setEditingId(null);
        } catch (err) { toast.error(editingId ? 'Failed to update field' : 'Failed to create field'); }
        finally { setSaving(false); }
    };

    const handleSaveEdit = async (id) => {
        if (!editForm.name.trim()) return;
        setSaving(true);
        try {
            const res = await api.put(`custom-fields/${id}`, {
                ...editForm,
                school_id: user.school_id
            });
            setFields(fields.map(f => f.id === id ? res.data : f));
            setEditingId(null);
            toast.success('Field updated');
        } catch (err) { toast.error('Failed to update field'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this field?')) return;
        try {
            await api.delete(`custom-fields/${id}`);
            setFields(fields.filter(f => f.id !== id));
            toast.success('Field deleted');
        } catch (err) { toast.error('Failed to delete'); }
    };

    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;
        if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} fields?`)) return;
        
        setIsBulkLoading(true);
        try {
            await api.post('custom-fields/bulk', { ids: selectedIds, action });
            if (action === 'delete') {
                setFields(fields.filter(f => !selectedIds.includes(f.id)));
                setSelectedIds([]);
            } else {
                fetchFields();
                setSelectedIds([]);
            }
            toast.success('Bulk action successful');
        } catch (err) { toast.error('Bulk action failed'); }
        finally { setIsBulkLoading(false); }
    };

    const filtered = fields.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getFieldTypeIcon = (type) => {
        switch(type) {
            case 'Textbox': return <LayoutGrid size={14} />;
            case 'textarea': return <LayoutGrid size={14} />;
            case 'Pulldown': return <ListOrdered size={14} />;
            case 'radio': return <CheckSquare size={14} />;
            case 'checkbox': return <CheckSquare size={14} />;
            case 'date': return <FileJson size={14} />;
            default: return <Settings size={14} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <Settings size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Custom Fields</h3>
                        <p className="text-sm text-slate-400 font-medium">Create extra information fields for Students and Employees.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find field..."
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
                            <Plus size={18} /> New Field
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading fields...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Add Card */}
                    {isAdding && (
                        <div className="col-span-full bg-white border-2 border-indigo-600 rounded-[2.5rem] p-8 space-y-8 shadow-2xl shadow-indigo-100 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Plus size={20} />
                                    </div>
                                    <h4 className="font-bold text-xl text-slate-800">Create New Custom Field</h4>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Category *</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                        value={newField.custom_field_category_id}
                                        onChange={e => setNewField({...newField, custom_field_category_id: e.target.value})}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Field Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Mobile Number, Bio, etc."
                                        value={newField.name}
                                        onChange={e => setNewField({...newField, name: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Field Type *</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                        value={newField.field_type}
                                        onChange={e => setNewField({...newField, field_type: e.target.value})}
                                    >
                                        <option value="Textbox">Textbox</option>
                                        <option value="textarea">TextArea</option>
                                        <option value="Pulldown">Pulldown</option>
                                        <option value="radio">Radio</option>
                                        <option value="checkbox">Checkbox</option>
                                        <option value="date">Date</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Data Type *</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                        value={newField.data_type}
                                        onChange={e => setNewField({...newField, data_type: e.target.value})}
                                    >
                                        <option value="Numeric">Numeric</option>
                                        <option value="Alpha-Numeric">Alpha-Numeric</option>
                                        <option value="Alphabetic">Alphabetic</option>
                                        <option value="Alphabetic Special">Alphabetic Special</option>
                                        <option value="Alphanumeric Special">Alphanumeric Special</option>
                                        <option value="Numeric Special">Numeric Special</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Options</label>
                                        <span className="text-[9px] font-bold text-indigo-400 flex items-center gap-1"><Info size={10} /> 1 option per line</span>
                                    </div>
                                    <textarea
                                        disabled={!['Pulldown', 'radio', 'checkbox'].includes(newField.field_type)}
                                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                                        value={newField.options}
                                        onChange={e => setNewField({...newField, options: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all disabled:opacity-30 h-32 resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Default Value</label>
                                    <input
                                        type="text"
                                        value={newField.default_value}
                                        onChange={e => setNewField({...newField, default_value: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Sort Order</label>
                                    <input
                                        type="number"
                                        value={newField.sort_order}
                                        onChange={e => setNewField({...newField, sort_order: parseInt(e.target.value)})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-2 col-span-1 lg:col-span-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Placeholder & Validation</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Placeholder text"
                                            value={newField.placeholder}
                                            onChange={e => setNewField({...newField, placeholder: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Validation fail message"
                                            value={newField.validation_message}
                                            onChange={e => setNewField({...newField, validation_message: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 cursor-pointer">
                                    <input type="checkbox" checked={newField.is_mandatory} onChange={e => setNewField({...newField, is_mandatory: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 outline-none" />
                                    <span className="text-sm font-bold text-slate-700">Mandatory Field</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 cursor-pointer">
                                    <input type="checkbox" checked={newField.show_on_table} onChange={e => setNewField({...newField, show_on_table: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 outline-none" />
                                    <span className="text-sm font-bold text-slate-700">Show in Profile Table</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-4 border-t border-slate-100 pt-8">
                                <button onClick={() => { setIsAdding(false); setEditingId(null); setNewField({ custom_field_category_id: '', name: '', field_type: 'Textbox', data_type: 'Alpha-Numeric', options: '', is_mandatory: false, show_on_table: true, default_value: '', placeholder: '', validation_message: '', max_length: '', sort_order: 0, is_active: true }); }} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                                <button 
                                    onClick={handleAddField}
                                    disabled={saving}
                                    className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                >
                                    {saving ? (editingId ? 'Updating...' : 'Creating Field...') : (editingId ? 'Update Field' : 'Complete Registration')}
                                </button>
                            </div>
                        </div>
                    )}

                    {filtered.map(field => {
                        const isSelected = selectedIds.includes(field.id);
                        return (
                            <div 
                                key={field.id}
                                onClick={() => setSelectedIds(prev => prev.includes(field.id) ? prev.filter(id => id !== field.id) : [...prev, field.id])}
                                className={`group bg-white border-2 cursor-pointer rounded-[2.5rem] p-6 hover:shadow-[0_40px_80px_rgb(0,0,0,0.05)] transition-all relative overflow-hidden ${
                                    isSelected ? 'border-indigo-600 bg-indigo-50/10 shadow-lg' : 'border-slate-50'
                                }`}
                            >
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 shadow-sm'
                                            }`}>
                                                {getFieldTypeIcon(field.field_type)}
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="font-bold text-slate-800 font-outfit text-lg">{field.name}</h4>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{field.category?.name} • {field.category?.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setEditingId(field.id); setNewField({...field}); setIsAdding(true); }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                            >
                                                <PenBox size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(field.id); }}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-1 bg-slate-50 text-[8px] font-black uppercase tracking-[0.15em] text-slate-500 rounded-lg">{field.field_type}</span>
                                            <span className="px-2 py-1 bg-indigo-50 text-[8px] font-black uppercase tracking-[0.15em] text-indigo-500 rounded-lg">{field.data_type}</span>
                                            {field.is_mandatory && <span className="px-2 py-1 bg-rose-50 text-[8px] font-black uppercase tracking-[0.15em] text-rose-500 rounded-lg flex items-center gap-1"><AlertCircle size={8} /> Mandatory</span>}
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    field.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                }`}>{field.is_active ? 'Active' : 'Disabled'}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-200">#{field.sort_order}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CustomFieldsList;
