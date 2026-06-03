import React, { useState, useEffect, useMemo } from 'react';
import { Users, Zap, CheckCircle2, ChevronRight, Save, Loader2, ArrowRight, ArrowLeft, LayoutGrid, GraduationCap, X } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_EDITABLE_FIELDS = [
    { id: 'title_id', label: 'Title', type: 'select', options: [] },
    { id: 'first_name', label: 'First Name', type: 'text' },
    { id: 'middle_name', label: 'Middle Name', type: 'text' },
    { id: 'last_name', label: 'Last Name', type: 'text' },
    { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    { id: 'dob', label: 'Date of Birth', type: 'date' },
    { id: 'doj', label: 'Date of Joining', type: 'date' },
    { id: 'roll_no', label: 'Roll Number', type: 'text' },
    { id: 'enrollment_no', label: 'Enrollment No', type: 'text' },
    { id: 'student_category_id', label: 'Category', type: 'select', options: [] },
    { id: 'father_mobile_no', label: "Father's Mobile No.", type: 'text' },
    { id: 'father_email_id', label: "Father's Email ID", type: 'text' },
    { id: 'country_id', label: 'Country', type: 'select', options: [] },
    { id: 'state_id', label: 'State', type: 'select', options: [] },
    { id: 'city_id', label: 'City', type: 'select', options: [] },
    { id: 'email', label: 'Student Email', type: 'text' },
    { id: 'mobile_no', label: 'Student Mobile', type: 'text' },
    { id: 'apaar_id', label: 'APAAR ID', type: 'text' },
    { id: 'scholar_id', label: 'Scholar ID', type: 'text' },
];

const StudentFastEdit = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();
    const [academicStructure, setAcademicStructure] = useState([]);
    const [metadata, setMetadata] = useState({
        titles: [],
        categories: [],
        countries: [],
        states: [],
        cities: []
    });
    const [students, setStudents] = useState([]);
    const [customFields, setCustomFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [step, setStep] = useState(1);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [selectedFields, setSelectedFields] = useState(['enrollment_no', 'father_mobile_no', 'title_id']);
    const [edits, setEdits] = useState({});

    useEffect(() => {
        if (selectedBranch?.id && selectedSession?.id) {
            fetchMetadata();
        }
    }, [selectedBranch, selectedSession]);

    const fetchMetadata = async () => {
        try {
            const [structRes, catRes, cfRes, titleRes, countryRes, stateRes, cityRes] = await Promise.all([
                api.get('academic-structure', { params: { session_id: selectedSession?.id }, headers: { 'branch-id': selectedBranch?.id } }),
                api.get('student-categories', { headers: { 'branch-id': selectedBranch?.id } }),
                api.get('custom-fields', { params: { module: 'Student' }, headers: { 'branch-id': selectedBranch?.id } }),
                api.get('student-titles'),
                api.get('countries'),
                api.get('states'), // Fetching all for simplicity in bulk edit
                api.get('cities')
            ]);
            
            setAcademicStructure(structRes.data);
            setMetadata({
                categories: catRes.data,
                titles: titleRes.data,
                countries: countryRes.data,
                states: stateRes.data,
                cities: cityRes.data
            });

            const availableCF = cfRes.data
                .filter(cf => cf.field_type !== 'file')
                .map(cf => ({
                    id: `cf_${cf.id}`,
                    customFieldId: cf.id,
                    label: cf.field_name,
                    type: cf.field_type === 'dropdown' ? 'select' : cf.field_type === 'date' ? 'date' : 'text',
                    options: cf.options || [],
                    isCustom: true
                }));
            setCustomFields(availableCF);
        } catch (err) {
            toast.error('Failed to load metadata');
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
        } catch (err) {
            toast.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedSectionId) fetchStudents(selectedSectionId);
    }, [selectedSectionId]);

    const ALL_FIELDS = useMemo(() => {
        const fields = JSON.parse(JSON.stringify(BASE_EDITABLE_FIELDS));
        
        // Populate options
        fields.forEach(f => {
            if (f.id === 'student_category_id') f.options = metadata.categories.map(c => ({ value: c.id, label: c.name }));
            if (f.id === 'title_id') f.options = metadata.titles.map(t => ({ value: t.id, label: t.name }));
            if (f.id === 'country_id') f.options = metadata.countries.map(c => ({ value: c.id, label: c.name }));
            if (f.id === 'state_id') f.options = metadata.states.map(s => ({ value: s.id, label: s.name }));
            if (f.id === 'city_id') f.options = metadata.cities.map(c => ({ value: c.id, label: c.name }));
        });

        return [...fields, ...customFields];
    }, [metadata, customFields]);

    const toggleStudent = (id) => {
        setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        setSelectedStudentIds(selectedStudentIds.length === students.length ? [] : students.map(s => s.id));
    };

    const toggleField = (fieldId) => {
        setSelectedFields(prev => {
            if (prev.includes(fieldId)) return prev.filter(x => x !== fieldId);
            if (prev.length >= 3) {
                toast.error('Limit: 3 fields max for Fast Edit.', { icon: '⚠️' });
                return prev;
            }
            return [...prev, fieldId];
        });
    };

    const handleEditChange = (studentId, fieldId, value) => {
        setEdits(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [fieldId]: value
            }
        }));
    };

    const handleSave = async () => {
        if (Object.keys(edits).length === 0) return toast.success('No changes to save!');

        const updates = Object.entries(edits).map(([id, changes]) => {
            const rowUpdate = { id: parseInt(id), custom_fields: {} };
            Object.entries(changes).forEach(([fieldId, val]) => {
                if (fieldId.startsWith('cf_')) {
                    rowUpdate.custom_fields[fieldId.replace('cf_', '')] = val;
                } else if (fieldId === 'enrollment_no') {
                    rowUpdate.admission_no = val; // Controller expects admission_no
                } else {
                    rowUpdate[fieldId] = val;
                }
            });
            if (Object.keys(rowUpdate.custom_fields).length === 0) delete rowUpdate.custom_fields;
            return rowUpdate;
        });

        setSaving(true);
        try {
            await api.post('students/bulk-update', { updates }, {
                headers: { 'branch-id': selectedBranch?.id }
            });
            toast.success(`${updates.length} students updated successfully!`);
            setEdits({});
            fetchStudents(selectedSectionId);
            setStep(1); 
        } catch (err) {
            toast.error('Failed to apply bulk updates');
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = useMemo(() => students.filter(s => selectedStudentIds.includes(s.id)), [students, selectedStudentIds]);
    const activeClass = academicStructure.find(c => c.id === parseInt(selectedClassId));

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Zap size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight font-outfit">Student Fast Edit</h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Step {step} of 3: {step === 1 ? 'Filter Students' : step === 2 ? 'Select Parameters' : 'Multi-Edit Table'}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm min-h-[500px] flex flex-col relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col h-full"
                        >
                            <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Class</label>
                                    <select 
                                        value={selectedClassId}
                                        onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSectionId(''); }}
                                        className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-700 text-sm"
                                    >
                                        <option value="">Select...</option>
                                        {academicStructure.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Section</label>
                                    <select 
                                        disabled={!selectedClassId}
                                        value={selectedSectionId}
                                        onChange={(e) => setSelectedSectionId(e.target.value)}
                                        className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-700 text-sm disabled:opacity-50"
                                    >
                                        <option value="">Select...</option>
                                        {activeClass?.sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-slate-700 font-outfit">Select Students to include</h3>
                                {students.length > 0 && (
                                    <button 
                                        onClick={toggleAll}
                                        className="text-xs font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest"
                                    >
                                        {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All Records'}
                                    </button>
                                )}
                            </div>
                            
                            {loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                                    <Loader2 className="animate-spin text-blue-500" size={40} />
                                    <p className="text-slate-400 font-bold text-sm">Searching records...</p>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50 py-20">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                                        <Users size={40} />
                                    </div>
                                    <p className="font-bold text-slate-400 text-sm max-w-[240px]">Select a Class and Section above to find members.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-24 max-h-[400px]">
                                    {students.map(s => (
                                        <label key={s.id} className={`flex items-center gap-4 cursor-pointer p-4 rounded-2xl border-2 transition-all ${selectedStudentIds.includes(s.id) ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                                            <input type="checkbox" className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500 border-slate-300" checked={selectedStudentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center">
                                                    {s.photo ? <img src={`/storage/${s.photo}`} className="w-full h-full object-cover" /> : <div className="font-black text-slate-400 text-xs">{s.first_name.charAt(0)}</div>}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-slate-700 line-clamp-1">{s.first_name} {s.last_name}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {s.enrollment_no}</span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            <div className="absolute bottom-6 right-6 left-6 flex justify-end pt-4 bg-gradient-to-t from-white via-white to-transparent">
                                <button onClick={() => setStep(2)} disabled={selectedStudentIds.length === 0} className="bg-blue-600 text-white rounded-2xl px-10 py-4 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50">
                                    Next: Select Variables <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black text-slate-700 font-outfit">Choose Parameters to Modify</h3>
                                <button onClick={() => setSelectedFields(selectedFields.length === ALL_FIELDS.length ? [] : ALL_FIELDS.map(f => f.id))} className="text-xs font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest">
                                    {selectedFields.length === ALL_FIELDS.length ? 'Reset All' : 'Select All Variables'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-24 overflow-y-auto max-h-[450px]">
                                {ALL_FIELDS.map(f => (
                                    <label key={f.id} className={`flex items-center gap-3 cursor-pointer p-5 rounded-2xl border-2 transition-all ${selectedFields.includes(f.id) ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors flex-shrink-0 ${selectedFields.includes(f.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-200 text-transparent'}`}>
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black text-slate-700 tracking-tight">{f.label}</span>
                                            {f.isCustom && <span className="text-[10px] font-black tracking-[0.2em] uppercase text-violet-500 mt-1 block">Custom Field</span>}
                                        </div>
                                        <input type="checkbox" className="sr-only" checked={selectedFields.includes(f.id)} onChange={() => toggleField(f.id)} />
                                    </label>
                                ))}
                            </div>

                            <div className="absolute bottom-6 right-6 left-6 flex justify-between items-center pt-4 bg-gradient-to-t from-white via-white to-transparent">
                                <button onClick={() => setStep(1)} className="text-[11px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <ArrowLeft size={16} /> Change Selection
                                </button>
                                <button onClick={() => setStep(3)} disabled={selectedFields.length === 0} className="bg-indigo-600 text-white rounded-2xl px-10 py-4 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50">
                                    Launch Multi-Editor <Zap size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex flex-col h-full bg-slate-50 -m-6 p-6 rounded-[2rem]">
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] overflow-hidden flex flex-col flex-1">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-900 text-white">
                                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest border-r border-slate-700 whitespace-nowrap sticky left-0 z-20 bg-slate-900 text-center">Student Record</th>
                                                {selectedFields.map(fieldId => (
                                                    <th key={fieldId} className="px-6 py-6 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800 whitespace-nowrap min-w-[220px]">
                                                        {ALL_FIELDS.find(f => f.id === fieldId)?.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredStudents.map(student => (
                                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-8 py-4 whitespace-nowrap bg-slate-50 sticky left-0 z-10 border-r border-slate-200">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                                                                {student.photo ? <img src={`/storage/${student.photo}`} className="w-full h-full object-cover" /> : <span className="font-black text-slate-400 text-xs">{student.first_name.charAt(0)}</span>}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-sm text-slate-800 tracking-tight">{student.first_name} {student.last_name}</p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {student.enrollment_no}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {selectedFields.map(fieldId => {
                                                        const fieldDef = ALL_FIELDS.find(f => f.id === fieldId);
                                                        const getDefVal = (s, fDef) => {
                                                            if (fDef.isCustom) return s.custom_field_values?.find(cfv => cfv.custom_field_id === fDef.customFieldId)?.value || '';
                                                            return s[fDef.id] || '';
                                                        };
                                                        const defaultVal = getDefVal(student, fieldDef);
                                                        const currentVal = edits[student.id]?.[fieldId] !== undefined ? edits[student.id][fieldId] : (defaultVal || '');
                                                        const isChanged = edits[student.id]?.[fieldId] !== undefined && edits[student.id][fieldId] != defaultVal;

                                                        return (
                                                            <td key={fieldId} className="px-4 py-4 bg-white">
                                                                {fieldDef.type === 'select' ? (
                                                                    <select
                                                                        value={currentVal}
                                                                        onChange={(e) => handleEditChange(student.id, fieldId, e.target.value)}
                                                                        className={`w-full bg-slate-50 border-2 p-3 rounded-2xl text-[13px] font-bold text-slate-700 outline-none transition-all ${isChanged ? 'bg-amber-50 border-amber-300 ring-4 ring-amber-100' : 'border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
                                                                    >
                                                                        <option value="">Select...</option>
                                                                        {(fieldDef.options || []).map((opt, i) => (
                                                                            <option key={i} value={typeof opt === 'string' ? opt : opt.value}>{typeof opt === 'string' ? opt : opt.label}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <input
                                                                        type={fieldDef.type === 'date' ? 'date' : 'text'}
                                                                        value={currentVal}
                                                                        onChange={(e) => handleEditChange(student.id, fieldId, e.target.value)}
                                                                        placeholder={`Enter value...`}
                                                                        className={`w-full bg-slate-50 border-2 p-3 rounded-2xl text-[13px] font-bold text-slate-700 outline-none transition-all ${isChanged ? 'bg-amber-50 border-amber-300 ring-4 ring-amber-100' : 'border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
                                                                    />
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-between items-center">
                                <button onClick={() => setStep(2)} className="text-[11px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <ArrowLeft size={16} /> Change Parameters
                                </button>
                                
                                <div className="flex items-center gap-6">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Queue: <span className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 ml-2">{Object.keys(edits).length} Pendings</span>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || Object.keys(edits).length === 0}
                                        className="bg-emerald-500 text-white rounded-2xl px-12 py-4 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-3 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Apply Mass Update
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StudentFastEdit;
