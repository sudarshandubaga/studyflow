import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, AlertCircle, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeeDueReport = () => {
    const [data, setData] = useState({ data: [], summary: {} });
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterClass, setFilterClass] = useState('');

    useEffect(() => { fetchClasses(); fetchReport(); }, []);

    const fetchClasses = async () => {
        try { const res = await api.get('classes'); setClasses(Array.isArray(res.data) ? res.data : []); } catch {}
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('fee-receipts/due-report', { params: filterClass ? { class_id: filterClass } : {} });
            setData(res.data || { data: [], summary: {} });
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchReport(); }, [filterClass]);
    const { summary } = data;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-rose-500 to-pink-400 text-white flex items-center justify-center shadow-lg shadow-rose-200"><AlertCircle size={28} /></div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Fee Due Report</h3>
                        <p className="text-sm text-slate-400 font-medium">Students with outstanding fee balances.</p>
                    </div>
                </div>
                <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none">
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border bg-rose-50 text-rose-700 border-rose-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Due</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">₹{(summary?.total_due || 0).toLocaleString()}</h4>
                </div>
                <div className="p-5 rounded-2xl border bg-blue-50 text-blue-700 border-blue-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Charged</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">₹{(summary?.total_charged || 0).toLocaleString()}</h4>
                </div>
                <div className="p-5 rounded-2xl border bg-emerald-50 text-emerald-700 border-emerald-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Paid</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">₹{(summary?.total_paid || 0).toLocaleString()}</h4>
                </div>
                <div className="p-5 rounded-2xl border bg-amber-50 text-amber-700 border-amber-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Students With Due</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">{summary?.students_with_due || 0}</h4>
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5"><Loader2 size={40} className="animate-spin text-rose-500" /> Generating...</div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">#</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Class</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Charged</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Paid</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Due Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.data || []).map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="py-4 px-6 text-slate-400 text-sm">{idx + 1}</td>
                                    <td className="py-4 px-6 font-bold text-slate-800">{item.charge?.student?.name || '—'}</td>
                                    <td className="py-4 px-6 text-slate-600 text-sm">{item.charge?.edu_class?.name || '—'}</td>
                                    <td className="py-4 px-6 text-right font-bold text-slate-700">₹{parseFloat(item.total_charged).toLocaleString()}</td>
                                    <td className="py-4 px-6 text-right font-bold text-emerald-600">₹{parseFloat(item.total_paid).toLocaleString()}</td>
                                    <td className="py-4 px-6 text-right font-black text-rose-600">₹{parseFloat(item.due_amount).toLocaleString()}</td>
                                </tr>
                            ))}
                            {(data.data || []).length === 0 && (
                                <tr><td colSpan={6} className="py-24 text-center text-slate-400 font-bold">No due records found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FeeDueReport;
