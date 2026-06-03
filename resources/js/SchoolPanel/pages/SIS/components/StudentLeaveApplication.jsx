import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    User, 
    FileText, 
    Save, 
    Send, 
    RefreshCcw, 
    Loader2, 
    CheckCircle2, 
    BookOpen,
    LayoutGrid,
    Clock,
    Trash2
} from 'lucide-react';
import api from '../../../utils/api';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const StudentLeaveApplication = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();

    const [academicStructure, setAcademicStructure] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [students, setStudents] = useState([]);
    const [legends, setLegends] = useState([]);
    const [leaveList, setLeaveList] = useState([]);

    const [formData, setFormData] = useState({
        student_id: '',
        attendance_legend_id: '',
        from_date: new Date().toISOString().split('T')[0],
        upto_date: new Date().toISOString().split('T')[0],
        is_half_day: false,
        reason: '',
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (selectedSession) {
            fetchStructure();
            fetchLegends();
            fetchLeaves();
        }
    }, [selectedSession, selectedBranch]);

    useEffect(() => {
        if (selectedSectionId) fetchStudents(selectedSectionId);
    }, [selectedSectionId]);

    const fetchStructure = async () => {
        try {
            const res = await api.get('academic-structure', {
                params: { session_id: selectedSession?.id }
            });
            setAcademicStructure(res.data);
        } catch (err) { console.error('Structure fail'); }
    };

    const fetchLegends = async () => {
        try {
            const res = await api.get('student-legends', {
                headers: { 'session-id': selectedSession?.id }
            });
            setLegends(res.data);
        } catch (err) { console.error('Legends fail'); }
    };

    const fetchStudents = async (sectionId) => {
        try {
            const res = await api.get('students', {
                params: { section_id: sectionId },
                headers: { 'branch-id': selectedBranch?.id }
            });
            setStudents(res.data);
        } catch (err) { console.error('Students fail'); }
    };

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await api.get('student-leaves', {
                headers: { 'branch-id': selectedBranch?.id }
            });
            setLeaveList(res.data);
        } catch (err) { toast.error('Failed to load leave history'); }
        finally { setLoading(false); }
    };

    const handleSave = async (sendSms = false) => {
        if (!formData.student_id || !formData.attendance_legend_id) {
            toast.error('Please select student and leave type');
            return;
        }

        setSaving(true);
        try {
            await api.post('student-leaves', { ...formData, send_sms: sendSms }, {
                headers: { 
                    'branch-id': selectedBranch?.id, 
                    'session-id': selectedSession?.id 
                }
            });
            toast.success('Leave application saved');
            handleReset();
            fetchLeaves();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this leave application?')) return;
        try {
            await api.delete(`student-leaves/${id}`);
            toast.success('Deleted');
            fetchLeaves();
        } catch (err) { toast.error('Delete failed'); }
    };

    const handleReset = () => {
        setFormData({
            student_id: '',
            attendance_legend_id: '',
            from_date: new Date().toISOString().split('T')[0],
            upto_date: new Date().toISOString().split('T')[0],
            is_half_day: false,
            reason: '',
        });
        setSelectedClassId('');
        setSelectedSectionId('');
    };

    const activeClass = academicStructure.find(c => c.id === parseInt(selectedClassId));

    return (
        <div className="flex flex-col lg:flex-row gap-8 -m-10 min-h-[calc(100vh-180px)]">
            {/* Left: Input Form */}
            <div className="w-full lg:w-[450px] bg-slate-50 border-r border-slate-100 p-10 space-y-8 overflow-y-auto no-scrollbar">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-100">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 font-outfit">Leave Application</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Student Registry</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Class & Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class</label>
                            <select 
                                value={selectedClassId}
                                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSectionId(''); }}
                                className="bg-white border-2 border-slate-200 p-3.5 rounded-2xl font-bold text-slate-700 text-sm focus:border-blue-500 outline-none transition-all shadow-sm"
                            >
                                <option value="">Select</option>
                                {academicStructure.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                            <select 
                                disabled={!selectedClassId}
                                value={selectedSectionId}
                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                className="bg-white border-2 border-slate-200 p-3.5 rounded-2xl font-bold text-slate-700 text-sm focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-50"
                            >
                                <option value="">Select</option>
                                {activeClass?.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Student Select */}
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Name</label>
                        <select 
                            disabled={!selectedSectionId}
                            value={formData.student_id}
                            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                            className="bg-white border-2 border-slate-200 p-3.5 rounded-2xl font-bold text-slate-700 text-sm focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-50"
                        >
                            <option value="">Select Student</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.enrollment_no})</option>)}
                        </select>
                    </div>

                    {/* Leave Type */}
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Type (Legend)</label>
                        <select 
                            value={formData.attendance_legend_id}
                            onChange={(e) => setFormData({ ...formData, attendance_legend_id: e.target.value })}
                            className="bg-white border-2 border-slate-200 p-3.5 rounded-2xl font-bold text-slate-700 text-sm focus:border-blue-500 outline-none transition-all shadow-sm"
                        >
                            <option value="">Choose Type</option>
                            {legends.map(l => <option key={l.id} value={l.id}>{l.name} ({l.short_name})</option>)}
                        </select>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From Date</label>
                            <input 
                                type="date"
                                value={formData.from_date}
                                onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                                className="bg-white border-2 border-slate-200 p-3.5 rounded-2xl font-bold text-slate-700 text-sm focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upto Date</label>
                            <input 
                                type="date"
                                value={formData.upto_date}
                                onChange={(e) => setFormData({ ...formData, upto_date: e.target.value })}
                                className="bg-white border-2 border-slate-200 p-3.5 rounded-2xl font-bold text-slate-700 text-sm focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Half Day & Reason */}
                    <div className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <input 
                            type="checkbox" 
                            id="half_day"
                            checked={formData.is_half_day}
                            onChange={(e) => setFormData({ ...formData, is_half_day: e.target.checked })}
                            className="w-5 h-5 rounded-lg border-2 border-slate-200 accent-blue-600 cursor-pointer"
                        />
                        <label htmlFor="half_day" className="text-xs font-black text-slate-600 uppercase tracking-widest cursor-pointer select-none">Mark as Half Day</label>
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Leave</label>
                        <textarea 
                            rows={3}
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="bg-white border-2 border-slate-200 p-4 rounded-[1.5rem] font-bold text-slate-700 text-sm focus:border-blue-500 outline-none transition-all shadow-sm resize-none"
                            placeholder="Type reason here..."
                        />
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <button 
                        onClick={() => handleSave(true)}
                        disabled={saving}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
                    >
                        <Send size={18} /> Save & Send SMS
                    </button>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Leave
                        </button>
                        <button onClick={handleReset} className="w-16 bg-white border-2 border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
                            <RefreshCcw size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: History & List */}
            <div className="flex-1 p-10 overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 font-outfit tracking-tight">Recent Leave Applications</h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Activity Log</p>
                    </div>
                    <div className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">
                        {leaveList.length} Total Applied
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
                        <Loader2 size={40} className="animate-spin text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synching Records...</span>
                    </div>
                ) : leaveList.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {leaveList.map(leave => (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={leave.id}
                                className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group relative overflow-hidden"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                                            {leave.student?.photo ? (
                                                <img src={`/storage/${leave.student.photo}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="text-slate-300" size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 tracking-tight">{leave.student?.first_name} {leave.student?.last_name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{leave.legend?.name}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-400">ADM {leave.student?.enrollment_no}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(leave.id)}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">From</span>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                            <Calendar size={12} className="text-blue-500" /> {leave.from_date}
                                        </div>
                                    </div>
                                    <div className="space-y-1 border-l border-slate-100 pl-4">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Until</span>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                            <Calendar size={12} className="text-blue-500" /> {leave.upto_date}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} className="text-slate-400" />
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${leave.is_half_day ? 'text-orange-600' : 'text-indigo-600'}`}>
                                            {leave.is_half_day ? 'Half Day Application' : 'Full Day Duration'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Approved</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                            <LayoutGrid size={48} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 font-outfit">No Leave History</h3>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium">Use the form on the left to register a new student leave application.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentLeaveApplication;
