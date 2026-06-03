import React, { useState, useEffect } from 'react';
import { List, Clock, Check, X, Plus, BookX } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';

const LeaveApplicationList = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();
    const [applications, setApplications] = useState([]);

    useEffect(() => {
        if (selectedBranch?.id && selectedSession?.id) {
            fetchApplications();
        } else {
            setApplications([]);
        }
    }, [selectedBranch, selectedSession]);

    const fetchApplications = async () => {
        try {
            const res = await api.get('leave-applications', {
                params: { session_id: selectedSession?.id },
                headers: { 'branch-id': selectedBranch?.id }
            });
            setApplications(res.data);
        } catch (err) {
            console.error('Failed to fetch leave applications', err);
        }
    };

    const handleStatusChange = async (appId, newStatus) => {
        try {
            await api.patch(`leave-applications/${appId}/status`, { status: newStatus }, {
                headers: { 'branch-id': selectedBranch?.id }
            });
            toast.success(`Leave application ${newStatus} successfully`);
            fetchApplications();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <List size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight font-outfit">Leave History</h2>
                        <p className="text-sm font-bold text-slate-400">View and manage all employee leave requests</p>
                    </div>
                </div>
                <Link
                    to="/school-panel/employee/leave/apply"
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} /> Apply Leave
                </Link>
            </div>

            {applications.length > 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Employee</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Leave Type</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Dates & Duration</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Reason</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Applied On</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {applications.map((app) => (
                                    <tr key={app.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {app.user?.avatar ? (
                                                        <img src={`/storage/${app.user.avatar}`} alt={app.user?.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-slate-500 text-xs">{app.user?.name?.charAt(0) || '-'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{app.user?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">{app.user?.email || app.user?.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-bold text-xs">
                                                {app.attendance_legend?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-sm text-slate-700 whitespace-nowrap">
                                                {new Date(app.from_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                                                {app.from_date !== app.to_date && (
                                                    <span className="text-slate-400 font-medium"> to {new Date(app.to_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                                )}
                                            </p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                {app.is_half_day ? 'Half Day' : `${Math.ceil((new Date(app.to_date) - new Date(app.from_date)) / (1000 * 60 * 60 * 24)) + 1} Days`}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-500 line-clamp-2 max-w-[200px]">
                                                {app.reason || <span className="italic text-slate-300">No reason provided</span>}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-sm text-slate-700 whitespace-nowrap">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {app.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleStatusChange(app.id, 'approved')}
                                                        className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-100 transition-colors tooltip"
                                                        title="Approve Leave"
                                                    >
                                                        <Check size={14} /> Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange(app.id, 'rejected')}
                                                        className="flex items-center gap-1 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-rose-100 transition-colors tooltip"
                                                        title="Reject Leave"
                                                    >
                                                        <X size={14} /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end">
                                                    {app.status === 'approved' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-[11px] uppercase tracking-widest shadow-sm"><Check size={12} /> Approved</span>}
                                                    {app.status === 'rejected' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold text-[11px] uppercase tracking-widest shadow-sm"><X size={12} /> Rejected</span>}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="h-[400px] border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                    <BookX size={48} className="mb-4 text-slate-300" />
                    <p className="font-bold">No leave applications found for the selected branch/session.</p>
                </div>
            )}
        </div>
    );
};

export default LeaveApplicationList;
