import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import {
    Loader2, Search, Check,
    ChevronRight, ArrowLeft, User, Users,
    Receipt, DollarSign, Printer, CheckCircle2,
    CreditCard
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeeReceiptWizard = () => {
    // Step management
    const [step, setStep] = useState(1);
    const [receiptType, setReceiptType] = useState(null); // 'Student' | 'Class'

    // Student search (Step 2a)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Class/Section selection (Step 2b)
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [sections, setSections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');

    // Students list (Step 3)
    const [classStudents, setClassStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Selected student (Step 4-5)
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDueData, setStudentDueData] = useState(null);
    const [loadingDueData, setLoadingDueData] = useState(false);

    // Payment (Step 5-6)
    const [selectedFeeHeadIds, setSelectedFeeHeadIds] = useState([]);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
    const [fineAmount, setFineAmount] = useState('');
    const [extraConcession, setExtraConcession] = useState('');
    const [remarks, setRemarks] = useState('');
    const [feeBankId, setFeeBankId] = useState('');
    const [feeBanks, setFeeBanks] = useState([]);
    const [saving, setSaving] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);

    // Load classes on mount
    useEffect(() => {
        fetchClasses();
        fetchFeeBanks();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get('fee-receipt-wizard/classes');
            setClasses(res.data.classes || []);
        } catch {
            toast.error('Failed to load classes');
        }
    };

    const fetchFeeBanks = async () => {
        try {
            const res = await api.get('fee-banks');
            setFeeBanks(Array.isArray(res.data) ? res.data.filter(b => b.is_active) : []);
        } catch {
            // Non-critical
        }
    };

    // Step 1: Select type
    const handleSelectType = (type) => {
        setReceiptType(type);
        setStep(2);
        setSelectedStudent(null);
        setStudentDueData(null);
        setSelectedFeeHeadIds([]);
        setPaymentResult(null);
    };

    // Step 2a: Search students by name/enrollment
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await api.get('fee-receipt-wizard/search-students', {
                params: { search: searchQuery.trim() }
            });
            setSearchResults(res.data.students || []);
        } catch {
            toast.error('Search failed');
        } finally {
            setSearching(false);
        }
    }, [searchQuery]);

    // Step 2b: Load sections when class changes
    const handleClassChange = (classId) => {
        setSelectedClassId(classId);
        setSelectedSectionId('');
        setClassStudents([]);
        const cls = classes.find(c => c.id == classId);
        setSections(cls?.sections || []);
    };

    // Step 3: Load students for section
    const loadStudentsForSection = async () => {
        if (!selectedSectionId) return;
        setLoadingStudents(true);
        try {
            const res = await api.get('fee-receipt-wizard/classes', {
                params: { section_id: selectedSectionId }
            });
            setClassStudents(res.data.students || []);
            setStep(3);
        } catch {
            toast.error('Failed to load students');
        } finally {
            setLoadingStudents(false);
        }
    };

    // Step 4: Select student and load due details
    const selectStudent = async (student) => {
        setSelectedStudent(student);
        setSelectedFeeHeadIds([]);
        setPaymentResult(null);
        setFineAmount('');
        setExtraConcession('');
        setRemarks('');
        setFeeBankId('');

        setLoadingDueData(true);
        try {
            const res = await api.get(`fee-receipt-wizard/student-due-details/${student.id}`);
            setStudentDueData(res.data);
            setStep(4);
        } catch {
            toast.error('Failed to load student due details');
        } finally {
            setLoadingDueData(false);
        }
    };

    // Step 4: Toggle due item selection (by fee_head_id)
    const toggleDueItem = (feeHeadId) => {
        setSelectedFeeHeadIds(prev =>
            prev.includes(feeHeadId)
                ? prev.filter(id => id !== feeHeadId)
                : [...prev, feeHeadId]
        );
    };

    // Step 4: Select all due items
    const selectAllDueItems = () => {
        if (!studentDueData) return;
        const allIds = studentDueData.due_items.map(i => i.fee_head_id);
        if (selectedFeeHeadIds.length === allIds.length) {
            setSelectedFeeHeadIds([]);
        } else {
            setSelectedFeeHeadIds(allIds);
        }
    };

    // Step 5: Process payment
    const handleReceivePayment = async () => {
        if (selectedFeeHeadIds.length === 0) {
            return toast.error('Please select at least one due item');
        }
        if (!receiptDate) {
            return toast.error('Please select receipt date');
        }

        setSaving(true);
        try {
            const payload = {
                student_id: selectedStudent.id,
                selected_fee_head_ids: selectedFeeHeadIds,
                receipt_date: receiptDate,
                payment_mode: paymentMode,
                remarks: remarks || undefined,
                fee_bank_id: feeBankId || undefined,
                fine_amount: fineAmount ? parseFloat(fineAmount) : undefined,
                extra_concession: extraConcession ? parseFloat(extraConcession) : undefined,
            };

            const res = await api.post('fee-receipt-wizard/receive-payment', payload);
            setPaymentResult(res.data);
            toast.success('Payment received successfully!');
            setStep(5);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment failed');
        } finally {
            setSaving(false);
        }
    };

    // Go back to student selection
    const handleBackToStudents = () => {
        if (receiptType === 'Student') {
            setStep(2);
        } else {
            setStep(3);
        }
        setSelectedStudent(null);
        setStudentDueData(null);
        setSelectedFeeHeadIds([]);
        setPaymentResult(null);
    };

    // Reset entire wizard
    const handleReset = () => {
        setStep(1);
        setReceiptType(null);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedClassId('');
        setSelectedSectionId('');
        setClassStudents([]);
        setSelectedStudent(null);
        setStudentDueData(null);
        setSelectedFeeHeadIds([]);
        setPaymentMode('Cash');
        setReceiptDate(new Date().toISOString().split('T')[0]);
        setFineAmount('');
        setExtraConcession('');
        setRemarks('');
        setFeeBankId('');
        setPaymentResult(null);
    };

    // Calculate selected amounts
    const selectedItems = studentDueData?.due_items?.filter(i => selectedFeeHeadIds.includes(i.fee_head_id)) || [];
    const totalSelectedDue = selectedItems.reduce((sum, i) => sum + i.due_amount, 0);
    const fineVal = parseFloat(fineAmount) || 0;
    const extraConcVal = parseFloat(extraConcession) || 0;
    const finalPayable = Math.max(0, totalSelectedDue + fineVal - extraConcVal);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                        <Receipt size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Fee Receipt Wizard</h3>
                        <p className="text-sm text-slate-400 font-medium">Collect fees by student or by class.</p>
                    </div>
                </div>
            </div>

            {/* Step Progress Indicator */}
            <div className="flex items-center gap-2 px-2">
                {[
                    { num: 1, label: 'Type' },
                    { num: 2, label: receiptType === 'Student' ? 'Search' : 'Class' },
                    { num: 3, label: 'Student' },
                    { num: 4, label: 'Due Fees' },
                    { num: 5, label: 'Payment' },
                ].map((s, idx) => (
                    <React.Fragment key={s.num}>
                        <div className={`flex items-center gap-2 ${step >= s.num ? 'text-emerald-600' : 'text-slate-300'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${step >= s.num ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                                {step > s.num ? <Check size={14} /> : s.num}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest hidden sm:block ${step >= s.num ? 'text-emerald-700' : 'text-slate-400'}`}>
                                {s.label}
                            </span>
                        </div>
                        {idx < 4 && (
                            <div className={`flex-1 h-[2px] rounded-full ${step > s.num ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Select Type */}
            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-8">
                    <button
                        onClick={() => handleSelectType('Student')}
                        className="group bg-white rounded-[2rem] border-2 border-slate-100 p-8 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-300 text-left"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-400 text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-blue-200">
                            <User size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 font-outfit mb-2">Student</h4>
                        <p className="text-sm text-slate-400">Search by name or enrollment number to collect fees for a specific student.</p>
                        <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                            Select <ChevronRight size={16} />
                        </div>
                    </button>
                    <button
                        onClick={() => handleSelectType('Class')}
                        className="group bg-white rounded-[2rem] border-2 border-slate-100 p-8 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-300 text-left"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-400 text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-violet-200">
                            <Users size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 font-outfit mb-2">Class</h4>
                        <p className="text-sm text-slate-400">Select a class and section to view students and collect fees.</p>
                        <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                            Select <ChevronRight size={16} />
                        </div>
                    </button>
                </div>
            )}

            {/* Step 2a: Student Search */}
            {step === 2 && receiptType === 'Student' && (
                <div className="max-w-3xl mx-auto space-y-6 pt-4">
                    <div className="flex items-center gap-3">
                        <button onClick={handleReset} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all">
                            <ArrowLeft size={18} />
                        </button>
                        <h4 className="text-lg font-bold text-slate-800 font-outfit">Search Student</h4>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative flex-1 group">
                            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Enter name or enrollment number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-5 text-sm font-bold focus:ring-8 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={!searchQuery.trim() || searching}
                            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
                        >
                            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            Search
                        </button>
                    </div>

                    {searching ? (
                        <div className="py-16 flex flex-col items-center text-slate-300 gap-4">
                            <Loader2 size={40} className="animate-spin text-emerald-500" />
                            <span className="text-xs font-black uppercase tracking-widest">Searching...</span>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {searchResults.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => selectStudent(student)}
                                    className="flex items-center gap-4 bg-white rounded-2xl border-2 border-slate-100 p-4 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-50 transition-all text-left group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600 font-bold text-sm border-2 border-emerald-100 flex-shrink-0 overflow-hidden">
                                        {student.photo ? (
                                            <img src={student.photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            student.name?.charAt(0)?.toUpperCase() || '?'
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 truncate">{student.name}</p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            ENR: {student.enrollment_no || '—'} | {student.class} - {student.section}
                                        </p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    ) : searchQuery.trim() ? (
                        <div className="py-16 flex flex-col items-center text-slate-300 gap-4">
                            <User size={48} className="text-slate-200" />
                            <span className="text-sm font-bold">No students found</span>
                        </div>
                    ) : (
                        <div className="py-16 flex flex-col items-center text-slate-300 gap-4">
                            <Search size={48} className="text-slate-200" />
                            <span className="text-sm font-bold">Type a name or enrollment number to search</span>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2b: Class & Section Selection */}
            {step === 2 && receiptType === 'Class' && (
                <div className="max-w-3xl mx-auto space-y-6 pt-4">
                    <div className="flex items-center gap-3">
                        <button onClick={handleReset} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all">
                            <ArrowLeft size={18} />
                        </button>
                        <h4 className="text-lg font-bold text-slate-800 font-outfit">Select Class & Section</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Select Class *</label>
                            <select
                                value={selectedClassId}
                                onChange={(e) => handleClassChange(e.target.value)}
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm transition-all"
                            >
                                <option value="">Choose a class</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Select Section *</label>
                            <select
                                value={selectedSectionId}
                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                disabled={!selectedClassId}
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm transition-all disabled:opacity-50"
                            >
                                <option value="">Choose a section</option>
                                {sections.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={loadStudentsForSection}
                        disabled={!selectedSectionId || loadingStudents}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                    >
                        {loadingStudents ? (
                            <><Loader2 size={16} className="animate-spin" /> Loading...</>
                        ) : (
                            <><Users size={16} /> View Students</>
                        )}
                    </button>
                </div>
            )}

            {/* Step 3: Student List (for Class type) */}
            {step === 3 && receiptType === 'Class' && (
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setStep(2); setSelectedSectionId(''); }} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h4 className="text-lg font-bold text-slate-800 font-outfit">Select Student</h4>
                            <p className="text-xs text-slate-400 font-medium">{classStudents.length} student(s) found</p>
                        </div>
                    </div>

                    {classStudents.length === 0 ? (
                        <div className="py-16 flex flex-col items-center text-slate-300 gap-4">
                            <Users size={48} className="text-slate-200" />
                            <span className="text-sm font-bold">No students in this section</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {classStudents.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => selectStudent(student)}
                                    className="flex items-center gap-4 bg-white rounded-2xl border-2 border-slate-100 p-4 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-50 transition-all text-left group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600 font-bold text-sm border-2 border-emerald-100 flex-shrink-0 overflow-hidden">
                                        {student.photo ? (
                                            <img src={student.photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            student.name?.charAt(0)?.toUpperCase() || '?'
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 truncate">{student.name}</p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            ENR: {student.enrollment_no || '—'} | Roll: {student.roll_no || '—'}
                                        </p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 4: Student Due Details */}
            {step === 4 && selectedStudent && (
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-3">
                        <button onClick={handleBackToStudents} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h4 className="text-lg font-bold text-slate-800 font-outfit">Student Due Fees</h4>
                            <p className="text-xs text-slate-400 font-medium">Select fees to receive payment</p>
                        </div>
                    </div>

                    {loadingDueData ? (
                        <div className="py-20 flex flex-col items-center text-slate-300 gap-4">
                            <Loader2 size={40} className="animate-spin text-emerald-500" />
                            <span className="text-xs font-black uppercase tracking-widest">Loading details...</span>
                        </div>
                    ) : studentDueData ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Student Info Card */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600 font-bold text-lg border-2 border-emerald-100 flex-shrink-0 overflow-hidden">
                                            {studentDueData.student.photo ? (
                                                <img src={studentDueData.student.photo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                studentDueData.student.name?.charAt(0)?.toUpperCase() || '?'
                                            )}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-800 text-lg font-outfit">{studentDueData.student.name}</h5>
                                            <p className="text-xs text-slate-400 font-medium">ENR: {studentDueData.student.enrollment_no || '—'}</p>
                                        </div>
                                    </div>

                                    {/* Bill schemes info */}
                                    {studentDueData.bill_schemes?.length > 0 && (
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bill Schemes Applied</p>
                                            {studentDueData.bill_schemes.map(s => (
                                                <p key={s.id} className="text-xs font-bold text-slate-700">• {s.name}</p>
                                            ))}
                                        </div>
                                    )}

                                    <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Class</span><span className="font-bold text-slate-700">{studentDueData.student.class}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Section</span><span className="font-bold text-slate-700">{studentDueData.student.section}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Roll No</span><span className="font-bold text-slate-700">{studentDueData.student.roll_no || '—'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Mobile</span><span className="font-bold text-slate-700">{studentDueData.student.mobile_no || '—'}</span></div>
                                    </div>

                                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Due Amount</p>
                                        <p className="text-2xl font-black text-emerald-700 font-outfit">
                                            ₹{(studentDueData.due_summary?.total_due_amount || 0).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-emerald-500 font-medium">{studentDueData.due_summary?.total_items || 0} item(s) pending</p>
                                    </div>
                                </div>
                            </div>

                            {/* Due Items & Recent Transactions */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Due Items */}
                                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={18} className="text-emerald-600" />
                                            <h5 className="font-bold text-slate-800">Due Fees (Till Today)</h5>
                                        </div>
                                        <button
                                            onClick={selectAllDueItems}
                                            className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-800 transition-colors"
                                        >
                                            {selectedFeeHeadIds.length === studentDueData.due_items.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>

                                    {studentDueData.due_items.length === 0 ? (
                                        <div className="py-8 text-center text-slate-400 font-medium">
                                            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
                                            <p>No due fees pending for this student</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {studentDueData.due_items.map(item => (
                                                <label
                                                    key={item.fee_head_id}
                                                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedFeeHeadIds.includes(item.fee_head_id) ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                                                >
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${selectedFeeHeadIds.includes(item.fee_head_id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                                                        {selectedFeeHeadIds.includes(item.fee_head_id) && <Check size={14} />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFeeHeadIds.includes(item.fee_head_id)}
                                                        onChange={() => toggleDueItem(item.fee_head_id)}
                                                        className="hidden"
                                                    />
                                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                        <div>
                                                            <p className="font-bold text-slate-800">{item.fee_head_name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{item.bill_scheme_name || (item.installment_label || '')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-medium">Total Amount</p>
                                                            <p className="font-bold text-slate-700">₹{item.original_amount.toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-medium">Already Paid</p>
                                                            <p className="font-bold text-slate-500">₹{item.already_paid.toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-medium">Due Amount</p>
                                                            <p className="font-bold text-emerald-700">₹{item.due_amount.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    {item.due_date && (
                                                        <span className="text-[10px] text-amber-600 font-bold whitespace-nowrap bg-amber-50 px-2 py-1 rounded-lg">
                                                            Due: {item.due_date}
                                                        </span>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Recent Transactions */}
                                {studentDueData.recent_receipts?.length > 0 && (
                                    <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Receipt size={18} className="text-slate-400" />
                                            <h5 className="font-bold text-slate-800">Last 10 Transactions</h5>
                                        </div>
                                        <div className="space-y-2">
                                            {studentDueData.recent_receipts.map(receipt => (
                                                <div key={receipt.receipt_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                                            <Receipt size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-700 text-xs">{receipt.receipt_no}</p>
                                                            <p className="text-[10px] text-slate-400">{receipt.receipt_date} | {receipt.payment_mode}</p>
                                                            {receipt.items?.map((d, idx) => (
                                                                <p key={idx} className="text-[10px] text-slate-500">{d.fee_head_name}: ₹{d.paid_amount.toLocaleString()}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="font-black text-emerald-700 flex-shrink-0">₹{receipt.paid_amount.toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Proceed to Payment Button */}
                                {selectedFeeHeadIds.length > 0 && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setStep(5)}
                                            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
                                        >
                                            Proceed to Payment ({selectedItems.length} items)
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Step 5: Payment Form & Confirmation */}
            {step === 5 && (
                <div className="space-y-6 pt-4">
                    {paymentResult ? (
                        /* Payment Success */
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white rounded-[2rem] border-2 border-emerald-500 p-8 shadow-2xl shadow-emerald-100 text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-100">
                                    <CheckCircle2 size={40} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-800 font-outfit">Payment Successful!</h4>
                                    <p className="text-slate-400 font-medium mt-1">Receipt #{paymentResult.receipt?.receipt_no}</p>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3 border border-slate-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 font-medium">Student</span>
                                        <span className="font-bold text-slate-800">{paymentResult.payslip?.student_name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 font-medium">Date</span>
                                        <span className="font-bold text-slate-800">{paymentResult.payslip?.date}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 font-medium">Payment Mode</span>
                                        <span className="font-bold text-slate-800">{paymentResult.payslip?.payment_mode}</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fee Breakdown</p>
                                        {paymentResult.payslip?.items?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm py-1">
                                                <span className="text-slate-600">{item.fee_head}</span>
                                                <span className="font-bold text-slate-700">₹{item.paid.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {paymentResult.payslip?.fine_applied > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-rose-500 font-medium">Fine Applied</span>
                                            <span className="font-bold text-rose-600">+₹{paymentResult.payslip.fine_applied.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {paymentResult.payslip?.extra_concession > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-violet-500 font-medium">Extra Concession</span>
                                            <span className="font-bold text-violet-600">-₹{paymentResult.payslip.extra_concession.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-emerald-200 pt-3 flex justify-between">
                                        <span className="font-bold text-slate-800">Total Paid</span>
                                        <span className="font-black text-emerald-700 text-lg">₹{paymentResult.receipt?.paid_amount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleReset}
                                        className="px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all"
                                    >
                                        Collect Another Payment
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="px-6 py-3.5 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-slate-300 transition-all flex items-center gap-2"
                                    >
                                        <Printer size={16} /> Print
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Payment Form */
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-3 space-y-6">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setStep(4)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all">
                                        <ArrowLeft size={18} />
                                    </button>
                                    <h4 className="text-lg font-bold text-slate-800 font-outfit">Receive Payment</h4>
                                </div>

                                {/* Selected Items */}
                                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Receipt size={18} className="text-emerald-600" />
                                            <h5 className="font-bold text-slate-800">Selected Due Items</h5>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">{selectedItems.length} item(s)</span>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedItems.map(item => (
                                            <div key={item.fee_head_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                                                <div>
                                                    <p className="font-bold text-slate-700">{item.fee_head_name}</p>
                                                    <p className="text-[10px] text-slate-400">{item.installment_label || ''}</p>
                                                </div>
                                                <p className="font-bold text-emerald-700">₹{item.due_amount.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Mode Selection */}
                                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm space-y-5">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={18} className="text-slate-400" />
                                        <h5 className="font-bold text-slate-800">Payment Details</h5>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Receipt Date *</label>
                                            <input
                                                type="date"
                                                value={receiptDate}
                                                onChange={(e) => setReceiptDate(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Payment Mode *</label>
                                            <select
                                                value={paymentMode}
                                                onChange={(e) => setPaymentMode(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm"
                                            >
                                                <option value="Cash">Cash</option>
                                                <option value="Cheque">Cheque</option>
                                                <option value="Online">Online</option>
                                                <option value="DD">DD</option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                            </select>
                                        </div>
                                    </div>

                                    {(paymentMode === 'Cheque' || paymentMode === 'DD' || paymentMode === 'Online' || paymentMode === 'Bank Transfer') && (
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Fee Bank (optional)</label>
                                            <select
                                                value={feeBankId}
                                                onChange={(e) => setFeeBankId(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm"
                                            >
                                                <option value="">Select Bank</option>
                                                {feeBanks.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Fine Amount (optional)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0"
                                                value={fineAmount}
                                                onChange={(e) => setFineAmount(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Extra Concession (optional)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0"
                                                value={extraConcession}
                                                onChange={(e) => setExtraConcession(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Remarks (optional)</label>
                                        <textarea
                                            placeholder="Any remarks..."
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            rows={2}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Summary Sidebar */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-[2rem] border-2 border-emerald-600 p-6 shadow-2xl shadow-emerald-100 sticky top-8 space-y-5">
                                    <h5 className="font-bold text-slate-800 text-center font-outfit">Payment Summary</h5>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 font-medium">Student</span>
                                            <span className="font-bold text-slate-700">{selectedStudent?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 font-medium">Items Selected</span>
                                            <span className="font-bold text-slate-700">{selectedItems.length}</span>
                                        </div>
                                        <div className="border-t border-slate-100 pt-3 flex justify-between">
                                            <span className="text-slate-600 font-medium">Total Due Amount</span>
                                            <span className="font-bold text-slate-800">₹{totalSelectedDue.toLocaleString()}</span>
                                        </div>
                                        {fineVal > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-rose-500 font-medium">Fine (+)</span>
                                                <span className="font-bold text-rose-600">+₹{fineVal.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {extraConcVal > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-violet-500 font-medium">Concession (−)</span>
                                                <span className="font-bold text-violet-600">-₹{extraConcVal.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="border-t-2 border-emerald-600 pt-3 flex justify-between">
                                            <span className="font-bold text-slate-800">Payable Amount</span>
                                            <span className="font-black text-emerald-700 text-xl font-outfit">₹{finalPayable.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleReceivePayment}
                                        disabled={saving || selectedFeeHeadIds.length === 0 || finalPayable <= 0}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                                    >
                                        {saving ? (
                                            <><Loader2 size={16} className="animate-spin" /> Processing...</>
                                        ) : (
                                            <><CheckCircle2 size={16} /> Receive Payment</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FeeReceiptWizard;