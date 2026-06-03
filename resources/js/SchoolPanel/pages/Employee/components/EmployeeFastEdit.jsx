import React, { useState, useEffect, useMemo } from 'react';
import { Users, Zap, CheckCircle2, ChevronRight, Save, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useBranch } from '../../../context/BranchContext';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_EDITABLE_FIELDS = [
    { id: 'first_name', label: 'First Name', type: 'text' },
    { id: 'middle_name', label: 'Middle Name', type: 'text' },
    { id: 'last_name', label: 'Last Name', type: 'text' },
    { id: 'email', label: 'Email Address', type: 'text' },
    { id: 'mobile_number', label: 'Mobile Number', type: 'text' },
    { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    { id: 'dob', label: 'Date of Birth', type: 'date' },
    { id: 'doj', label: 'Date of Joining', type: 'date' },
    { id: 'employee_type', label: 'Employee Type', type: 'select', 
      options: ['Teaching Staff', 'Non-Teaching Staff', 'Management'] },
    { id: 'attendance_code', label: 'Attendance Code', type: 'text' },
];

const EmployeeFastEdit = () => {
    const { selectedBranch } = useBranch();
    const [employees, setEmployees] = useState([]);
    const [customFields, setCustomFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Wizard Step
    const [step, setStep] = useState(1);

    // Selections
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [selectedFields, setSelectedFields] = useState(['mobile_number', 'employee_type', 'attendance_code']);
    
    // Edits tracking
    const [edits, setEdits] = useState({}); // { empId: { field: value, _isCustom: true/false } }

    useEffect(() => {
        if (selectedBranch?.id) {
            fetchData();
        }
    }, [selectedBranch]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [empRes, cfRes] = await Promise.all([
                api.get('users', { headers: { 'branch-id': selectedBranch?.id } }),
                api.get('custom-fields', { params: { module: 'Employee' }, headers: { 'branch-id': selectedBranch?.id } })
            ]);
            
            const allEmps = empRes.data.filter(u => u.employee);
            setEmployees(allEmps);
            
            // Map custom fields to match base structure, ignoring file type
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
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const ALL_FIELDS = useMemo(() => [...BASE_EDITABLE_FIELDS, ...customFields], [customFields]);

    const toggleEmployee = (id) => {
        setSelectedEmployeeIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleField = (fieldId) => {
        setSelectedFields(prev => {
            if (prev.includes(fieldId)) {
                return prev.filter(x => x !== fieldId);
            }
            if (prev.length >= 3) {
                toast.error('You can only select up to 3 fields maximum for fast editing.', {
                    icon: '⚠️'
                });
                return prev;
            }
            return [...prev, fieldId];
        });
    };

    const handleEditChange = (empId, fieldId, value) => {
        setEdits(prev => ({
            ...prev,
            [empId]: {
                ...(prev[empId] || {}),
                [fieldId]: value
            }
        }));
    };

    const handleSave = async () => {
        if (Object.keys(edits).length === 0) {
            return toast.success('No changes to save!');
        }

        const updates = Object.entries(edits).map(([id, changes]) => {
            const rowUpdate = { id: parseInt(id), custom_fields: {} };
            Object.entries(changes).forEach(([fieldId, val]) => {
                if (fieldId.startsWith('cf_')) {
                    rowUpdate.custom_fields[fieldId.replace('cf_', '')] = val;
                } else {
                    rowUpdate[fieldId] = val;
                }
            });
            if (Object.keys(rowUpdate.custom_fields).length === 0) {
                delete rowUpdate.custom_fields;
            }
            return rowUpdate;
        });

        setSaving(true);
        try {
            await api.post('users/bulk-update', { updates }, {
                headers: { 'branch-id': selectedBranch?.id }
            });
            toast.success(`${updates.length} employees updated successfully!`);
            setEdits({});
            fetchData();
        } catch (err) {
            toast.error('Failed to apply bulk updates');
            console.error(err);
        } finally {
            setSaving(false);
            setStep(1); // Return to start
        }
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => selectedEmployeeIds.includes(emp.id));
    }, [employees, selectedEmployeeIds]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                        <Zap size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight font-outfit">Fast Edit Workspace</h2>
                        <p className="text-sm font-bold text-slate-400">Step {step} of 3: {step === 1 ? 'Choose Employees' : step === 2 ? 'Select Fields' : 'Inline Edit'}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm min-h-[500px] flex flex-col relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col h-full"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-slate-700">Choose Employees to Edit</h3>
                                <button 
                                    onClick={() => setSelectedEmployeeIds(selectedEmployeeIds.length === employees.length ? [] : employees.map(e => e.id))}
                                    className="text-sm font-bold text-blue-500 hover:text-blue-600"
                                >
                                    {selectedEmployeeIds.length === employees.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-24">
                                {employees.map(emp => (
                                    <label key={emp.id} className={`flex items-center gap-4 cursor-pointer p-4 rounded-2xl border-2 transition-all ${selectedEmployeeIds.includes(emp.id) ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500 border-slate-300"
                                            checked={selectedEmployeeIds.includes(emp.id)}
                                            onChange={() => toggleEmployee(emp.id)}
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shadow-sm">
                                                {emp.avatar ? <img src={`/storage/${emp.avatar}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">{emp.name?.charAt(0)}</div>}
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-slate-700 line-clamp-1">{emp.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{emp.employee?.employee_type || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="absolute bottom-6 right-6 left-6 flex justify-end pt-4 bg-gradient-to-t from-white via-white to-transparent">
                                <button 
                                    onClick={() => setStep(2)}
                                    disabled={selectedEmployeeIds.length === 0}
                                    className="bg-blue-600 text-white rounded-xl px-8 py-3.5 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Proceed to Variables <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col h-full"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-slate-700">Select Variables to Edit</h3>
                                <button 
                                    onClick={() => setSelectedFields(selectedFields.length === ALL_FIELDS.length ? [] : ALL_FIELDS.map(f => f.id))}
                                    className="text-sm font-bold text-blue-500 hover:text-blue-600"
                                >
                                    {selectedFields.length === ALL_FIELDS.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-24">
                                {ALL_FIELDS.map(f => (
                                    <label key={f.id} className={`flex items-center gap-3 cursor-pointer p-5 rounded-2xl border-2 transition-transform ${selectedFields.includes(f.id) ? 'bg-orange-50 border-orange-500 shadow-sm scale-100' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                                        <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0 ${selectedFields.includes(f.id) ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-200 text-transparent group-hover:border-slate-300'}`}>
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-slate-700 block">{f.label}</span>
                                            {f.isCustom && <span className="text-[10px] font-black tracking-widest uppercase text-violet-500 mt-1 block">Custom Field</span>}
                                        </div>
                                        <input type="checkbox" className="sr-only" checked={selectedFields.includes(f.id)} onChange={() => toggleField(f.id)} />
                                    </label>
                                ))}
                            </div>

                            <div className="absolute bottom-6 right-6 left-6 flex justify-between items-center pt-4 bg-gradient-to-t from-white via-white to-transparent">
                                <button 
                                    onClick={() => setStep(1)}
                                    className="text-slate-500 hover:text-slate-800 font-bold text-sm flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} /> Go Back
                                </button>
                                <button 
                                    onClick={() => setStep(3)}
                                    disabled={selectedFields.length === 0}
                                    className="bg-orange-500 text-white rounded-xl px-8 py-3.5 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Start Inline Editing <Zap size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col h-full bg-slate-50 -m-6 p-6 rounded-[2rem]"
                        >
                            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden flex flex-col flex-1">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-900 text-white shadow-lg">
                                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest border-r border-slate-700 whitespace-nowrap sticky left-0 z-20 bg-slate-900 text-center">Employee details</th>
                                                {selectedFields.map(fieldId => {
                                                    const fieldDef = ALL_FIELDS.find(f => f.id === fieldId);
                                                    return (
                                                        <th key={fieldId} className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800 whitespace-nowrap min-w-[200px]">
                                                            {fieldDef?.label}
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredEmployees.map(emp => (
                                                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 whitespace-nowrap bg-slate-50 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                                {emp.avatar ? <img src={`/storage/${emp.avatar}`} className="w-full h-full object-cover" /> : <span className="font-bold text-slate-500 text-[10px]">{emp.name?.charAt(0)}</span>}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-xs text-slate-800">{emp.name}</p>
                                                                <p className="text-[9px] font-bold text-slate-400">{emp.employee?.employee_type}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {selectedFields.map(fieldId => {
                                                        const fieldDef = ALL_FIELDS.find(f => f.id === fieldId);
                                                        
                                                        const getDefVal = (e, fRef) => {
                                                            if (fRef.isCustom) {
                                                                return e.employee?.custom_field_values?.find(cfv => cfv.custom_field_id === fRef.customFieldId)?.field_value || '';
                                                            }
                                                            if (['employee_type', 'attendance_code'].includes(fRef.id)) return e.employee?.[fRef.id];
                                                            return e[fRef.id];
                                                        };
                                                        const defaultVal = getDefVal(emp, fieldDef);
                                                        const currentVal = edits[emp.id]?.[fieldId] !== undefined ? edits[emp.id][fieldId] : (defaultVal || '');

                                                        const isChanged = edits[emp.id]?.[fieldId] !== undefined && edits[emp.id][fieldId] !== defaultVal;

                                                        return (
                                                            <td key={fieldId} className="px-4 py-3 bg-white">
                                                                {fieldDef.type === 'select' ? (
                                                                    <select
                                                                        value={currentVal}
                                                                        onChange={(e) => handleEditChange(emp.id, fieldId, e.target.value)}
                                                                        className={`w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:bg-white rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 outline-none transition-all ${isChanged ? 'bg-amber-50 border-amber-200 text-amber-900' : ''}`}
                                                                    >
                                                                        <option value="">Select...</option>
                                                                        {(fieldDef.options || []).map((opt, i) => (
                                                                            <option key={i} value={typeof opt === 'string' ? opt : opt.value}>{typeof opt === 'string' ? opt : opt.label}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={currentVal}
                                                                        onChange={(e) => handleEditChange(emp.id, fieldId, e.target.value)}
                                                                        placeholder={`Enter ${fieldDef.label}`}
                                                                        className={`w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:bg-white rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 outline-none transition-all ${isChanged ? 'bg-amber-50 border-amber-200 text-amber-900' : ''}`}
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
                            
                            <div className="mt-6 flex justify-between items-center">
                                <button 
                                    onClick={() => setStep(2)}
                                    className="text-slate-500 hover:text-slate-800 font-bold text-sm flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} /> Reconfigure Fields
                                </button>
                                
                                <div className="flex items-center gap-4">
                                    <div className="text-xs font-bold text-slate-500">
                                        <span className="text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md ml-1">{Object.keys(edits).length}</span> Rows Edited
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || Object.keys(edits).length === 0}
                                        className="bg-emerald-500 text-white rounded-xl px-10 py-3.5 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Save All Changes
                                        {!saving && <CheckCircle2 size={16} />}
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

export default EmployeeFastEdit;
