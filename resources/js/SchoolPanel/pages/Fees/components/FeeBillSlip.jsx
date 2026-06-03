import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import {
    Loader2, Search, Check, ChevronDown, FileDown, Filter, X,
    BookOpen, Users, DollarSign, Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeeBillSlip = () => {
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [summary, setSummary] = useState(null);
    const [searching, setSearching] = useState(false);

    // Filter state
    const [sectionIds, setSectionIds] = useState([]);
    const [schemeIds, setSchemeIds] = useState([]);
    const [slabFilters, setSlabFilters] = useState([]);
    const [includeImprest, setIncludeImprest] = useState(true);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        setLoading(true);
        try {
            const res = await api.get('fee-bill/filters');
            setFilters(res.data);
        } catch {
            toast.error('Failed to load filters');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (id) => {
        setSectionIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleScheme = (id) => {
        setSchemeIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSlab = (slab) => {
        setSlabFilters(prev =>
            prev.includes(slab) ? prev.filter(x => x !== slab) : [...prev, slab]
        );
    };

    const handleSearch = async () => {
        setSearching(true);
        try {
            const res = await api.post('fee-bill/students', {
                section_ids: sectionIds.length > 0 ? sectionIds : undefined,
                bill_scheme_ids: schemeIds.length > 0 ? schemeIds : undefined,
                slabs: slabFilters.length > 0 ? slabFilters : undefined,
                include_imprest: includeImprest,
            });
            setStudents(res.data.students || []);
            setSummary(res.data.summary || null);
            setSelectedIds([]);
        } catch {
            toast.error('Failed to load students');
        } finally {
            setSearching(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === students.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(s => s.id));
        }
    };

    const toggleStudent = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleDownloadPdf = async () => {
        if (selectedIds.length === 0) {
            return toast.error('Please select at least one student');
        }
        setGeneratingPdf(true);
        try {
            const res = await api.post('fee-bill/payslip-pdf', {
                student_ids: selectedIds,
                receipt_date: new Date().toISOString().split('T')[0],
                payment_mode: 'Cash',
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payslips-${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('PDF downloaded successfully');
        } catch (err) {
            toast.error('Failed to generate PDF');
        } finally {
            setGeneratingPdf(false);
        }
    };

    const getSelectedCount = () => selectedIds.length;
    const selectedSum = students
        .filter(s => selectedIds.includes(s.id))
        .reduce((sum, s) => sum + s.due_amount, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-amber-200">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Fee Bill Slip</h3>
                        <p className="text-sm text-slate-400 font-medium">Generate bulk payslips filtered by section, scheme, and slab.</p>
                    </div>
                </div>
                {students.length > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400">{getSelectedCount()} of {students.length} selected</span>
                        {getSelectedCount() > 0 && (
                            <button
                                onClick={handleDownloadPdf}
                                disabled={generatingPdf}
                                className="px-6 py-3.5 bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {generatingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                                Download PDF ({getSelectedCount()})
                            </button>
                        )}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5">
                    <Loader2 size={40} className="animate-spin text-amber-500" /> Loading...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1 space-y-5">
                        <div className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm space-y-5">
                            <div className="flex items-center gap-2">
                                <Filter size={18} className="text-amber-600" />
                                <h5 className="font-bold text-slate-800">Filters</h5>
                            </div>

                            {/* Sections Filter */}
                            {filters?.classes && (
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Sections</label>
                                    <div className="max-h-32 overflow-y-auto space-y-1.5">
                                        {filters.classes.map(cls => (
                                            <div key={cls.id}>
                                                <p className="text-[10px] font-bold text-slate-400 ml-1 mb-1">{cls.name}</p>
                                                {cls.sections.map(sec => (
                                                    <label key={sec.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
                                                        <input
                                                            type="checkbox"
                                                            checked={sectionIds.includes(sec.id)}
                                                            onChange={() => toggleSection(sec.id)}
                                                            className="w-4 h-4 rounded accent-amber-600"
                                                        />
                                                        <span className="text-xs font-medium text-slate-600">{sec.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bill Schemes Filter */}
                            {filters?.bill_schemes && (
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Fee Bill Schemes</label>
                                    <div className="max-h-32 overflow-y-auto space-y-1.5">
                                        {filters.bill_schemes.map(scheme => (
                                            <label key={scheme.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={schemeIds.includes(scheme.id)}
                                                    onChange={() => toggleScheme(scheme.id)}
                                                    className="w-4 h-4 rounded accent-amber-600"
                                                />
                                                <span className="text-xs font-medium text-slate-600">{scheme.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Slabs Filter */}
                            {filters?.slabs?.length > 0 && (
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Fee Slab (By Date)</label>
                                    <div className="max-h-28 overflow-y-auto space-y-1.5">
                                        {filters.slabs.map(slab => (
                                            <label key={slab} className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={slabFilters.includes(slab)}
                                                    onChange={() => toggleSlab(slab)}
                                                    className="w-4 h-4 rounded accent-amber-600"
                                                />
                                                <span className="text-xs font-medium text-slate-600">{slab}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Include Imprest Toggle */}
                            <div>
                                <label className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={includeImprest}
                                        onChange={(e) => setIncludeImprest(e.target.checked)}
                                        className="w-4 h-4 rounded accent-amber-600"
                                    />
                                    <span className="text-xs font-bold text-slate-600">Include Imprest</span>
                                </label>
                            </div>

                            <button
                                onClick={handleSearch}
                                disabled={searching}
                                className="w-full py-3.5 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                Filter Students
                            </button>
                        </div>
                    </div>

                    {/* Students List */}
                    <div className="lg:col-span-3 space-y-5">
                        {!students.length && !searching && (
                            <div className="py-20 flex flex-col items-center text-slate-300 gap-4 bg-white rounded-[2rem] border border-slate-100">
                                <Filter size={48} className="text-slate-200" />
                                <span className="text-sm font-bold">Apply filters and click "Filter Students"</span>
                            </div>
                        )}

                        {searching && (
                            <div className="py-20 flex flex-col items-center text-slate-300 gap-4">
                                <Loader2 size={40} className="animate-spin text-amber-500" />
                                <span className="text-xs font-black uppercase tracking-widest">Loading...</span>
                            </div>
                        )}

                        {students.length > 0 && !searching && (
                            <>
                                {/* Summary */}
                                {summary && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Students</p>
                                            <p className="text-xl font-black text-slate-800 font-outfit">{summary.total_students}</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                                            <p className="text-xl font-black text-slate-800 font-outfit">₹{summary.total_amount.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Already Paid</p>
                                            <p className="text-xl font-black text-emerald-600 font-outfit">₹{summary.total_paid.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Due</p>
                                            <p className="text-xl font-black text-amber-600 font-outfit">₹{summary.total_due.toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Select All */}
                                <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={students.length > 0 && selectedIds.length === students.length}
                                            onChange={toggleSelectAll}
                                            className="w-5 h-5 rounded accent-amber-600"
                                        />
                                        <span className="font-bold text-slate-700 text-sm">Select All Students</span>
                                    </label>
                                    <span className="text-xs font-bold text-amber-600">
                                        {getSelectedCount()} selected | ₹{selectedSum.toLocaleString()}
                                    </span>
                                </div>

                                {/* Student List */}
                                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="py-3 px-4 w-12"></th>
                                                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                                                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Class/Section</th>
                                                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Scheme</th>
                                                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                                                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Paid</th>
                                                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Due</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map(student => (
                                                <tr
                                                    key={student.id}
                                                    className={`border-b border-slate-50 transition-all cursor-pointer hover:bg-slate-50/50 ${selectedIds.includes(student.id) ? 'bg-amber-50/30' : ''}`}
                                                    onClick={() => toggleStudent(student.id)}
                                                >
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(student.id)}
                                                            onChange={() => toggleStudent(student.id)}
                                                            className="w-4 h-4 rounded accent-amber-600"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                                                        <p className="text-[10px] text-slate-400">ENR: {student.enrollment_no || '—'}</p>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-slate-600 font-medium">{student.class} - {student.section}</td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-[10px] text-slate-500">
                                                            {student.schemes?.join(', ') || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-slate-700">₹{student.total_amount.toLocaleString()}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{student.already_paid.toLocaleString()}</td>
                                                    <td className="py-3 px-4 text-right font-black text-amber-700">₹{student.due_amount.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Bottom Actions */}
                                {getSelectedCount() > 0 && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleDownloadPdf}
                                            disabled={generatingPdf}
                                            className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 disabled:opacity-50 shadow-xl shadow-amber-100 transition-all flex items-center gap-3"
                                        >
                                            {generatingPdf ? (
                                                <><Loader2 size={18} className="animate-spin" /> Generating PDF...</>
                                            ) : (
                                                <><Printer size={18} /> Download Payslips PDF ({getSelectedCount()})</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeeBillSlip;