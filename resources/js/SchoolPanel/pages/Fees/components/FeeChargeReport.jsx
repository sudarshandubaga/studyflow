import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Search, Download, BarChart3, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeeChargeReport = () => {
    const [data, setData] = useState({ charges: [], summary: {} });
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterClass, setFilterClass] = useState('');

    useEffect(() => { fetchClasses(); fetchReport(); }, []);

    const fetchClasses = async () => {
        try { const res = await api.get('classes'); setClasses(Array.isArray(res.data) ? res.data : []); }
        catch { /* silent */ }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('fee-charges/report', { params: filterClass ? { class_id: filterClass } : {} });
            setData(res.data || { charges: [], summary: {} });
        } catch { toast.error('Failed to load report'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchReport(); }, [filterClass]);

    const { summary } = data;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-200"><BarChart3 size={28} /></div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Fee Charge Report</h3>
                        <p className="text-sm text-slate-400 font-medium">Summary of all fee charges applied.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none">
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border bg-emerald-50 text-emerald-700 border-emerald-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Charged</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">₹{(summary?.total_charged || 0).toLocaleString()}</h4>
                </div>
                <div className="p-5 rounded-2xl border bg-violet-50 text-violet-700 border-violet-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Concession</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">₹{(summary?.total_concession || 0).toLocaleString()}</h4>
                </div>
                <div className="p-5 rounded-2xl border bg-blue-50 text-blue-700 border-blue-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Net Amount</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">₹{(summary?.total_net || 0).toLocaleString()}</h4>
                </div>
                <div className="p-5 rounded-2xl border bg-amber-50 text-amber-700 border-amber-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Records</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">{summary?.total_records || 0}</h4>
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5"><Loader2 size={40} className="animate-spin text-emerald-500" /> Generating report...</div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">#</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Scheme</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Class</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Concession</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Net Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.charges || []).map((c, idx) => (
                                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="py-4 px-6 text-slate-400 text-sm">{idx + 1}</td>
                                    <td className="py-4 px-6 font-bold text-slate-800">{c.bill_scheme?.name || '—'}</td>
                                    <td className="py-4 px-6 text-slate-600 text-sm">{c.edu_class?.name || '—'} {c.section?.name ? `/ ${c.section.name}` : ''}</td>
                                    <td className="py-4 px-6 text-slate-600 text-sm font-outfit">
                                        {c.student ? (
                                            <div>
                                                <p className="font-bold text-slate-800 leading-tight">{c.student.name || `${c.student.first_name || ''} ${c.student.last_name || ''}`.trim()}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">ENR: {c.student.enrollment_no || '—'}</p>
                                            </div>
                                        ) : '—'}
                                    </td>
                                    <td className="py-4 px-6"><span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-slate-50 text-slate-600 border border-slate-100">{c.charge_type}</span></td>
                                    <td className="py-4 px-6 text-right font-bold text-slate-700">₹{parseFloat(c.total_amount).toLocaleString()}</td>
                                    <td className="py-4 px-6 text-right font-bold text-violet-600">{parseFloat(c.concession_amount) > 0 ? `₹${parseFloat(c.concession_amount).toLocaleString()}` : '—'}</td>
                                    <td className="py-4 px-6 text-right font-black text-emerald-700">₹{parseFloat(c.net_amount).toLocaleString()}</td>
                                </tr>
                            ))}
                            {(data.charges || []).length === 0 && (
                                <tr><td colSpan={8} className="py-24 text-center text-slate-400 font-bold">No charge data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FeeChargeReport;
