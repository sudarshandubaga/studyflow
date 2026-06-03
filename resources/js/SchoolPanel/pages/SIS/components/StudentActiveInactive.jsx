import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Search, 
    UserMinus, 
    UserPlus, 
    Loader2, 
    Check, 
    RotateCcw, 
    AlertCircle,
    LayoutGrid,
    Filter,
    ShieldCheck,
    ShieldAlert
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';

const StudentActiveInactive = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();

    // UI States
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'inactive'
    const [academicStructure, setAcademicStructure] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Filter States
    const [classId, setClassId] = useState('');
    const [sectionId, setSectionId] = useState('');

    // Selection State
    const [selectedIds, setSelectedIds] = useState([]);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (selectedBranch?.id && selectedSession?.id) {
            fetchStructure();
        }
    }, [selectedBranch, selectedSession]);

    const fetchStructure = async () => {
        try {
            const res = await api.get('academic-structure', {
                params: { session_id: selectedSession?.id },
                headers: { 'branch-id': selectedBranch?.id }
            });
            setAcademicStructure(res.data);
        } catch (err) {
            toast.error('Failed to load academic structure');
        }
    };

    const fetchStudents = async () => {
        if (!sectionId) return;
        setLoading(true);
        try {
            const res = await api.get('students', {
                params: { 
                    section_id: sectionId,
                    is_active: activeTab === 'active' ? 1 : 0
                },
                headers: { 'branch-id': selectedBranch?.id }
            });
            setStudents(res.data);
            setSelectedIds([]);
        } catch (err) {
            toast.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [sectionId, activeTab]);

    const toggleSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        setSelectedIds(selectedIds.length === students.length ? [] : students.map(s => s.id));
    };

    const handleConfirmRequest = () => {
        if (selectedIds.length === 0) return toast.error('Please select students first');
        setShowConfirm(true);
    };

    const handleStatusUpdate = async () => {
        const newStatus = activeTab === 'active' ? 0 : 1;
        
        setSubmitting(true);
        try {
            await api.post('students/bulk-status-update', {
                ids: selectedIds,
                is_active: newStatus
            }, {
                headers: { 'branch-id': selectedBranch?.id }
            });
            
            toast.success(`${selectedIds.length} students ${newStatus ? 'activated' : 'deactivated'} successfully!`);
            fetchStudents();
            setShowConfirm(false);
        } catch (err) {
            toast.error('Failed to update status');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedClass = academicStructure.find(c => c.id === parseInt(classId));

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500 scale-110 ${activeTab === 'active' ? 'bg-gradient-to-br from-rose-500 to-orange-600 shadow-rose-200 rotate-0' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200 rotate-12'}`}>
                        {activeTab === 'active' ? <UserMinus size={32} /> : <UserPlus size={32} />}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight font-outfit">Bulk Status Manager</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${activeTab === 'active' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {activeTab === 'active' ? 'Deactivation Suite' : 'Activation Engine'}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Student Controls</p>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 px-4 border-r border-slate-100">
                        <Filter size={16} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Logic</span>
                    </div>
                    
                    <select 
                        value={classId}
                        onChange={(e) => { setClassId(e.target.value); setSectionId(''); }}
                        className="bg-slate-50 border-none px-6 py-3 rounded-2xl text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer min-w-[160px]"
                    >
                        <option value="">Choose Class...</option>
                        {academicStructure.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <select 
                        disabled={!classId}
                        value={sectionId}
                        onChange={(e) => setSectionId(e.target.value)}
                        className="bg-slate-50 border-none px-6 py-3 rounded-2xl text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer min-w-[160px] disabled:opacity-30"
                    >
                        <option value="">All Sections...</option>
                        {selectedClass?.sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center">
                <div className="bg-slate-100/50 p-2 rounded-[2.5rem] flex items-center gap-2 shadow-inner border border-slate-100/50">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex items-center gap-3 px-10 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'active' ? 'bg-white text-rose-600 shadow-xl shadow-slate-200 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ShieldAlert size={16} />
                        Active Students
                    </button>
                    <button
                        onClick={() => setActiveTab('inactive')}
                        className={`flex items-center gap-3 px-10 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'inactive' ? 'bg-white text-emerald-600 shadow-xl shadow-slate-200 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ShieldCheck size={16} />
                        Inactive Student List
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative">
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                    {/* List Header */}
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 font-outfit">
                                {activeTab === 'active' ? 'Registry Maintenance' : 'Archival Recovery'}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {students.length} student records identified in this segment
                            </p>
                        </div>
                        {students.length > 0 && (
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={toggleAll}
                                    className="px-6 py-3 rounded-2xl bg-slate-50 text-[10px] font-black text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest flex items-center gap-2"
                                >
                                    <RotateCcw size={14} />
                                    {selectedIds.length === students.length ? 'Clear All' : 'Select Segment'}
                                </button>
                                <button 
                                    disabled={selectedIds.length === 0 || submitting}
                                    onClick={handleConfirmRequest}
                                    className={`px-10 py-3.5 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest shadow-lg flex items-center gap-3 disabled:opacity-20 ${activeTab === 'active' ? 'bg-rose-600 text-white shadow-rose-200 hover:bg-rose-700' : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'}`}
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : (activeTab === 'active' ? <UserMinus size={16} /> : <UserPlus size={16} />)}
                                    {activeTab === 'active' ? `Deactivate ${selectedIds.length} Targeted` : `Enable ${selectedIds.length} Selected`}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Student Grid */}
                    <div className="flex-1 p-10 overflow-y-auto max-h-[600px] no-scrollbar">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 size={48} className="animate-spin text-blue-500" />
                                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Querying Academic Archives...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-32 opacity-40">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                                    <Users size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-black text-slate-800">No Data Points found</h4>
                                    <p className="text-xs font-bold text-slate-400 max-w-[280px] leading-relaxed uppercase tracking-widest">Select a valid segment using class & section filters above.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {students.map((student) => (
                                    <motion.div
                                        key={student.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`group relative p-6 rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer ${selectedIds.includes(student.id) ? (activeTab === 'active' ? 'border-rose-500 bg-rose-50/30' : 'border-emerald-500 bg-emerald-50/30') : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/30'}`}
                                        onClick={() => toggleSelection(student.id)}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-lg border-2 border-white bg-slate-100 flex-shrink-0">
                                                    {student.photo ? (
                                                        <img src={`/storage/${student.photo}`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-xl">{student.first_name?.[0]}</div>
                                                    )}
                                                </div>
                                                <div className={`absolute -right-1 -bottom-1 w-6 h-6 rounded-xl border-4 border-white flex items-center justify-center transition-all ${selectedIds.includes(student.id) ? (activeTab === 'active' ? 'bg-rose-600' : 'bg-emerald-600') : 'bg-slate-200 opacity-0 group-hover:opacity-100'}`}>
                                                    <Check size={10} className="text-white" strokeWidth={4} />
                                                </div>
                                            </div>
                                            <div className="min-w-0 pr-4">
                                                <h4 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{student.first_name} {student.last_name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{student.enrollment_no}</span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sec {student.section?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Status Badge */}
                                        <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${activeTab === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {activeTab === 'active' ? 'Live' : 'Inactive'}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom Floating Stats */}
                    {students.length > 0 && (
                        <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-center">
                            <div className="flex items-center gap-8">
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Available</p>
                                    <p className="text-lg font-black text-slate-800">{students.length}</p>
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Segmented</p>
                                    <p className={`text-lg font-black ${activeTab === 'active' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {selectedIds.length}
                                    </p>
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Residual</p>
                                    <p className="text-lg font-black text-slate-400">{students.length - selectedIds.length}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-slate-900">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setShowConfirm(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-10 shadow-2xl relative z-10 max-w-md w-full border border-slate-100"
                        >
                            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 ${activeTab === 'active' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {activeTab === 'active' ? <ShieldAlert size={40} /> : <ShieldCheck size={40} />}
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 text-center font-outfit uppercase tracking-tight">Confirm Status Change</h3>
                            <p className="text-slate-400 text-center font-bold text-[10px] mt-4 leading-relaxed uppercase tracking-[0.2em] px-4">
                                You are about to <span className={activeTab === 'active' ? 'text-rose-600' : 'text-emerald-600'}>
                                    {activeTab === 'active' ? 'DEACTIVATE' : 'ACTIVATE'}
                                </span> <span className="text-slate-900 font-extrabold">{selectedIds.length}</span> SELECTED RECORDS.
                            </p>
                            
                            <div className="bg-slate-50 rounded-2xl p-5 mt-8 border border-slate-100 italic">
                                <p className="text-[10px] font-bold text-slate-400 text-center leading-loose">
                                    "This operation will immediately modify student access privileges and update academic reporting visibility across all modules."
                                </p>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button 
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-4 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleStatusUpdate}
                                    disabled={submitting}
                                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all flex items-center justify-center gap-3 ${activeTab === 'active' ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'}`}
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentActiveInactive;
