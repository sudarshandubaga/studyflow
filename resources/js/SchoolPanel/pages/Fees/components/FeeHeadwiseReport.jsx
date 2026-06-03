import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, PieChart } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeeHeadwiseReport = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => { fetchReport(); }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = {};
            if (fromDate && toDate) { params.from_date = fromDate; params.to_date = toDate; }
            const res = await api.get('fee-receipts/headwise-report', { params });
            setData(Array.isArray(res.data) ? res.data : []);
        } catch { toast.error('Failed'); }
        finally { setLoading(false); }
    };

    const totalCollected = data.reduce((s, d) => s + parseFloat(d.total_collected || 0), 0);
    const totalFine = data.reduce((s, d) => s + parseFloat(d.total_fine || 0), 0);

    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-200"><PieChart size={28} /></div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Headwise Report</h3>
                        <p className="text-sm text-slate-400 font-medium">Collection breakdown by fee heads.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none" />
                    <span className="text-slate-400 font-bold">to</span>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none" />
                    <button onClick={fetchReport} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all">Filter</button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border bg-emerald-50 text-emerald-700 border-emerald-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Collected</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">₹{totalCollected.toLocaleString()}</h4>
                </div>
                <div className="p-5 rounded-2xl border bg-rose-50 text-rose-700 border-rose-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Fine Collected</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">₹{totalFine.toLocaleString()}</h4>
                </div>
                <div className="p-5 rounded-2xl border bg-blue-50 text-blue-700 border-blue-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Fee Heads</p>
                    <h4 className="text-2xl font-black font-outfit mt-1">{data.length}</h4>
                </div>
            </div>

            {/* Visual Bar Distribution */}
            {data.length > 0 && totalCollected > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Collection Distribution</span>
                    <div className="flex w-full h-8 rounded-full overflow-hidden">
                        {data.map((d, idx) => {
                            const pct = (parseFloat(d.total_collected) / totalCollected) * 100;
                            return pct > 0 ? (
                                <div key={idx} className={`${colors[idx % colors.length]} h-full transition-all relative group`} style={{ width: `${pct}%` }}
                                    title={`${d.fee_head?.name}: ₹${parseFloat(d.total_collected).toLocaleString()} (${pct.toFixed(1)}%)`}>
                                </div>
                            ) : null;
                        })}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4">
                        {data.map((d, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                                {d.fee_head?.name} ({((parseFloat(d.total_collected) / totalCollected) * 100).toFixed(1)}%)
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5"><Loader2 size={40} className="animate-spin text-blue-500" /> Loading...</div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">#</th>
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Fee Head</th>
                                <th className="py-4 px-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Receipts</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Collected</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Fine</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Concession</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((d, idx) => (
                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="py-4 px-6">
                                        <div className={`w-4 h-4 rounded-full ${colors[idx % colors.length]}`} />
                                    </td>
                                    <td className="py-4 px-6 font-bold text-slate-800 font-outfit">{d.fee_head?.name || '—'}</td>
                                    <td className="py-4 px-6 text-center font-bold text-slate-500">{d.receipt_count}</td>
                                    <td className="py-4 px-6 text-right font-black text-emerald-700">₹{parseFloat(d.total_collected).toLocaleString()}</td>
                                    <td className="py-4 px-6 text-right font-bold text-rose-500">{parseFloat(d.total_fine) > 0 ? `₹${parseFloat(d.total_fine).toLocaleString()}` : '—'}</td>
                                    <td className="py-4 px-6 text-right font-bold text-violet-500">{parseFloat(d.total_concession) > 0 ? `₹${parseFloat(d.total_concession).toLocaleString()}` : '—'}</td>
                                    <td className="py-4 px-6 text-right font-bold text-slate-500">{totalCollected > 0 ? `${((parseFloat(d.total_collected) / totalCollected) * 100).toFixed(1)}%` : '—'}</td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr><td colSpan={7} className="py-24 text-center text-slate-400 font-bold">No headwise data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FeeHeadwiseReport;
