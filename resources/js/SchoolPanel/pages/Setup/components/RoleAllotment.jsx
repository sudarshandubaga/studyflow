import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, UserCheck, Search, Users, ShieldCheck, ChevronRight, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const RoleAllotment = () => {
    const { user } = useAuth();
    const [roles, setRoles] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [targetRoleId, setTargetRoleId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user?.school_id) {
            fetchRoles();
            fetchStaff();
        }
    }, [user]);

    const fetchRoles = async () => {
        try {
            const res = await api.get('roles', {
                headers: { 'branch-id': user.branch_id || user.school_id }
            });
            setRoles(res.data);
        } catch (err) { toast.error('Failed to fetch roles'); }
    };

    const fetchStaff = async () => {
        setLoading(true);
        try {
            // Reusing UserController's index for now, assuming staff are filtered or all users here
            const res = await api.get('users', {
                headers: { 'school-id': user.school_id }
            });
            setStaff(res.data);
        } catch (err) { toast.error('Failed to fetch staff'); }
        finally { setLoading(false); }
    };

    const handleAssign = async () => {
        if (!targetRoleId || !selectedUsers.length) {
            toast.error('Select users and a role');
            return;
        }
        setSaving(true);
        try {
            await api.post('users/bulk-assign-role', {
                user_ids: selectedUsers,
                role_id: targetRoleId
            });
            toast.success(`Role assigned to ${selectedUsers.length} users`);
            setSelectedUsers([]);
            setTargetRoleId('');
            fetchStaff(); // Refresh
        } catch (err) { toast.error('Assignment failed'); }
        finally { setSaving(false); }
    };

    const filtered = staff.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const toggleUser = (id) => {
        const u = [...selectedUsers];
        const idx = u.indexOf(id);
        if (idx > -1) u.splice(idx, 1);
        else u.push(id);
        setSelectedUsers(u);
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <Users size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Role Allotment</h3>
                        <p className="text-sm text-slate-400 font-medium">Assign roles and permissions to your staff in bulk.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find staff..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-100 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-indigo-50 focus:border-indigo-500 outline-none w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Assignment Bar */}
            {selectedUsers.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex items-center gap-6 bg-white pr-4 pl-8 py-3 rounded-[2.5rem] shadow-[0_45px_90px_-15px_rgba(0,0,0,0.3)] border border-indigo-100 ring-8 ring-indigo-50/50">
                        <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
                            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">{selectedUsers.length}</span>
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Selected Users</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <select 
                                className="bg-slate-50 border-2 border-slate-100 py-3 px-6 rounded-2xl outline-none font-bold text-slate-700 text-xs focus:border-indigo-500 w-44 transition-all"
                                value={targetRoleId}
                                onChange={e => setTargetRoleId(e.target.value)}
                            >
                                <option value="">Select Target Role</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <button 
                                onClick={handleAssign}
                                disabled={saving || !targetRoleId}
                                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all hover:scale-[1.03] active:scale-95 disabled:grayscale"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : 'Apply Role to All'}
                            </button>
                            <button onClick={() => setSelectedUsers([])} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={20} /></button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(person => {
                        const isSelected = selectedUsers.includes(person.id);
                        return (
                            <div 
                                key={person.id}
                                onClick={() => toggleUser(person.id)}
                                className={`group bg-white border-2 cursor-pointer rounded-[2.5rem] p-6 hover:shadow-2xl transition-all relative overflow-hidden ${
                                    isSelected ? 'border-indigo-600 bg-indigo-50/10 shadow shadow-indigo-50 ring-4 ring-indigo-50 animate-in zoom-in-95' : 'border-slate-50'
                                }`}
                            >
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50/20 rounded-full blur-2xl transition-all"></div>
                                <div className="relative z-10 flex items-center gap-5">
                                    <div className="relative">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${
                                            isSelected ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-xl' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                        }`}>
                                            {person.name.charAt(0)}
                                        </div>
                                        {person.roles?.length > 0 && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 text-white rounded-full border-2 border-white flex items-center justify-center shadow-lg"><UserCheck size={12} /></div>}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className={`font-bold font-outfit text-lg transition-all ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{person.name}</h4>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{person.roles?.[0]?.name || 'No Role'}</p>
                                    </div>
                                    <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl rotate-0' : 'border-slate-100 rotate-90 opacity-40 group-hover:opacity-100'}`}>
                                        {isSelected ? <CheckCircle size={14} strokeWidth={4} /> : <ChevronRight size={14} strokeWidth={3} />}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default RoleAllotment;
