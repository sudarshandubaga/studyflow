import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { 
    Calendar, 
    Users, 
    Check, 
    X, 
    Clock, 
    Plus, 
    Trash2, 
    RefreshCcw, 
    Save, 
    Loader2,
    Briefcase,
    AlertCircle,
    ChevronDown,
    ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';

const MarkAttendance = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();
    
    // Initialize date within session range and not in future
    const getInitialDate = () => {
        const today = new Date().toISOString().split('T')[0];
        if (!selectedSession) return today;
        
        let targetDate = today;
        if (today < selectedSession.start_date) targetDate = selectedSession.start_date;
        if (today > selectedSession.end_date) targetDate = selectedSession.end_date;
        
        // Final check: Never allow future date even if session allows it
        return targetDate > today ? today : targetDate;
    };

    const [date, setDate] = useState(getInitialDate());
    const [employees, setEmployees] = useState([]);
    const [legends, setLegends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Attendance data state key by employee ID
    const [records, setRecords] = useState({});
    const [modifiedIds, setModifiedIds] = useState(new Set());

    useEffect(() => {
        if (selectedBranch?.id) {
            fetchInitialData();
        }
    }, [selectedBranch, date]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [empRes, legendRes, attendanceRes] = await Promise.all([
                api.get('users', { headers: { 'branch-id': selectedBranch?.id } }),
                api.get('attendance-legends', { params: { session_id: selectedSession?.id }, headers: { 'branch-id': selectedBranch?.id } }),
                api.get('staff-attendance', { params: { date, branch_id: selectedBranch?.id } }).catch(() => ({ data: [] }))
            ]);

            setEmployees(empRes.data);
            setLegends(legendRes.data);

            // Initialize records
            const initialRecords = {};
            // First set defaults for everyone
            empRes.data.forEach(emp => {
                initialRecords[emp.id] = {
                    legend_id: legendRes.data.find(l => l.treat_as === 'present')?.id || '',
                    is_half_day: false,
                    time_slots: [{ in: '', out: '' }]
                };
            });

            // Then override with existing attendance if any
            attendanceRes.data.forEach(record => {
                initialRecords[record.user_id] = {
                    legend_id: record.attendance_legend_id,
                    is_half_day: !!record.is_half_day,
                    time_slots: record.time_slots?.length ? record.time_slots : [{ in: '', out: '' }]
                };
            });

            setRecords(initialRecords);
            setModifiedIds(new Set());
        } catch (err) {
            toast.error('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    const handleRecordChange = (empId, field, value) => {
        setRecords(prev => ({
            ...prev,
            [empId]: { ...prev[empId], [field]: value }
        }));
        setModifiedIds(prev => new Set(prev).add(empId));
    };

    const handleTimeSlotChange = (empId, index, field, value) => {
        const currentSlots = [...records[empId].time_slots];
        currentSlots[index] = { ...currentSlots[index], [field]: value };
        handleRecordChange(empId, 'time_slots', currentSlots);
    };

    const addTimeSlot = (empId) => {
        const currentSlots = [...records[empId].time_slots];
        currentSlots.push({ in: '', out: '' });
        handleRecordChange(empId, 'time_slots', currentSlots);
    };

    const removeTimeSlot = (empId, index) => {
        const currentSlots = [...records[empId].time_slots];
        if (currentSlots.length > 1) {
            currentSlots.splice(index, 1);
            handleRecordChange(empId, 'time_slots', currentSlots);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                date,
                branch_id: selectedBranch?.id,
                attendance: Object.keys(records).map(empId => ({
                    user_id: empId,
                    attendance_legend_id: records[empId].legend_id,
                    is_half_day: records[empId].is_half_day,
                    time_slots: records[empId].time_slots.filter(slot => slot.in || slot.out)
                }))
            };
            await api.post('staff-attendance', payload);
            toast.success('Attendance saved successfully');
            setModifiedIds(new Set());
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete all attendance records for this date?')) return;
        setSaving(true);
        try {
            await api.delete('staff-attendance', { params: { date, branch_id: selectedBranch?.id } });
            toast.success('Attendance deleted successfully');
            fetchInitialData();
        } catch (err) {
            toast.error('Failed to delete attendance');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('Reset all unsaved changes for this date?')) {
            fetchInitialData();
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Attendance Records...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <input 
                            type="date" 
                            value={date}
                            min={selectedSession?.start_date}
                            max={[selectedSession?.end_date, new Date().toISOString().split('T')[0]].filter(Boolean).sort()[0]}
                            onChange={(e) => setDate(e.target.value)}
                            className="text-xl font-black text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer hover:text-blue-600 transition-all"
                        />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Selected Attendance Date</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <RefreshCcw size={16} /> Reset
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-xs hover:bg-rose-100 transition-all shadow-sm"
                    >
                        <Trash2 size={16} /> Clear Day
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Attendance
                    </button>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Employee Details</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Attendance Status</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Config</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Logs / Leave Bal.</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[300px]">Time Intervals (In/Out)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {employees.map((emp) => {
                                const record = records[emp.id] || {};
                                const selectedLegend = legends.find(l => l.id === parseInt(record.legend_id));
                                const isLeave = selectedLegend?.treat_as === 'absent' || (selectedLegend?.total_leaves > 0);
                                
                                return (
                                    <tr key={emp.id} className={`group transition-all ${modifiedIds.has(emp.id) ? 'bg-blue-50/10' : ''}`}>
                                        {/* Employee Profile */}
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                                                    {emp.avatar ? (
                                                        <img src={`/storage/${emp.avatar}`} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-bold text-slate-400">{emp.name?.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-tight">{emp.name}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{emp.employee?.employee_type || 'Staff'}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Attendance Status */}
                                        <td className="px-6 py-5">
                                            <div className="relative group/field min-w-[160px]">
                                                <select 
                                                    value={record.legend_id}
                                                    onChange={(e) => handleRecordChange(emp.id, 'legend_id', e.target.value)}
                                                    className={`
                                                        w-full pl-4 pr-10 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest outline-none border-2 transition-all appearance-none
                                                        ${isLeave ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}
                                                    `}
                                                >
                                                    {legends.map(l => (
                                                        <option key={l.id} value={l.id}>{l.name} ({l.short_name})</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                            </div>
                                        </td>

                                        {/* Half Day Config */}
                                        <td className="px-6 py-5">
                                            <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                                <div 
                                                    onClick={() => handleRecordChange(emp.id, 'is_half_day', !record.is_half_day)}
                                                    className={`w-10 h-6 border-2 rounded-full relative transition-all ${record.is_half_day ? 'bg-orange-500 border-orange-500' : 'bg-slate-100 border-slate-200'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 rounded-full transition-all bg-white ${record.is_half_day ? 'left-5 shadow-inner' : 'left-1'}`} />
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${record.is_half_day ? 'text-orange-600' : 'text-slate-400'}`}>Half Day</span>
                                            </label>
                                        </td>

                                        {/* Leave Balance */}
                                        <td className="px-6 py-5">
                                            <AnimatePresence mode="wait">
                                                {isLeave ? (
                                                    <motion.div 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100 text-amber-600"
                                                    >
                                                        <AlertCircle size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">
                                                            {selectedLegend?.total_leaves || 0} Leaves Avail.
                                                        </span>
                                                    </motion.div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">N/A</span>
                                                )}
                                            </AnimatePresence>
                                        </td>

                                        {/* Time Intervals */}
                                        <td className="px-6 py-5">
                                            <div className="space-y-3">
                                                {record.time_slots?.map((slot, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 group/slot">
                                                        <div className="flex items-center bg-slate-100/50 rounded-xl px-3 py-1.5 border border-slate-200 shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={12} className="text-slate-400" />
                                                                <input 
                                                                    type="time" 
                                                                    value={slot.in}
                                                                    onChange={(e) => handleTimeSlotChange(emp.id, idx, 'in', e.target.value)}
                                                                    className="bg-transparent border-none p-0 text-[11px] font-bold text-slate-700 focus:ring-0 w-20"
                                                                />
                                                            </div>
                                                            <ArrowRight size={12} className="mx-2 text-slate-300" />
                                                            <div className="flex items-center gap-2">
                                                                <input 
                                                                    type="time" 
                                                                    value={slot.out}
                                                                    onChange={(e) => handleTimeSlotChange(emp.id, idx, 'out', e.target.value)}
                                                                    className="bg-transparent border-none p-0 text-[11px] font-bold text-slate-700 focus:ring-0 w-20"
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        {record.time_slots.length > 1 && (
                                                            <button 
                                                                onClick={() => removeTimeSlot(emp.id, idx)}
                                                                className="p-1.5 text-slate-300 hover:text-rose-500 bg-white border border-slate-100 rounded-lg transition-all opacity-0 group-hover/slot:opacity-100"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                        
                                                        {idx === record.time_slots.length - 1 && (
                                                            <button 
                                                                onClick={() => addTimeSlot(emp.id)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Floating bar if unsaved changes */}
            <AnimatePresence>
                {modifiedIds.size > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
                    >
                        <div className="bg-slate-900 border border-slate-800 rounded-full p-4 shadow-2xl flex items-center justify-between text-white pl-8 overflow-hidden">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                                    <AlertCircle size={16} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">
                                    {modifiedIds.size} Pending Modifications
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleReset}
                                    className="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                                >
                                    Discard
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-8 py-2 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                                    Sync Data
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarkAttendance;
