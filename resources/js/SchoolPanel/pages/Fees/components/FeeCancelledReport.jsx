import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeeCancelledReport = () => {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => { fetchReport(); }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = {};
            if (fromDate && toDate) { params.from_date = fromDate; params.to_date = toDate; }
            const res = await api.get('fee-receipts/cancelled-report', { params });
            setReceipts(Array.isArray(res.data) ? res.data : []);
        } catch { toast.error('Failed'); }
        finally { setLoading(false); }
    };

    const totalCancelled = receipts.reduce((s, r) => s + parseFloat(r.paid_amount || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-rose-600 to-red-400 text-white flex items-center justify-center shadow-lg shadow-rose-200"><XCircle size={28} /></div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Cancelled Receipts</h3>
                        <p className="text-sm text-slate-400 font-medium">All voided and cancelled fee receipts.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none" />
                    <span className="text-slate-400 font-bold">to</span>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none" />
                    <button onClick={fetchReport} className="bg-rose-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all">Filter</button>
                </div>
            </div>

            <div className="p-5 rounded-2xl border bg-rose-50 text-rose-700 border-rose-100 w-fit">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Cancelled Amount</p>
                <h4 className="text-2xl font-black font-outfit mt-1">₹{totalCancelled.toLocaleString()}</h4>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5"><Loader2 size={40} className="animate-spin text-rose-500" /> Loading...</div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt#</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Cancelled By</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipts.map(r => (
                                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="py-4 px-6 font-black text-rose-600 font-mono text-sm">{r.receipt_no}</td>
                                    <td className="py-4 px-6 font-bold text-slate-800">{r.student?.name || `#${r.student_id}`}</td>
                                    <td className="py-4 px-6 text-slate-500 text-sm">{r.cancelled_at ? new Date(r.cancelled_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                    <td className="py-4 px-6 text-right font-black text-slate-800">₹{parseFloat(r.paid_amount).toLocaleString()}</td>
                                    <td className="py-4 px-6 text-slate-500 text-sm">{r.cancelled_by_user?.name || '—'}</td>
                                    <td className="py-4 px-6 text-slate-500 text-sm max-w-[200px] truncate">{r.cancel_reason || '—'}</td>
                                </tr>
                            ))}
                            {receipts.length === 0 && (
                                <tr><td colSpan={6} className="py-24 text-center text-slate-400 font-bold">No cancelled receipts</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FeeCancelledReport;
