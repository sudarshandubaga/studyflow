import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, Search, X, Check, CheckSquare, Square, Percent, ToggleLeft, ToggleRight, Users, GraduationCap } from 'lucide-react';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { toast } from 'react-hot-toast';

const ConcessionList = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();

    const [concessions, setConcessions] = useState([]);
    const [heads, setHeads] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingConcession, setEditingConcession] = useState(null);
    const [studentSearch, setStudentSearch] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        details: [{ fee_head_id: '', amount_type: 'value', amount_value: '' }],
        student_ids: []
    });

    useEffect(() => {
        if (selectedBranch && selectedSession) {
            fetchConcessions();
            fetchHeads();
            fetchStudents();
        }
    }, [selectedBranch, selectedSession]);

    const fetchConcessions = async () => {
        setLoading(true);
        try {
            const res = await api.get('fee-concessions', {
                params: { branch_id: selectedBranch.id, session_id: selectedSession.id }
            });
            setConcessions(res.data);
        } catch { toast.error('Failed to load concessions'); }
        setLoading(false);
    };

    const fetchHeads = async () => {
        const res = await api.get('fee-heads', { params: { branch_id: selectedBranch.id, session_id: selectedSession.id } });
        setHeads(res.data);
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get('students', { params: { branch_id: selectedBranch.id } });
            setStudents(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch { toast.error('Failed to load students'); }
    };

    const addDetailRow = () => {
        setFormData({ ...formData, details: [...formData.details, { fee_head_id: '', amount_type: 'value', amount_value: '' }] });
    };

    const removeDetailRow = (index) => {
        const newDetails = [...formData.details];
        newDetails.splice(index, 1);
        setFormData({ ...formData, details: newDetails });
    };

    const toggleStudentSelection = (id) => {
        const current = [...formData.student_ids];
        if (current.includes(id)) {
            setFormData({ ...formData, student_ids: current.filter(i => i !== id) });
        } else {
            setFormData({ ...formData, student_ids: [...current, id] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            branch_id: selectedBranch.id,
            session_id: selectedSession.id
        };

        try {
            if (editingConcession) {
                await api.put(`fee-concessions/${editingConcession.id}`, payload);
                toast.success('Updated');
            } else {
                await api.post('fee-concessions', payload);
                toast.success('Created');
            }
            fetchConcessions();
            handleCloseModal();
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Error saving concession'); 
        }
    };

    const handleEdit = (con) => {
        setEditingConcession(con);
        setFormData({
            name: con.name,
            details: con.details.map(d => ({ fee_head_id: d.fee_head_id, amount_type: d.amount_type, amount_value: d.amount_value })),
            student_ids: con.students.map(s => s.student_id)
        });
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingConcession(null);
        setFormData({ name: '', details: [{ fee_head_id: '', amount_type: 'value', amount_value: '' }], student_ids: [] });
        setStudentSearch('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Concessions & Assignments</h2>
                <button onClick={() => setShowAddModal(true)} className="bg-violet-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-violet-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-violet-100">
                    <Plus size={18} /> New Concession
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {concessions.map(c => (
                    <div key={c.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-500 transition-colors">
                                <Percent size={24} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(c)} className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100"><PenBox size={16} /></button>
                                <button onClick={() => { }} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100"><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <h3 className="font-black text-slate-800 text-lg mb-4 leading-tight">{c.name}</h3>

                        <div className="space-y-3">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Applied Heads</div>
                            {c.details.map(d => (
                                <div key={d.id} className="flex justify-between items-center text-sm font-bold text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                                    <span>{d.head?.name}</span>
                                    <span className="text-violet-600 italic">
                                        {d.amount_type === 'percentage' ? `${d.amount_value}%` : `₹${parseFloat(d.amount_value).toLocaleString()}`}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-dashed border-slate-100 flex gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-violet-500 uppercase tracking-widest bg-violet-50 px-3 py-1.5 rounded-full">
                                <Users size={12} /> {c.students.length} Students Assigned
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
                        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-3">
                                    <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center"><Percent size={18} /></div>
                                    {editingConcession ? 'Edit Concession' : 'Create Concession'}
                                </h3>
                            </div>
                            <button onClick={handleCloseModal} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-600 border border-slate-100"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10">
                            <div className="grid grid-cols-12 gap-10">
                                {/* Left: Configure Concession */}
                                <div className="col-span-7 space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Concession Name</label>
                                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-4 rounded-2xl text-sm font-bold focus:border-violet-500 outline-none transition-all shadow-inner" placeholder="Staff Child Discount..." />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                                            Multiple Head Entries
                                            <button type="button" onClick={addDetailRow} className="text-violet-600 flex items-center gap-1 hover:underline"><Plus size={14} /> Add Head</button>
                                        </label>
                                        {formData.details.map((detail, idx) => (
                                            <div key={idx} className="flex gap-4 p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl items-end relative">
                                                <div className="flex-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fee Head</label>
                                                    <select required value={detail.fee_head_id} onChange={e => {
                                                        const newD = [...formData.details];
                                                        newD[idx].fee_head_id = e.target.value;
                                                        setFormData({ ...formData, details: newD });
                                                    }} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-violet-500">
                                                        <option value="">Select Head</option>
                                                        {heads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="w-32">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Type</label>
                                                    <select value={detail.amount_type} onChange={e => {
                                                        const newD = [...formData.details];
                                                        newD[idx].amount_type = e.target.value;
                                                        setFormData({ ...formData, details: newD });
                                                    }} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-violet-500">
                                                        <option value="percentage">%</option>
                                                        <option value="value">Fixed</option>
                                                    </select>
                                                </div>
                                                <div className="w-32">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Value</label>
                                                    <input type="number" step="0.01" required value={detail.amount_value} onChange={e => {
                                                        const newD = [...formData.details];
                                                        newD[idx].amount_value = e.target.value;
                                                        setFormData({ ...formData, details: newD });
                                                    }} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-violet-500" placeholder="0.00" />
                                                </div>
                                                {formData.details.length > 1 && (
                                                    <button type="button" onClick={() => removeDetailRow(idx)} className="p-2 text-rose-400 hover:text-rose-600 mb-1"><X size={20} /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right: Assign Students */}
                                <div className="col-span-5 space-y-6 border-l border-slate-100 pl-10">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block underline decoration-violet-500/30">Assign Students</label>
                                    <div className="relative mb-4">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Search student..." 
                                            value={studentSearch}
                                            onChange={e => setStudentSearch(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 pl-11 pr-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:border-violet-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {students
                                            .filter(s => {
                                                const fullName = `${s.first_name} ${s.last_name || ''}`.toLowerCase();
                                                const search = studentSearch.toLowerCase();
                                                return fullName.includes(search) || s.enrollment_no?.toLowerCase().includes(search);
                                            })
                                            .map(s => (
                                            <button key={s.id} type="button" onClick={() => toggleStudentSelection(s.id)} className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${formData.student_ids.includes(s.id) ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[11px] font-black text-slate-300 border border-slate-100 uppercase tracking-tighter">
                                                        {s.first_name.charAt(0)}
                                                    </div>
                                                    <div className="text-left font-outfit">
                                                        <p className="text-[12px] font-black leading-tight text-slate-700">{s.first_name} {s.last_name}</p>
                                                        <p className="text-[10px] font-bold opacity-60">ENR: {s.enrollment_no}</p>
                                                    </div>
                                                </div>
                                                {formData.student_ids.includes(s.id) ? <Check size={18} strokeWidth={4} /> : <Plus size={18} className="opacity-40" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 px-10">
                            <div className="flex-1 flex items-center text-[11px] font-black text-slate-400 gap-6">
                                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-violet-500" /> {formData.details.length} Fee Heads</span>
                                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> {formData.student_ids.length} Students Assigned</span>
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={handleCloseModal} className="px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white transition-all">Cancel</button>
                                <button type="button" onClick={handleSubmit} className="bg-slate-900 text-white px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 italic">Save Concession</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConcessionList;
