import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Percent } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ConcessionReport = () => {
    const [charges, setCharges] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchReport(); }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('fee-charges', { params: { status: 'Active' } });
            const data = Array.isArray(res.data) ? res.data.filter(c => parseFloat(c.concession_amount) > 0) : [];
            setCharges(data);
        } catch { toast.error('Failed'); }
        finally { setLoading(false); }
    };

    const totalConcession = charges.reduce((s, c) => s + parseFloat(c.concession_amount || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-violet-600 to-purple-400 text-white flex items-center justify-center shadow-lg shadow-violet-200"><Percent size={28} /></div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Concession Report</h3>
                        <p className="text-sm text-slate-400 font-medium">Summary of all concessions applied to fee charges.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border bg-violet-50 text-violet-700 border-violet-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Concession Given</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">₹{totalConcession.toLocaleString()}</h4>
                </div>
                <div className="p-5 rounded-2xl border bg-blue-50 text-blue-700 border-blue-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Students with Concessions</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">{charges.length}</h4>
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5"><Loader2 size={40} className="animate-spin text-violet-500" /> Loading...</div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">#</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Scheme</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Class</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Concession</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Original</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Concession Amt</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {charges.map((c, idx) => (
                                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="py-4 px-6 text-slate-400 text-sm">{idx + 1}</td>
                                    <td className="py-4 px-6 font-bold text-slate-800">{c.bill_scheme?.name || '—'}</td>
                                    <td className="py-4 px-6 text-slate-600 text-sm">{c.edu_class?.name || '—'}</td>
                                    <td className="py-4 px-6"><span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-violet-50 text-violet-600 border border-violet-100">{c.concession?.name || '—'}</span></td>
                                    <td className="py-4 px-6 text-right font-bold text-slate-700">₹{parseFloat(c.total_amount).toLocaleString()}</td>
                                    <td className="py-4 px-6 text-right font-black text-violet-600">₹{parseFloat(c.concession_amount).toLocaleString()}</td>
                                    <td className="py-4 px-6 text-right font-black text-emerald-700">₹{parseFloat(c.net_amount).toLocaleString()}</td>
                                </tr>
                            ))}
                            {charges.length === 0 && (
                                <tr><td colSpan={7} className="py-24 text-center text-slate-400 font-bold">No concessions applied</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ConcessionReport;
