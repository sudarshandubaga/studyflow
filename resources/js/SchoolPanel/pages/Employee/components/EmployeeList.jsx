import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { 
    Users, 
    UserPlus, 
    Search, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    Eye,
    Shield,
    BadgeCheck,
    Filter,
    ArrowUpDown,
    Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useBranch } from '../../../context/BranchContext';

const EmployeeList = () => {
    const navigate = useNavigate();
    const { selectedBranch } = useBranch();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, [selectedBranch]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await api.get('users', {
                headers: { 'branch-id': selectedBranch?.id }
            });
            // Filter only staff/teachers/admins if needed, but here we show all users in the branch
            setEmployees(res.data);
        } catch (err) {
            toast.error('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this employee?')) return;
        try {
            await api.delete(`users/${id}`);
            toast.success('Employee deleted successfully');
            fetchEmployees();
        } catch (err) {
            toast.error('Failed to delete employee');
        }
    };

    const filteredEmployees = employees.filter(emp => 
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-sm">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 font-outfit">Staff Directory</h2>
                        <p className="text-xs text-slate-500 font-medium">Manage all teaching and non-teaching staff members.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-all shadow-sm">
                        <Download size={18} />
                    </button>
                    <button 
                        onClick={() => navigate('/school-panel/employee/add')}
                        className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-violet-100 hover:bg-violet-700 transition-all flex items-center gap-2"
                    >
                        <UserPlus size={18} /> Add Employee
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-violet-50 focus:border-violet-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                            <Filter size={16} /> Filter
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                            <ArrowUpDown size={16} /> Sort
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Employee</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Role & Type</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4"><div className="h-12 bg-slate-100 rounded-xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                                    {emp.avatar ? (
                                                        <img src={`/storage/${emp.avatar}`} alt={emp.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-sm">{emp.name?.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-violet-600 transition-colors uppercase tracking-tight">{emp.name}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{emp.employee?.attendance_code || 'No Code'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Shield size={12} className="text-violet-500" />
                                                    <span className="text-[11px] font-bold text-slate-600 capitalize">
                                                        {emp.roles?.map(r => r.name).join(', ') || emp.role}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <BadgeCheck size={12} className="text-sky-500" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{emp.employee?.employee_type || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-medium text-slate-600">{emp.email}</div>
                                            <div className="text-[10px] text-slate-400 font-bold">{emp.mobile_number || emp.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                emp.is_active 
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                    : 'bg-slate-50 text-slate-400 border border-slate-100'
                                            }`}>
                                                {emp.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button 
                                                    onClick={() => navigate(`/school-panel/employee/edit/${emp.id}`)}
                                                    className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(emp.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Users size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold">No employees found matching your search.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeList;
