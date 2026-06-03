import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, Search, X, Check, Zap, Filter, Eye, Ban } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeeChargeList = () => {
    const [charges, setCharges] = useState([]);
    const [billSchemes, setBillSchemes] = useState([]);
    const [concessions, setConcessions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [filterClass, setFilterClass] = useState('');
    const [students, setStudents] = useState([]);
    const [studentSearch, setStudentSearch] = useState('');

    const [newCharge, setNewCharge] = useState({
        bill_scheme_id: '', class_id: '', section_id: '', charge_type: 'Class', concession_id: '', remarks: '', student_id: ''
    });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [chargeRes, schemeRes, classRes, concessionRes, studentRes] = await Promise.all([
                api.get('fee-charges'),
                api.get('bill-schemes'),
                api.get('classes'),
                api.get('fee-concessions'),
                api.get('students'),
            ]);
            setCharges(Array.isArray(chargeRes.data) ? chargeRes.data : []);
            setBillSchemes(Array.isArray(schemeRes.data) ? schemeRes.data : []);
            setClasses(Array.isArray(classRes.data) ? classRes.data : []);
            setConcessions(Array.isArray(concessionRes.data) ? concessionRes.data.filter(c => c.is_active) : []);
            setStudents(Array.isArray(studentRes.data) ? studentRes.data : (studentRes.data.data || []));
        } catch { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    };

    const fetchSections = async (classId) => {
        try {
            const res = await api.get('sections', { params: { class_id: classId } });
            setSections(Array.isArray(res.data) ? res.data : []);
        } catch { setSections([]); }
    };

    const handleClassChange = (classId) => {
        setNewCharge({ ...newCharge, class_id: classId, section_id: '' });
        if (classId) fetchSections(classId);
        else setSections([]);
    };

    const handleAdd = async () => {
        if (!newCharge.bill_scheme_id || !newCharge.class_id) return toast.error('Scheme and class are required');
        if (newCharge.charge_type === 'Individual' && !newCharge.student_id) return toast.error('Student is required for Individual charge');
        setSaving(true);
        try {
            const scheme = billSchemes.find(s => s.id == newCharge.bill_scheme_id);
            const totalAmount = (scheme?.details || []).reduce((s, d) => s + parseFloat(d.amount || 0), 0);
            let concessionAmount = 0;
            if (newCharge.concession_id) {
                const conc = concessions.find(c => c.id == newCharge.concession_id);
                if (conc) concessionAmount = conc.concession_type === 'Percentage' ? (totalAmount * conc.value / 100) : parseFloat(conc.value);
            }
            const netAmount = totalAmount - concessionAmount;

            const details = (scheme?.details || []).map(d => ({
                fee_head_id: d.fee_head_id,
                amount: parseFloat(d.amount),
                concession_amount: concessionAmount > 0 ? (parseFloat(d.amount) / totalAmount * concessionAmount) : 0,
                net_amount: parseFloat(d.amount) - (concessionAmount > 0 ? (parseFloat(d.amount) / totalAmount * concessionAmount) : 0),
                installment_label: d.installment_label,
                due_date: d.due_date,
            }));

            const res = await api.post('fee-charges', {
                ...newCharge,
                total_amount: totalAmount,
                concession_amount: concessionAmount,
                net_amount: netAmount,
                details,
                branch_id: localStorage.getItem('selectedBranchId'),
                session_id: localStorage.getItem('selectedSessionId'),
            });
            setCharges([res.data, ...charges]);
            setNewCharge({ bill_scheme_id: '', class_id: '', section_id: '', charge_type: 'Class', concession_id: '', remarks: '', student_id: '' });
            setStudentSearch('');
            setIsAdding(false);
            toast.success('Fee charge created');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this fee charge?')) return;
        try {
            await api.put(`fee-charges/${id}`, { status: 'Cancelled' });
            setCharges(charges.map(c => c.id === id ? { ...c, status: 'Cancelled' } : c));
            toast.success('Fee charge cancelled');
        } catch { toast.error('Failed'); }
    };

    const filteredStudentsForSelection = students.filter(s => {
        const matchesClass = !newCharge.class_id || s.section?.class_id == newCharge.class_id;
        const matchesSection = !newCharge.section_id || s.section_id == newCharge.section_id;
        const matchesSearch = !studentSearch ||
            `${s.first_name} ${s.middle_name || ''} ${s.last_name || ''}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
            (s.enrollment_no || '').toLowerCase().includes(studentSearch.toLowerCase());
        return matchesClass && matchesSection && matchesSearch;
    });

    const filtered = charges.filter(c => {
        const matchSearch = (c.bill_scheme?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.edu_class?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchClass = !filterClass || c.class_id == filterClass;
        return matchSearch && matchClass;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-200"><Zap size={28} /></div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Fee Charge</h3>
                        <p className="text-sm text-slate-400 font-medium">Assign fee schemes to classes and students.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                        className="bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none">
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-100 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-emerald-50 focus:border-emerald-500 outline-none w-56 transition-all" />
                    </div>
                    {!isAdding && <button onClick={() => setIsAdding(true)} className="bg-emerald-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"><Plus size={18} /> Charge Fee</button>}
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5"><Loader2 size={40} className="animate-spin text-emerald-500" /> Loading...</div>
            ) : (
                <div className="space-y-4">
                    {isAdding && (
                        <div className="bg-white border-2 border-emerald-600 rounded-[2rem] p-6 space-y-5 shadow-2xl shadow-emerald-100 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Create Fee Charge</span>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select value={newCharge.bill_scheme_id} onChange={e => setNewCharge({ ...newCharge, bill_scheme_id: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm">
                                    <option value="">Select Bill Scheme *</option>
                                    {billSchemes.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name} ({s.scheme_type})</option>)}
                                </select>
                                <select value={newCharge.class_id} onChange={e => handleClassChange(e.target.value)}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm">
                                    <option value="">Select Class *</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select value={newCharge.section_id} onChange={e => setNewCharge({ ...newCharge, section_id: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm">
                                    <option value="">All Sections</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select value={newCharge.charge_type} onChange={e => {
                                    setNewCharge({ ...newCharge, charge_type: e.target.value, student_id: '' });
                                    setStudentSearch('');
                                }}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm">
                                    <option value="Class">Charge by Class</option>
                                    <option value="Section">Charge by Section</option>
                                    <option value="Individual">Individual</option>
                                </select>
                                <select value={newCharge.concession_id} onChange={e => setNewCharge({ ...newCharge, concession_id: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm">
                                    <option value="">No Concession</option>
                                    {concessions.map(c => <option key={c.id} value={c.id}>{c.name} ({c.concession_type === 'Percentage' ? `${c.value}%` : `₹${c.value}`})</option>)}
                                </select>
                                <input type="text" placeholder="Remarks" value={newCharge.remarks} onChange={e => setNewCharge({ ...newCharge, remarks: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm" />
                            </div>

                            {newCharge.charge_type === 'Individual' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/20 p-5 rounded-3xl border-2 border-emerald-100/50">
                                    <div>
                                        <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1 mb-2 block">Search Student</label>
                                        <input type="text" placeholder="Type student name or enrollment no..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                                            className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1 mb-2 block">Select Student *</label>
                                        <select value={newCharge.student_id} onChange={e => setNewCharge({ ...newCharge, student_id: e.target.value })}
                                            className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-emerald-500 text-sm">
                                            <option value="">Select Student</option>
                                            {filteredStudentsForSelection.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name || `${s.first_name} ${s.last_name || ''}`} (ENR: {s.enrollment_no || '—'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Preview */}
                            {newCharge.bill_scheme_id && (
                                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-2">
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Charge Preview</span>
                                    {(() => {
                                        const scheme = billSchemes.find(s => s.id == newCharge.bill_scheme_id);
                                        const total = (scheme?.details || []).reduce((s, d) => s + parseFloat(d.amount || 0), 0);
                                        return (
                                            <div className="flex items-center gap-6 text-sm font-bold text-slate-700">
                                                <span>Scheme: <strong className="text-emerald-700">{scheme?.name}</strong></span>
                                                <span>Total: <strong className="text-emerald-700">₹{total.toLocaleString()}</strong></span>
                                                <span>Heads: <strong className="text-emerald-700">{scheme?.details?.length || 0}</strong></span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            <button onClick={handleAdd} disabled={saving || !newCharge.bill_scheme_id || !newCharge.class_id}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 text-xs font-black uppercase tracking-widest">
                                {saving ? 'Processing...' : 'Apply Fee Charge'}
                            </button>
                        </div>
                    )}

                    {/* Charges Table */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Scheme</th>
                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Class</th>
                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                    <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                                    <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Concession</th>
                                    <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Net</th>
                                    <th className="py-4 px-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(charge => (
                                    <React.Fragment key={charge.id}>
                                        <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => setExpandedId(expandedId === charge.id ? null : charge.id)}>
                                            <td className="py-4 px-6 font-bold text-slate-800 font-outfit">{charge.bill_scheme?.name || '—'}</td>
                                            <td className="py-4 px-6 text-slate-600 text-sm font-medium">{charge.edu_class?.name || '—'} {charge.section?.name ? `/ ${charge.section.name}` : ''}</td>
                                            <td className="py-4 px-6 text-slate-600 text-sm font-medium font-outfit">
                                                {charge.student ? (
                                                    <div>
                                                        <p className="font-bold text-slate-800 leading-tight">{charge.student.name || `${charge.student.first_name || ''} ${charge.student.last_name || ''}`.trim()}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">ENR: {charge.student.enrollment_no || '—'}</p>
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            <td className="py-4 px-6"><span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-slate-50 text-slate-600 border border-slate-100">{charge.charge_type}</span></td>
                                            <td className="py-4 px-6 text-right font-bold text-slate-700">₹{parseFloat(charge.total_amount).toLocaleString()}</td>
                                            <td className="py-4 px-6 text-right font-bold text-violet-600">{parseFloat(charge.concession_amount) > 0 ? `₹${parseFloat(charge.concession_amount).toLocaleString()}` : '—'}</td>
                                            <td className="py-4 px-6 text-right font-black text-emerald-700">₹{parseFloat(charge.net_amount).toLocaleString()}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${charge.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{charge.status}</span>
                                            </td>
                                            <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => setExpandedId(expandedId === charge.id ? null : charge.id)} className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl"><Eye size={16} /></button>
                                                    {charge.status === 'Active' && <button onClick={() => handleCancel(charge.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-xl"><Ban size={16} /></button>}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === charge.id && charge.details && (
                                            <tr><td colSpan={9} className="px-6 py-4 bg-slate-50/50">
                                                <div className="space-y-2 animate-in fade-in duration-200">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fee Head Breakdown</span>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {charge.details.map((d, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 text-sm">
                                                                <span className="font-bold text-slate-600">{d.fee_head?.name || 'Head'} {d.installment_label ? `(${d.installment_label})` : ''}</span>
                                                                <span className="font-black text-slate-800">₹{parseFloat(d.net_amount).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {charge.remarks && <p className="text-xs text-slate-400 mt-2">Remarks: {charge.remarks}</p>}
                                                </div>
                                            </td></tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={9} className="py-24 text-center text-slate-400 font-bold">No fee charges found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeeChargeList;
