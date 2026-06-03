import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calendar, Users, Building2, BookX, CheckCircle, Clock, Save, Loader2, ArrowRight, List, FileText, Check, X
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveApplication = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();

    const [employees, setEmployees] = useState([]);
    const [balances, setBalances] = useState([]);
    const [applications, setApplications] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        employee_type: '',
        user_id: '',
        attendance_legend_id: '',
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0],
        is_half_day: false,
        reason: ''
    });

    useEffect(() => {
        if (selectedBranch?.id) {
            fetchEmployees();
        }
        if (selectedBranch?.id && selectedSession?.id) {
            fetchApplications();
        } else {
            setApplications([]);
        }
    }, [selectedBranch, selectedSession]);

    useEffect(() => {
        if (formData.user_id && selectedSession?.id) {
            fetchBalances();
        } else {
            setBalances([]);
            setFormData(prev => ({ ...prev, attendance_legend_id: '' }));
        }
    }, [formData.user_id, selectedSession]);

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

    const fetchEmployees = async () => {
        try {
            const res = await api.get('users', { 
                headers: { 'branch-id': selectedBranch?.id }
            });
            setEmployees(res.data);
        } catch (err) {
            toast.error('Failed to fetch employees');
        }
    };

    const fetchBalances = async () => {
        setLoading(true);
        try {
            const res = await api.get('leave-applications/balances', {
                params: {
                    user_id: formData.user_id,
                    session_id: selectedSession?.id
                },
                headers: { 'branch-id': selectedBranch?.id }
            });
            setBalances(res.data);
            
            // Auto select first available leave type if none selected
            const availableStats = res.data.filter(b => b.remaining > 0);
            if (availableStats.length > 0 && !formData.attendance_legend_id) {
                setFormData(prev => ({ ...prev, attendance_legend_id: availableStats[0].legend.id.toString() }));
            } else if (availableStats.length === 0) {
                 setFormData(prev => ({ ...prev, attendance_legend_id: '' }));
            }
        } catch (err) {
            toast.error('Failed to fetch leave balances');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            
            if (field === 'employee_type') {
                next.user_id = '';
            }
            if (field === 'is_half_day' && value) {
                next.to_date = next.from_date;
            }
            if (field === 'from_date' && (!prev.to_date || prev.to_date < value)) {
                next.to_date = value;
            }
            return next;
        });
    };

    const filteredEmployees = useMemo(() => {
        if (!formData.employee_type) return [];
        return employees.filter(emp => emp.employee?.employee_type === formData.employee_type);
    }, [employees, formData.employee_type]);

    const activeBalance = useMemo(() => {
        if (!formData.attendance_legend_id) return null;
        return balances.find(b => b.legend.id.toString() === formData.attendance_legend_id.toString());
    }, [balances, formData.attendance_legend_id]);

    const calculatedDays = useMemo(() => {
        if (!formData.from_date || !formData.to_date) return 0;
        if (formData.is_half_day) return 0.5;
        const start = new Date(formData.from_date);
        const end = new Date(formData.to_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
        return diffDays;
    }, [formData.from_date, formData.to_date, formData.is_half_day]);

    const maxToDate = useMemo(() => {
        if (!formData.from_date || !activeBalance || activeBalance.remaining <= 0) return undefined;
        // max dates we can span is remaining total days. 
        // Example: remaining=3, start=Apr 1, we can span 3 days (Apr 1, 2, 3), so we add 2 to the start date.
        const maxDaysToAdd = Math.ceil(activeBalance.remaining) - 1;
        if (maxDaysToAdd < 0) return formData.from_date;
        
        const date = new Date(formData.from_date);
        date.setDate(date.getDate() + maxDaysToAdd);
        return date.toISOString().split('T')[0];
    }, [formData.from_date, activeBalance]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedSession?.id) {
            return toast.error("Please select a session first");
        }

        if (activeBalance && calculatedDays > activeBalance.remaining) {
            return toast.error(`Requested days (${calculatedDays}) exceeds remaining balance (${activeBalance.remaining})`);
        }

        setSaving(true);
        try {
            await api.post('leave-applications', {
                ...formData,
                session_id: selectedSession.id
            }, {
                headers: { 'branch-id': selectedBranch?.id }
            });
            toast.success('Leave applied successfully');
            
            // Refresh balances & applications
            fetchBalances();
            fetchApplications();
            
            // Reset reason dates
            setFormData(prev => ({
                ...prev,
                reason: '',
                from_date: new Date().toISOString().split('T')[0],
                to_date: new Date().toISOString().split('T')[0],
                is_half_day: false
            }));
            
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to apply leave');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <BookX size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight font-outfit">Apply for Leave</h2>
                        <p className="text-sm font-bold text-slate-400">Apply for leaves and track remaining balances in real-time</p>
                    </div>
                </div>
                <Link
                    to="/school-panel/employee/leave"
                    className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-200 transition-colors"
                >
                    <List size={18} /> View History
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Form Details */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                            
                            {/* Employee Selection */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Employee Type <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            required
                                            value={formData.employee_type}
                                            onChange={(e) => handleChange('employee_type', e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all appearance-none"
                                        >
                                            <option value="">Select Employee Type</option>
                                            <option value="Teaching Staff">Teaching Staff</option>
                                            <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                                            <option value="Management">Management</option>
                                        </select>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {formData.employee_type && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                Select Employee <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <select
                                                    required
                                                    value={formData.user_id}
                                                    onChange={(e) => handleChange('user_id', e.target.value)}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all appearance-none"
                                                >
                                                    <option value="">Select Employee</option>
                                                    {filteredEmployees.map(emp => (
                                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Leave Details */}
                            <AnimatePresence>
                                {formData.user_id && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6 pt-6 border-t border-slate-100"
                                    >
                                        {/* Leave Type */}
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                Leave Type <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative font-bold">
                                                {loading ? (
                                                    <div className="flex items-center gap-2 py-3 px-4 bg-slate-50 rounded-xl border-2 border-slate-100 text-sm text-slate-400">
                                                        <Loader2 size={16} className="animate-spin" /> Fetching balances...
                                                    </div>
                                                ) : (
                                                    <select
                                                        required
                                                        value={formData.attendance_legend_id}
                                                        onChange={(e) => handleChange('attendance_legend_id', e.target.value)}
                                                        className="w-full bg-white border-2 border-amber-100 rounded-xl py-3 px-4 text-sm font-bold text-amber-700 focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Select available leave type</option>
                                                        {balances.filter(b => b.remaining > 0).map(b => (
                                                            <option key={b.legend.id} value={b.legend.id}>
                                                                {b.legend.name} ({b.legend.short_name}) - {b.remaining} remaining
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dates */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                    From Date <span className="text-rose-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        required
                                                        value={formData.from_date}
                                                        onChange={(e) => handleChange('from_date', e.target.value)}
                                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                    To Date <span className="text-rose-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        required
                                                        min={formData.from_date}
                                                        max={maxToDate}
                                                        disabled={formData.is_half_day}
                                                        value={formData.to_date}
                                                        onChange={(e) => handleChange('to_date', e.target.value)}
                                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all cursor-pointer disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Half Day Toggle */}
                                        <label className="flex items-center gap-3 cursor-pointer group w-max">
                                            <div 
                                                onClick={() => handleChange('is_half_day', !formData.is_half_day)}
                                                className={`w-12 h-7 rounded-full transition-all relative border-2 ${formData.is_half_day ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all shadow-sm ${formData.is_half_day ? 'left-6 bg-orange-500' : 'left-1.5 bg-slate-300'}`} />
                                            </div>
                                            <span className={`text-xs font-black uppercase tracking-widest ${formData.is_half_day ? 'text-orange-600' : 'text-slate-400'}`}>
                                                Half Day Leave
                                            </span>
                                        </label>

                                        {/* Reason */}
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                Reason for Leave
                                            </label>
                                            <textarea
                                                rows="3"
                                                value={formData.reason}
                                                onChange={(e) => handleChange('reason', e.target.value)}
                                                placeholder="Enter a brief reason..."
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-300"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Column: Balance Widget */}
                    <div>
                        <div className="sticky top-10">
                            {activeBalance ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
                                >
                                    {/* Decorative glowing gradient */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-[80px] rounded-full pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />
                                    
                                    <div className="relative z-10 flex flex-col h-full space-y-8">
                                        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                                                <Clock size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Leave Balance Display</p>
                                                <h3 className="text-xl font-black text-white">{activeBalance.legend.name}</h3>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Metrics */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Leaves</p>
                                                    <p className="text-3xl font-black text-white">{activeBalance.total}</p>
                                                </div>
                                                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leaves Consumed</p>
                                                    <p className="text-3xl font-black text-amber-400">{activeBalance.consumed}</p>
                                                </div>
                                            </div>

                                            {/* Remaining Master Metric */}
                                            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-[2rem] p-8 border border-emerald-500/30 text-center relative overflow-hidden">
                                                <CheckCircle size={100} className="absolute -right-8 -bottom-8 text-emerald-500/20" />
                                                <p className="text-[11px] font-black text-emerald-300 uppercase tracking-[0.3em] mb-2">Remaining Leaves</p>
                                                <p className="text-6xl font-black text-white tracking-tight">{activeBalance.remaining}</p>
                                            </div>
                                        </div>

                                        {/* Dynamic Application Summary */}
                                        {calculatedDays > 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-5 rounded-2xl border ${calculatedDays > activeBalance.remaining ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-blue-500/10 border-blue-500/30 text-blue-300'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase tracking-widest">You are applying for</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl font-black text-white">{calculatedDays}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Days</span>
                                                    </div>
                                                </div>
                                                
                                                {calculatedDays > activeBalance.remaining && (
                                                    <p className="text-[10px] uppercase font-black tracking-wider text-rose-400 mt-2 text-right">
                                                        Exceeds available balance!
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-[500px] rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center p-12 text-center text-slate-400">
                                    {!formData.user_id ? (
                                        <div>
                                            <Users size={48} className="mx-auto mb-4 text-slate-300" />
                                            <p className="font-bold text-sm">Select an employee to view real-time leave balances</p>
                                        </div>
                                    ) : !formData.attendance_legend_id ? (
                                        <div>
                                            <BookX size={48} className="mx-auto mb-4 text-slate-300" />
                                            <p className="font-bold text-sm">Select a Valid Leave Type</p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                {formData.user_id && activeBalance && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-end pt-8"
                    >
                        <button
                            type="submit"
                            disabled={saving || calculatedDays <= 0 || calculatedDays > activeBalance.remaining}
                            className="bg-blue-600 text-white rounded-2xl px-10 py-5 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Submit Application
                            {!saving && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </motion.div>
                )}
            </form>
        </div>
    );
};

export default LeaveApplication;
