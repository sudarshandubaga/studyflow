import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Users,
    CheckCircle2,
    Save,
    Send,
    Trash2,
    RefreshCcw,
    Loader2,
    AlertCircle,
    Check,
    X,
    LayoutGrid,
    Plus
} from 'lucide-react';
import api from '../../../utils/api';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const StudentMarkAttendance = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();

    const [academicStructure, setAcademicStructure] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [students, setStudents] = useState([]);
    const [legends, setLegends] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({}); // {student_id: legend_id}

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch Classes/Sections
    useEffect(() => {
        if (selectedSession) fetchStructure();
    }, [selectedSession]);

    const fetchStructure = async () => {
        try {
            const res = await api.get('academic-structure', {
                params: { session_id: selectedSession?.id }
            });
            setAcademicStructure(res.data);
        } catch (err) {
            toast.error('Failed to load academic structure');
        }
    };

    const fetchAttendanceBatch = async () => {
        if (!selectedSectionId || !selectedDate) return;
        setLoading(true);
        try {
            const res = await api.get('attendance-batch', {
                params: { section_id: selectedSectionId, date: selectedDate },
                headers: { 'branch-id': selectedBranch?.id, 'session-id': selectedSession?.id }
            });
            setStudents(res.data.students);
            setLegends(res.data.legends);

            // Map existing attendance
            const initialMap = {};
            res.data.students.forEach(s => {
                const existing = res.data.attendance[s.id];
                initialMap[s.id] = existing ? existing.attendance_legend_id : null;
            });
            setAttendanceMap(initialMap);
        } catch (err) {
            toast.error('Failed to load attendance records');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = (studentId, legendId) => {
        setAttendanceMap(prev => ({ ...prev, [studentId]: legendId }));
    };

    const handleSave = async (sendSms = false) => {
        const payload = Object.entries(attendanceMap)
            .filter(([_, lid]) => lid !== null)
            .map(([sid, lid]) => ({ student_id: sid, legend_id: lid }));

        if (payload.length === 0) {
            toast.error('Please mark attendance for at least one student');
            return;
        }

        setSaving(true);
        try {
            await api.post('attendance-bulk', {
                date: selectedDate,
                attendance: payload,
                send_sms: sendSms
            }, {
                headers: { 'branch-id': selectedBranch?.id, 'session-id': selectedSession?.id }
            });
            toast.success(sendSms ? 'Attendance saved & SMS notifications triggered' : 'Attendance saved successfully');
        } catch (err) {
            toast.error('Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete attendance for this section and date?')) return;

        try {
            await api.delete('attendance-bulk', {
                params: { section_id: selectedSectionId, date: selectedDate },
                headers: { 'branch-id': selectedBranch?.id }
            });
            toast.success('Attendance records deleted');
            fetchAttendanceBatch();
        } catch (err) {
            toast.error('Deletion failed');
        }
    };

    const handleReset = () => {
        setAttendanceMap(prev => {
            const reset = {};
            Object.keys(prev).forEach(k => reset[k] = null);
            return reset;
        });
    };

    const activeClass = academicStructure.find(c => c.id === parseInt(selectedClassId));

    return (
        <div className="flex flex-col -m-10 min-h-[calc(100vh-200px)]">
            {/* Filter Bar */}
            <div className="bg-slate-50 border-b border-slate-100 p-8 rounded-t-[3rem]">
                <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Class</label>
                            <select
                                value={selectedClassId}
                                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSectionId(''); }}
                                className="bg-white border-2 border-slate-100 p-3.5 rounded-2xl font-bold text-slate-700 text-sm focus:border-blue-500 outline-none transition-all shadow-sm"
                            >
                                <option value="">Choose Class</option>
                                {academicStructure.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                            <select
                                disabled={!selectedClassId}
                                value={selectedSectionId}
                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                className="bg-white border-2 border-slate-100 p-3.5 rounded-2xl font-bold text-slate-700 text-sm focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-50"
                            >
                                <option value="">Choose Section</option>
                                {activeClass?.sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attendance Date</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full bg-white border-2 border-slate-100 p-3.5 pl-12 rounded-2xl font-bold text-slate-700 text-sm focus:border-blue-500 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={fetchAttendanceBatch}
                        disabled={!selectedSectionId || loading}
                        className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:shadow-none"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                        Find Students
                    </button>
                </div>
            </div>

            {/* Attendance List Area */}
            <div className="flex-1 p-10">
                <AnimatePresence mode="wait">
                    {students.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="flex justify-between items-center bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marking For</span>
                                        <span className="text-lg font-black text-slate-800 font-outfit">Section {activeClass?.sections.find(s => s.id == selectedSectionId)?.name}</span>
                                    </div>
                                    <div className="h-10 w-[1px] bg-slate-200" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Students</span>
                                        <span className="text-lg font-black text-blue-600 font-outfit">{students.length} Records</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button onClick={handleReset} className="p-3 text-slate-400 hover:bg-white hover:text-slate-600 rounded-xl transition-all" title="Reset Selections">
                                        <RefreshCcw size={20} />
                                    </button>
                                    <button onClick={handleDelete} className="p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all" title="Delete All for Date">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll / ID</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Information</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Attendance Legend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {students.map((student) => (
                                            <tr key={student.id} className="group hover:bg-slate-50/30 transition-colors">
                                                <td className="px-10 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-700">ROLL {student.roll_no || '--'}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">ID: {student.enrollment_no}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-white shadow-sm flex items-center justify-center font-black text-slate-400 text-sm overflow-hidden">
                                                            {student.photo ? <img src={`/storage/${student.photo}`} className="w-full h-full object-cover" /> : student.first_name?.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700 capitalize">{student.first_name} {student.last_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {legends.map(legend => (
                                                            <button
                                                                key={legend.id}
                                                                onClick={() => handleUpdateStatus(student.id, legend.id)}
                                                                className={`
                                                                    min-w-[44px] h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all
                                                                    ${attendanceMap[student.id] === legend.id
                                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-105'
                                                                        : 'bg-white border-slate-100 text-slate-400 hover:border-blue-100 hover:text-blue-500'
                                                                    }
                                                                `}
                                                                title={legend.name}
                                                            >
                                                                {legend.short_name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Actions */}
                            <div className="fixed bottom-10 right-10 flex items-center gap-4 z-50">
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={saving}
                                    className="bg-slate-900 border-4 border-white text-white pl-8 pr-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all group flex items-center gap-3 relative overflow-hidden"
                                >
                                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Save & Send SMS
                                    <div className="absolute top-0 right-0 w-8 h-full bg-blue-600 flex items-center justify-center">
                                        <Plus size={14} />
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={saving}
                                    className="bg-blue-600 border-4 border-white text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-3"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    Commit Presence
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-32 text-center space-y-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                                <LayoutGrid size={48} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 font-outfit tracking-tight">Ready to Mark Attendance?</h3>
                                <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium">Select a class, section, and date above to begin your morning registry.</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StudentMarkAttendance;
