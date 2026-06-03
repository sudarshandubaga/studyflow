import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Plus, 
    Search, 
    ChevronRight, 
    BookOpen, 
    Loader2, 
    Filter,
    UserPlus,
    LayoutGrid,
    CheckCircle2,
    Edit3,
    Trash2,
    MoreVertical,
    Check
} from 'lucide-react';
import api from '../../../utils/api';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import StudentAdmissionForm from './StudentAdmissionForm';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const StudentAdmissionManager = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();
    const [academicStructure, setAcademicStructure] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSection, setSelectedSection] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editStudentId, setEditStudentId] = useState(null);
    const [stats, setStats] = useState({ total: 0, male: 0, female: 0 });
    
    // Selection state
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        if (selectedSession) {
            fetchStructure();
        }
    }, [selectedBranch, selectedSession]);

    useEffect(() => {
        if (selectedSection) {
            fetchStudents(selectedSection.id);
            setSelectedIds([]); // Reset selection on section change
        }
    }, [selectedSection]);

    const fetchStructure = async () => {
        setLoading(true);
        try {
            const res = await api.get('academic-structure', {
                params: { session_id: selectedSession?.id },
                headers: { 'branch-id': selectedBranch?.id }
            });
            setAcademicStructure(res.data);
        } catch (err) {
            console.error('Failed to fetch academic structure');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async (sectionId) => {
        setLoading(true);
        try {
            const res = await api.get('students', {
                params: { section_id: sectionId },
                headers: { 'branch-id': selectedBranch?.id }
            });
            setStudents(res.data);
            
            const m = res.data.filter(s => s.gender === 'Male').length;
            const f = res.data.filter(s => s.gender === 'Female').length;
            setStats({ total: res.data.length, male: m, female: f });
        } catch (err) {
            console.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const handleSingleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student record?')) return;
        
        try {
            await api.delete(`students/${id}`, { headers: { 'branch-id': selectedBranch?.id } });
            toast.success('Student record deleted');
            fetchStudents(selectedSection.id);
        } catch (err) {
            toast.error('Failed to delete student');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} students?`)) return;

        try {
            await api.post('students/bulk-delete', { ids: selectedIds }, { headers: { 'branch-id': selectedBranch?.id } });
            toast.success('Selected records deleted');
            setSelectedIds([]);
            fetchStudents(selectedSection.id);
        } catch (err) {
            toast.error('Bulk deletion failed');
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        setSelectedIds(selectedIds.length === students.length ? [] : students.map(s => s.id));
    };

    const activeClass = academicStructure.find(c => c.id === parseInt(selectedClassId));

    if (loading && academicStructure.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="flex flex-col -m-10 min-h-[calc(100vh-200px)]">
            {/* Top Selector Bar: Dropdown Selection */}
            <div className="bg-slate-50 border-b border-slate-100 p-8 rounded-t-[3rem]">
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                    <div className="flex-shrink-0 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <LayoutGrid size={20} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Student Filters</h3>
                            <p className="text-xs font-bold text-slate-700 font-outfit">Filter by Academy</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-1 flex-col md:flex-row items-center gap-4 max-w-4xl">
                        <div className="w-full md:flex-1 space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Select Class</label>
                            <select 
                                value={selectedClassId}
                                onChange={(e) => {
                                    setSelectedClassId(e.target.value);
                                    setSelectedSection(null);
                                    setShowForm(false);
                                }}
                                className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-bold text-slate-700 text-sm shadow-sm hover:border-blue-200"
                            >
                                <option value="">Choose Class</option>
                                {academicStructure.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full md:flex-1 space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Select Section</label>
                            <select 
                                disabled={!selectedClassId}
                                value={selectedSection?.id || ''}
                                onChange={(e) => {
                                    const section = activeClass?.sections.find(s => s.id === parseInt(e.target.value));
                                    setSelectedSection(section);
                                    setShowForm(false);
                                }}
                                className={`w-full bg-white border border-slate-200 p-3.5 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-bold text-slate-700 text-sm shadow-sm 
                                    ${!selectedClassId ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-200'}`}
                            >
                                <option value="">Choose Section</option>
                                {activeClass?.sections.map(s => (
                                    <option key={s.id} value={s.id}>Section {s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-10 bg-white">
                <AnimatePresence mode="wait">
                    {!selectedSection ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center space-y-6"
                        >
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                                <LayoutGrid size={48} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 font-outfit">Select a Section to Begin</h3>
                                <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium">Please choose a class and section from the left sidebar to manage students.</p>
                            </div>
                        </motion.div>
                    ) : showForm ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <StudentAdmissionForm 
                                section={selectedSection} 
                                studentId={editStudentId}
                                onCancel={() => { setShowForm(false); setEditStudentId(null); }} 
                                onSuccess={() => {
                                    setShowForm(false);
                                    setEditStudentId(null);
                                    fetchStudents(selectedSection.id);
                                }}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            {/* Header & Stats */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 font-outfit tracking-tight flex items-center gap-3">
                                        Students in Section {selectedSection.name}
                                        <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{students.length} Total</span>
                                    </h2>
                                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{selectedSection.edu_class?.name || 'Class Record'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedIds.length > 0 && (
                                        <button 
                                            onClick={handleBulkDelete}
                                            className="bg-rose-50 text-rose-600 px-5 py-3 rounded-2xl text-xs font-black hover:bg-rose-100 transition-all flex items-center gap-2 border border-rose-100 mr-2"
                                        >
                                            <Trash2 size={16} />
                                            DELETE SELECTED ({selectedIds.length})
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => { setEditStudentId(null); setShowForm(true); }}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 group"
                                    >
                                        <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                                        ADD NEW STUDENT
                                    </button>
                                </div>
                            </div>

                            {/* Section Quick Stats */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Boys</p>
                                    <p className="text-2xl font-black text-blue-600">{stats.male}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Girls</p>
                                    <p className="text-2xl font-black text-rose-500">{stats.female}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Average Age</p>
                                    <p className="text-2xl font-black text-slate-800">14.2</p>
                                </div>
                            </div>

                            {/* Student Table/Grid */}
                            <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-6 py-5 w-10">
                                                <button 
                                                    onClick={toggleAll}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedIds.length === students.length && students.length > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}
                                                >
                                                    <Check size={12} strokeWidth={4} />
                                                </button>
                                            </th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Adm No. / Roll</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {students.map((student) => (
                                            <tr key={student.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.includes(student.id) ? 'bg-blue-50/50' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <button 
                                                        onClick={() => toggleSelection(student.id)}
                                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedIds.includes(student.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}
                                                    >
                                                        <Check size={12} strokeWidth={4} />
                                                    </button>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shadow-sm border border-white group-hover:scale-105 transition-transform flex-shrink-0">
                                                            {student.photo ? (
                                                                <img src={`/storage/${student.photo}`} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center font-black text-slate-400 text-lg uppercase">
                                                                    {student.first_name?.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-[15px]">{student.first_name} {student.last_name}</h4>
                                                            <p className="text-[11px] font-medium text-slate-400 lowercase">{student.gender} • {student.dob || 'NA'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-black text-slate-700">#{student.enrollment_no}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">ROLL: {student.roll_no || '--'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-widest">
                                                        {student.category?.name || 'General'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Active</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        <button 
                                                            onClick={() => { setEditStudentId(student.id); setShowForm(true); }}
                                                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                            title="Edit Student"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleSingleDelete(student.id)}
                                                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                            title="Delete Student"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {students.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-8 py-24 text-center">
                                                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                                                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                                                            <Users size={40} />
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-black text-slate-800 font-outfit">Empty Classroom</p>
                                                            <p className="text-sm font-bold text-slate-400 mt-1">There are no students registered in this section yet.</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => setShowForm(true)}
                                                            className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all mt-4"
                                                        >
                                                            Begin Admission
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StudentAdmissionManager;
