import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, UserCheck, Search, X, Check, CheckSquare, Square, Tags, Shield, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const RolesList = () => {
    const { user } = useAuth();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Inline Add State
    const [isAdding, setIsAdding] = useState(false);
    const [newRole, setNewRole] = useState({ name: '', parent_id: '' });
    const [saving, setSaving] = useState(false);

    // Inline Edit State
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (user?.school_id) {
            fetchRoles();
        }
    }, [user]);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await api.get('roles', {
                headers: { 'branch-id': user.branch_id || user.school_id }
            });
            setRoles(res.data);
        } catch (err) { toast.error('Failed to fetch roles'); }
        finally { setLoading(false); }
    };


    const handleSaveRole = async () => {
        if (!newRole.name.trim()) return;
        setSaving(true);
        try {
            const data = { ...newRole, branch_id: user.branch_id || user.school_id };
            let res;
            if (editingId) {
                res = await api.put(`roles/${editingId}`, data);
                setRoles(roles.map(r => r.id === editingId ? res.data : r));
                toast.success('Role updated');
            } else {
                res = await api.post('roles', data);
                setRoles([...roles, res.data]);
                toast.success('Role created');
            }
            setIsAdding(false);
            setEditingId(null);
            setNewRole({ name: '', parent_id: '' });
        } catch (err) { toast.error('Failed to save role'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this role?')) return;
        try {
            await api.delete(`roles/${id}`);
            setRoles(roles.filter(r => r.id !== id));
            toast.success('Role deleted');
        } catch (err) { toast.error('Failed to delete'); }
    };


    const filtered = roles.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <Shield size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Staff Roles</h3>
                        <p className="text-sm text-slate-400 font-medium">Manage hierarchical roles and system-wide permissions.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search roles..."
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
                            <Plus size={18} /> New Role
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isAdding && (
                        <div className="col-span-full bg-white border-2 border-indigo-600 rounded-[2.5rem] p-8 space-y-8 shadow-2xl shadow-indigo-100 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xl text-slate-800">{editingId ? 'Edit' : 'Create'} Role</h4>
                                <button onClick={() => { setIsAdding(false); setEditingId(null); setNewRole({name:'', parent_id:''}); }} className="text-slate-400 hover:text-rose-500"><X size={24} /></button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Role Name</label>
                                            <input
                                                type="text"
                                                value={newRole.name}
                                                onChange={e => setNewRole({...newRole, name: e.target.value})}
                                                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                                placeholder="Accountant, Coordinator, etc."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Parent Role (Hierarchy)</label>
                                            <select 
                                                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                                value={newRole.parent_id}
                                                onChange={e => setNewRole({...newRole, parent_id: e.target.value})}
                                            >
                                                <option value="">No Parent (Root Role)</option>
                                                {roles.filter(r => r.id !== editingId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={handleSaveRole} disabled={saving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700">
                                            {saving ? 'Saving...' : 'Save Role'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {filtered.map(role => (
                        <div key={role.id} className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-6 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group overflow-hidden relative">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50/20 rounded-full blur-2xl group-hover:bg-indigo-100/30 transition-all"></div>
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => { setEditingId(role.id); setNewRole({ name: role.name, parent_id: role.parent_id || '' }); setIsAdding(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"><PenBox size={16} /></button>
                                        <button onClick={() => handleDelete(role.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-xl text-slate-800 font-outfit">{role.name}</h4>
                                    {role.parent_id && (
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-500">
                                            Parent: {roles.find(r => r.id === role.parent_id)?.name}
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-slate-200 tracking-[0.15em]">System Role</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RolesList;
