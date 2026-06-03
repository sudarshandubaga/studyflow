import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    ArrowRightLeft, 
    ChevronRight, 
    Save, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    ArrowUpCircle,
    RotateCcw,
    UserCheck,
    LayoutGrid,
    Check
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';

const StudentPromotion = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();

    // Data states
    const [academicStructure, setAcademicStructure] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Filter states
    const [sourceClassId, setSourceClassId] = useState('');
    const [sourceSectionId, setSourceSectionId] = useState('');
    const [mode, setMode] = useState('Promotion'); // 'Promotion' or 'Change Class'
    const [targetClassId, setTargetClassId] = useState('');
    const [bulkTargetSectionId, setBulkTargetSectionId] = useState('');

    // Selection states
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [studentPromotions, setStudentPromotions] = useState({}); // { studentId: targetSectionId }

    useEffect(() => {
        if (selectedBranch?.id && selectedSession?.id) {
            fetchStructure();
        }
    }, [selectedBranch, selectedSession]);

    const fetchStructure = async () => {
        setLoading(true);
        try {
            const res = await api.get('academic-structure', {
                params: { session_id: selectedSession?.id },
                headers: { 'branch-id': selectedBranch?.id }
            });
            // Sort structure by position immediately
            const sortedData = res.data.sort((a, b) => (parseInt(a.position) || 0) - (parseInt(b.position) || 0));
            setAcademicStructure(sortedData);
        } catch (err) {
            toast.error('Failed to load academic structure');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async (sectionId) => {
        if (!sectionId) return;
        setLoading(true);
        try {
            const res = await api.get('students', {
                params: { section_id: sectionId },
                headers: { 'branch-id': selectedBranch?.id }
            });
            setStudents(res.data);
            setSelectedStudentIds([]);
            setStudentPromotions({});
        } catch (err) {
            toast.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sourceSectionId) fetchStudents(sourceSectionId);
    }, [sourceSectionId]);

    // Handle Auto-select target class on mode change or source class change
    useEffect(() => {
        if (mode === 'Promotion' && sourceClassId && academicStructure.length > 0) {
            const currentClass = academicStructure.find(c => c.id === parseInt(sourceClassId));
            if (currentClass) {
                const nextClass = academicStructure
                    .filter(c => (parseInt(c.position) || 0) > (parseInt(currentClass.position) || 0))
                    .sort((a, b) => (parseInt(a.position) || 0) - (parseInt(b.position) || 0))[0];
                
                if (nextClass) {
                    setTargetClassId(nextClass.id.toString());
                } else {
                    setTargetClassId('');
                }
            }
        }
    }, [mode, sourceClassId, academicStructure]);

    const sourceClass = academicStructure.find(c => c.id === parseInt(sourceClassId));
    const targetClass = academicStructure.find(c => c.id === parseInt(targetClassId));

    // Initialize/Update student promotions when target class/section changes
    useEffect(() => {
        if (targetClass?.sections?.length > 0) {
            const defaultSectionId = targetClass.sections[0].id;
            setBulkTargetSectionId(defaultSectionId.toString());
            
            const newPromotions = { ...studentPromotions };
            students.forEach(s => {
                if (!newPromotions[s.id]) {
                    newPromotions[s.id] = defaultSectionId.toString();
                }
            });
            setStudentPromotions(newPromotions);
        }
    }, [targetClass, students]);

    const handleBulkSectionApply = (sectionId) => {
        setBulkTargetSectionId(sectionId);
        const newPromos = { ...studentPromotions };
        selectedStudentIds.forEach(id => {
            newPromos[id] = sectionId;
        });
        setStudentPromotions(newPromos);
    };

    const toggleStudent = (id) => {
        setSelectedStudentIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        setSelectedStudentIds(selectedStudentIds.length === students.length ? [] : students.map(s => s.id));
    };

    const handleSave = async () => {
        if (selectedStudentIds.length === 0) {
            return toast.error('Select at least one student to promote');
        }
        if (!targetClassId) {
            return toast.error('Select a target class');
        }

        const promotions = selectedStudentIds.map(id => ({
            student_id: id,
            target_section_id: studentPromotions[id]
        }));

        setSaving(true);
        try {
            await api.post('students/promote', { promotions }, {
                headers: { 'branch-id': selectedBranch?.id }
            });
            toast.success(`${promotions.length} students ${mode === 'Promotion' ? 'promoted' : 'classes changed'} successfully!`);
            fetchStudents(sourceSectionId);
        } catch (err) {
            toast.error('Failed to save promotion requirements');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setSourceClassId('');
        setSourceSectionId('');
        setTargetClassId('');
        setStudents([]);
        setSelectedStudentIds([]);
        setStudentPromotions({});
        setBulkTargetSectionId('');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <ArrowUpCircle size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight font-outfit">Student Promotion & Transfer</h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Academic Advancement & Section Reassignment</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
                        {/* 1. Source Filters */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">1</span>
                                Source Academy
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Class</label>
                                    <select 
                                        value={sourceClassId}
                                        onChange={(e) => { setSourceClassId(e.target.value); setSourceSectionId(''); }}
                                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 text-sm"
                                    >
                                        <option value="">Select Class...</option>
                                        {academicStructure.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Section</label>
                                    <select 
                                        disabled={!sourceClassId}
                                        value={sourceSectionId}
                                        onChange={(e) => setSourceSectionId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 text-sm disabled:opacity-50"
                                    >
                                        <option value="">Select Section...</option>
                                        {sourceClass?.sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Mode Toggle */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">2</span>
                                Action Mode
                            </h3>
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-2">
                                {['Promotion', 'Change Class'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Target Filters */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">3</span>
                                Destination
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Class</label>
                                    <select 
                                        value={targetClassId}
                                        onChange={(e) => setTargetClassId(e.target.value)}
                                        className="w-full bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-bold text-emerald-900 text-sm"
                                    >
                                        <option value="">Select Target...</option>
                                        {academicStructure.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {mode === 'Promotion' && sourceClassId && !targetClassId && (
                                        <p className="text-[10px] font-bold text-rose-400 mt-2 px-1 flex items-center gap-1.5">
                                            <AlertCircle size={10} /> No higher class found in sequence.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        <div className="pt-4 border-t border-slate-50 space-y-4">
                            <div className="bg-slate-900 rounded-[2rem] p-6 text-white overflow-hidden relative group">
                                <LayoutGrid size={40} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Bulk Section Assingment</h4>
                                <div className="space-y-3">
                                    <select 
                                        disabled={!targetClassId || selectedStudentIds.length === 0}
                                        value={bulkTargetSectionId}
                                        onChange={(e) => handleBulkSectionApply(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 p-3 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-20 transition-all cursor-pointer"
                                    >
                                        <option value="" className="text-slate-800">Assign Section to All...</option>
                                        {targetClass?.sections.map(s => <option key={s.id} value={s.id} className="text-slate-800">Section {s.name}</option>)}
                                    </select>
                                    <p className="text-[9px] font-bold text-white/40 leading-relaxed italic">
                                        This will update the target section for all <span className="text-white">{selectedStudentIds.length}</span> selected students at once.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Student List & Selection */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
                        {/* List Header */}
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 font-outfit tracking-tight">Student Roster</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {students.length > 0 ? `${students.length} students found` : 'Awaiting filters'}
                                </p>
                            </div>
                            {students.length > 0 && (
                                <button 
                                    onClick={toggleAll}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm text-xs font-black text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all uppercase tracking-widest"
                                >
                                    {selectedStudentIds.length === students.length ? <RotateCcw size={14} /> : <UserCheck size={14} />}
                                    {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>

                        {/* Scrollable Area */}
                        <div className="flex-1 overflow-y-auto max-h-[600px]">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                                    <p className="text-slate-400 font-bold text-sm">Accessing student registry...</p>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 py-32">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                                        <Users size={40} />
                                    </div>
                                    <p className="font-bold text-slate-400 text-sm max-w-[240px]">Select a Class and Section from the left sidebar to load students.</p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-3">
                                    {students.map(student => (
                                        <div 
                                            key={student.id} 
                                            className={`group p-5 rounded-3xl border-2 transition-all duration-300 flex items-center gap-6 ${selectedStudentIds.includes(student.id) ? 'bg-emerald-50 border-emerald-500 shadow-md translate-x-1' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                        >
                                            {/* Checkbox */}
                                            <button 
                                                onClick={() => toggleStudent(student.id)}
                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedStudentIds.includes(student.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-transparent hover:border-emerald-300'}`}
                                            >
                                                <Check size={14} strokeWidth={4} />
                                            </button>

                                            {/* Info */}
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shadow-sm border border-white flex-shrink-0">
                                                    {student.photo ? (
                                                        <img src={`/storage/${student.photo}`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-black text-slate-400 text-sm">{student.first_name.charAt(0)}</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 text-sm tracking-tight">{student.first_name} {student.last_name}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adm ID: {student.enrollment_no}</p>
                                                </div>
                                            </div>

                                            {/* Target Section Selector */}
                                            <div className="flex flex-col gap-1.5 min-w-[150px]">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign to Section</label>
                                                <select 
                                                    disabled={!selectedStudentIds.includes(student.id) || !targetClassId}
                                                    value={studentPromotions[student.id] || ''}
                                                    onChange={(e) => setStudentPromotions({ ...studentPromotions, [student.id]: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-30 transition-all"
                                                >
                                                    <option value="">Select Section...</option>
                                                    {targetClass?.sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions Footer */}
                        <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-between">
                            <button 
                                onClick={handleReset}
                                className="px-8 py-3.5 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2"
                            >
                                <RotateCcw size={16} /> Reset Form
                            </button>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Queue Status</p>
                                    <p className="text-sm font-black text-emerald-600">{selectedStudentIds.length} Targeted for {mode}</p>
                                </div>
                                <button 
                                    onClick={handleSave}
                                    disabled={saving || selectedStudentIds.length === 0}
                                    className="bg-emerald-600 text-white rounded-[1.5rem] px-12 py-4 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Commit {mode}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentPromotion;
