import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, PenBox, Trash2, Plus, User, Mail, Phone, Shield, Check } from 'lucide-react';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [systemRoles, setSystemRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'staff',
        custom_roles: [],
        is_active: true
    });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('users'),
                api.get('roles') // This now returns only custom roles without default ones
            ]);
            setUsers(usersRes.data);
            setSystemRoles(rolesRes.data);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        setError('');
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                password: '',
                role: user.role,
                custom_roles: user.roles ? user.roles.map(r => r.name) : [],
                is_active: user.is_active
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                role: 'staff',
                custom_roles: [],
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const toggleRole = (roleName) => {
        setFormData(prev => {
            const current = [...prev.custom_roles];
            if (current.includes(roleName)) {
                return { ...prev, custom_roles: current.filter(r => r !== roleName) };
            } else {
                return { ...prev, custom_roles: [...current, roleName] };
            }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        
        try {
            // Clean up custom roles if not staff
            const payload = { ...formData };
            if (payload.role !== 'staff') {
                payload.custom_roles = [];
            }

            if (editingUser) {
                if (!payload.password) delete payload.password;
                await api.put(`users/${editingUser.id}`, payload);
            } else {
                await api.post('users', payload);
            }
            fetchData();
            handleCloseModal();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save user';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        
        try {
            await api.delete(`users/${id}`);
            fetchData();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleToggleActive = async (user) => {
        const newStatus = !user.is_active;
        try {
            await api.put(`users/${user.id}`, {
                is_active: newStatus
            });
            fetchData(); // Only fetching data again, no roles payload needed here depending on validation.
        } catch (err) {
            alert('Failed to toggle status');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 relative">
                <h3 className="font-bold text-lg text-slate-800 font-outfit tracking-tight">System Users</h3>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95 flex items-center gap-1 uppercase tracking-widest text-[10px]"
                >
                    <Plus size={14} /> Add New User
                </button>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs gap-3">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    Loading Data...
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="py-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] px-6">User Info</th>
                                <th className="py-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] px-4">Contact</th>
                                <th className="py-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] px-4">Roles</th>
                                <th className="py-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] px-4 text-center">Status</th>
                                <th className="py-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.length > 0 ? users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-5 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700 font-outfit text-base">{user.name}</div>
                                                <div className="text-slate-400 text-xs">ID: {user.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 space-y-1">
                                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                                            <Mail size={14} className="text-slate-400" />
                                            {user.email}
                                        </div>
                                        {user.phone && (
                                            <div className="flex items-center gap-2 text-slate-600 text-sm">
                                                <Phone size={14} className="text-slate-400" />
                                                {user.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-5 px-4">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles && user.roles.length > 0 ? (
                                                user.roles.map(r => (
                                                    <span key={r.id} className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                                                        {r.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">No roles</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 text-center">
                                        <button 
                                            onClick={() => handleToggleActive(user)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                                user.is_active
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenModal(user)}
                                                className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-colors tooltip"
                                                title="Edit User"
                                            >
                                                <PenBox size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg hover:border-rose-200 hover:bg-rose-50 transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 font-outfit">
                                {editingUser ? 'Edit User' : 'Create New User'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}
                            
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Name *</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400" 
                                    placeholder="Full Name"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email *</label>
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400" 
                                    placeholder="Email Address"
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Phone</label>
                                    <input 
                                        type="tel" 
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all" 
                                        placeholder="Phone Number"
                                    />
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Primary Role *</label>
                                    <select 
                                        value={formData.role}
                                        onChange={e => setFormData({...formData, role: e.target.value})}
                                        className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all"
                                        required
                                    >
                                        <option value="owner">Owner</option>
                                        <option value="admin">Admin</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="parent">Parent</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Password {editingUser && '(Optional)'}</label>
                                    <input 
                                        type="password" 
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all" 
                                        placeholder="Min 8 chars"
                                        minLength="8"
                                        required={!editingUser}
                                    />
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                                    <select 
                                        value={formData.is_active}
                                        onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
                                        className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-700 transition-all"
                                    >
                                        <option value="false">Inactive</option>
                                        <option value="true">Active</option>
                                    </select>
                                </div>
                            </div>

                            {formData.role === 'staff' && systemRoles.length > 0 && (
                                <div className="space-y-4 pt-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Assign Custom Staff Roles</label>
                                    <div className="flex flex-wrap gap-2">
                                        {systemRoles.map(role => {
                                            const isSelected = formData.custom_roles.includes(role.name);
                                            return (
                                                <button
                                                    type="button"
                                                    key={role.id}
                                                    onClick={() => toggleRole(role.name)}
                                                    className={`
                                                        flex items-center gap-2 p-2 px-3 rounded-lg border transition-all
                                                        ${isSelected 
                                                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }
                                                    `}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                                                        {isSelected && <Check size={10} strokeWidth={3} />}
                                                    </div>
                                                    <span className="text-[11px] font-bold uppercase tracking-wider">{role.name}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 text-white px-7 py-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-70 flex items-center gap-2 font-bold text-sm"
                                >
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    {saving ? 'Saving...' : 'Save User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersList;
