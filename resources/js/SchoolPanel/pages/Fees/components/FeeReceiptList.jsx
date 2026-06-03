import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, Search, X, Receipt, Eye, Ban, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeeReceiptList = () => {
    const [receipts, setReceipts] = useState([]);
    const [feeHeads, setFeeHeads] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [filterMode, setFilterMode] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [cancellingId, setCancellingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const [newReceipt, setNewReceipt] = useState({
        student_id: '', class_id: '', section_id: '', receipt_date: new Date().toISOString().split('T')[0],
        payment_mode: 'Cash', paid_amount: 0, fine_amount: 0, concession_amount: 0,
        cheque_no: '', cheque_date: '', bank_name: '', transaction_id: '', remarks: '', fee_bank_id: '', details: []
    });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [receiptRes, headRes, bankRes] = await Promise.all([
                api.get('fee-receipts'),
                api.get('fee-heads'),
                api.get('fee-banks'),
            ]);
            setReceipts(Array.isArray(receiptRes.data) ? receiptRes.data : []);
            setFeeHeads(Array.isArray(headRes.data) ? headRes.data.filter(h => h.is_active) : []);
            setBanks(Array.isArray(bankRes.data) ? bankRes.data.filter(b => b.is_active) : []);
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const addDetailRow = () => {
        setNewReceipt({ ...newReceipt, details: [...newReceipt.details, { fee_head_id: '', amount: 0, fine_amount: 0, concession_amount: 0, paid_amount: 0, installment_label: '' }] });
    };

    const updateDetail = (idx, field, value) => {
        const updated = [...newReceipt.details];
        updated[idx] = { ...updated[idx], [field]: value };
        if (field === 'amount' || field === 'fine_amount' || field === 'concession_amount') {
            updated[idx].paid_amount = (parseFloat(updated[idx].amount || 0) + parseFloat(updated[idx].fine_amount || 0) - parseFloat(updated[idx].concession_amount || 0));
        }
        setNewReceipt({ ...newReceipt, details: updated });
    };

    const removeDetail = (idx) => {
        setNewReceipt({ ...newReceipt, details: newReceipt.details.filter((_, i) => i !== idx) });
    };

    const handleAdd = async () => {
        if (!newReceipt.student_id || newReceipt.details.length === 0) return toast.error('Student and at least one detail required');
        setSaving(true);
        try {
            const totalAmount = newReceipt.details.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
            const totalFine = newReceipt.details.reduce((s, d) => s + parseFloat(d.fine_amount || 0), 0);
            const totalConcession = newReceipt.details.reduce((s, d) => s + parseFloat(d.concession_amount || 0), 0);
            const totalPaid = newReceipt.details.reduce((s, d) => s + parseFloat(d.paid_amount || 0), 0);

            const res = await api.post('fee-receipts', {
                ...newReceipt,
                total_amount: totalAmount,
                fine_amount: totalFine,
                concession_amount: totalConcession,
                paid_amount: totalPaid,
                branch_id: localStorage.getItem('selectedBranchId'),
                session_id: localStorage.getItem('selectedSessionId'),
            });
            setReceipts([res.data, ...receipts]);
            setNewReceipt({
                student_id: '', class_id: '', section_id: '', receipt_date: new Date().toISOString().split('T')[0],
                payment_mode: 'Cash', paid_amount: 0, fine_amount: 0, concession_amount: 0,
                cheque_no: '', cheque_date: '', bank_name: '', transaction_id: '', remarks: '', fee_bank_id: '', details: []
            });
            setIsAdding(false);
            toast.success(`Receipt ${res.data.receipt_no} created`);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleCancel = async (id) => {
        if (!cancelReason.trim()) return toast.error('Cancel reason is required');
        try {
            await api.post(`fee-receipts/${id}/cancel`, { cancel_reason: cancelReason });
            setReceipts(receipts.map(r => r.id === id ? { ...r, status: 'Cancelled' } : r));
            setCancellingId(null);
            setCancelReason('');
            toast.success('Receipt cancelled');
        } catch { toast.error('Failed'); }
    };

    const filtered = receipts.filter(r => {
        const matchSearch = (r.receipt_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchMode = !filterMode || r.payment_mode === filterMode;
        const matchStatus = !filterStatus || r.status === filterStatus;
        return matchSearch && matchMode && matchStatus;
    });

    const statusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-50 text-emerald-600';
            case 'Cancelled': return 'bg-rose-50 text-rose-600';
            case 'Bounced': return 'bg-amber-50 text-amber-600';
            default: return 'bg-slate-100 text-slate-400';
        }
    };

    const modeColor = (mode) => {
        switch (mode) {
            case 'Cash': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Cheque': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Online': return 'bg-violet-50 text-violet-600 border-violet-100';
            case 'DD': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-cyan-50 text-cyan-600 border-cyan-100';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-200"><Receipt size={28} /></div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Fee Receipts</h3>
                        <p className="text-sm text-slate-400 font-medium">Collect fees and generate receipts.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none">
                        <option value="">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <select value={filterMode} onChange={e => setFilterMode(e.target.value)} className="bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none">
                        <option value="">All Modes</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                        <option value="DD">DD</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-100 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none w-48 transition-all" />
                    </div>
                    {!isAdding && <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"><Plus size={18} /> New Receipt</button>}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Collected', value: `₹${receipts.filter(r => r.status === 'Paid').reduce((s, r) => s + parseFloat(r.paid_amount || 0), 0).toLocaleString()}`, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                    { label: 'Total Receipts', value: receipts.filter(r => r.status === 'Paid').length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                    { label: 'Cancelled', value: receipts.filter(r => r.status === 'Cancelled').length, color: 'bg-rose-50 text-rose-700 border-rose-100' },
                    { label: 'Today\'s Collection', value: `₹${receipts.filter(r => r.status === 'Paid' && r.receipt_date === new Date().toISOString().split('T')[0]).reduce((s, r) => s + parseFloat(r.paid_amount || 0), 0).toLocaleString()}`, color: 'bg-amber-50 text-amber-700 border-amber-100' },
                ].map((card, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border ${card.color}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{card.label}</p>
                        <h4 className="text-2xl font-black font-outfit mt-1">{card.value}</h4>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5"><Loader2 size={40} className="animate-spin text-blue-500" /> Loading...</div>
            ) : (
                <div className="space-y-4">
                    {isAdding && (
                        <div className="bg-white border-2 border-blue-600 rounded-[2rem] p-6 space-y-5 shadow-2xl shadow-blue-100 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">New Fee Receipt</span>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input type="number" placeholder="Student ID *" value={newReceipt.student_id} onChange={e => setNewReceipt({ ...newReceipt, student_id: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-500 text-sm" />
                                <input type="date" value={newReceipt.receipt_date} onChange={e => setNewReceipt({ ...newReceipt, receipt_date: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-500 text-sm" />
                                <select value={newReceipt.payment_mode} onChange={e => setNewReceipt({ ...newReceipt, payment_mode: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm">
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Online">Online</option>
                                    <option value="DD">DD</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                                <select value={newReceipt.fee_bank_id} onChange={e => setNewReceipt({ ...newReceipt, fee_bank_id: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm">
                                    <option value="">Select Bank (Optional)</option>
                                    {banks.map(b => <option key={b.id} value={b.id}>{b.bank_name}</option>)}
                                </select>
                            </div>
                            {(newReceipt.payment_mode === 'Cheque' || newReceipt.payment_mode === 'DD') && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input type="text" placeholder="Cheque/DD No." value={newReceipt.cheque_no} onChange={e => setNewReceipt({ ...newReceipt, cheque_no: e.target.value })}
                                        className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm" />
                                    <input type="date" value={newReceipt.cheque_date} onChange={e => setNewReceipt({ ...newReceipt, cheque_date: e.target.value })}
                                        className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm" />
                                    <input type="text" placeholder="Bank Name" value={newReceipt.bank_name} onChange={e => setNewReceipt({ ...newReceipt, bank_name: e.target.value })}
                                        className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm" />
                                </div>
                            )}
                            {newReceipt.payment_mode === 'Online' && (
                                <input type="text" placeholder="Transaction ID" value={newReceipt.transaction_id} onChange={e => setNewReceipt({ ...newReceipt, transaction_id: e.target.value })}
                                    className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm w-full" />
                            )}

                            {/* Detail Rows */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Details</span>
                                    <button onClick={addDetailRow} className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Plus size={14} /> Add Head</button>
                                </div>
                                {newReceipt.details.map((d, idx) => (
                                    <div key={idx} className="grid grid-cols-6 gap-3 items-center">
                                        <select value={d.fee_head_id} onChange={e => updateDetail(idx, 'fee_head_id', e.target.value)}
                                            className="bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none font-bold text-slate-700 text-sm col-span-2">
                                            <option value="">Select Fee Head</option>
                                            {feeHeads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                        </select>
                                        <input type="number" placeholder="Amount" value={d.amount} onChange={e => updateDetail(idx, 'amount', e.target.value)}
                                            className="bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none font-bold text-slate-700 text-sm" />
                                        <input type="number" placeholder="Fine" value={d.fine_amount} onChange={e => updateDetail(idx, 'fine_amount', e.target.value)}
                                            className="bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none font-bold text-slate-700 text-sm" />
                                        <div className="text-right font-black text-emerald-700 text-sm">₹{parseFloat(d.paid_amount || 0).toLocaleString()}</div>
                                        <button onClick={() => removeDetail(idx)} className="p-2 text-rose-400 hover:text-rose-600 justify-self-end"><X size={16} /></button>
                                    </div>
                                ))}
                                {newReceipt.details.length > 0 && (
                                    <div className="flex justify-end px-4 pt-2 border-t border-slate-100">
                                        <span className="font-black text-lg text-emerald-700 font-outfit">
                                            Total: ₹{newReceipt.details.reduce((s, d) => s + parseFloat(d.paid_amount || 0), 0).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <textarea placeholder="Remarks" value={newReceipt.remarks} onChange={e => setNewReceipt({ ...newReceipt, remarks: e.target.value })}
                                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm h-16 resize-none" />

                            <button onClick={handleAdd} disabled={saving || !newReceipt.student_id || newReceipt.details.length === 0}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 text-xs font-black uppercase tracking-widest">
                                {saving ? 'Generating...' : 'Generate Receipt'}
                            </button>
                        </div>
                    )}

                    {/* Receipts Table */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt#</th>
                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Mode</th>
                                    <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                    <th className="py-4 px-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => (
                                    <React.Fragment key={r.id}>
                                        <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                                            <td className="py-4 px-6 font-black text-blue-600 font-mono text-sm">{r.receipt_no}</td>
                                            <td className="py-4 px-6 font-bold text-slate-800">{r.student?.name || `#${r.student_id}`}</td>
                                            <td className="py-4 px-6 text-slate-500 text-sm font-medium">{new Date(r.receipt_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td className="py-4 px-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${modeColor(r.payment_mode)}`}>{r.payment_mode}</span></td>
                                            <td className="py-4 px-6 text-right font-black text-slate-800">₹{parseFloat(r.paid_amount).toLocaleString()}</td>
                                            <td className="py-4 px-6 text-center"><span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${statusColor(r.status)}`}>{r.status}</span></td>
                                            <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl"><Eye size={16} /></button>
                                                    {r.status === 'Paid' && <button onClick={() => setCancellingId(r.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-xl"><Ban size={16} /></button>}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === r.id && (
                                            <tr><td colSpan={7} className="px-6 py-4 bg-slate-50/50 animate-in fade-in duration-200">
                                                <div className="space-y-2">
                                                    {r.details?.map((d, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 text-sm">
                                                            <span className="font-bold text-slate-600">{d.fee_head?.name || 'Head'}</span>
                                                            <div className="flex items-center gap-4">
                                                                {parseFloat(d.fine_amount) > 0 && <span className="text-rose-500 text-xs font-bold">Fine: ₹{parseFloat(d.fine_amount).toLocaleString()}</span>}
                                                                <span className="font-black text-slate-800">₹{parseFloat(d.paid_amount).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {r.remarks && <p className="text-xs text-slate-400">Remarks: {r.remarks}</p>}
                                                    {r.cancel_reason && <p className="text-xs text-rose-500">Cancel Reason: {r.cancel_reason}</p>}
                                                </div>
                                            </td></tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={7} className="py-24 text-center text-slate-400 font-bold">No receipts found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {cancellingId && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center" onClick={() => setCancellingId(null)}>
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold text-lg text-slate-800 font-outfit">Cancel Receipt</h4>
                        <textarea autoFocus placeholder="Reason for cancellation *" value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm h-28 resize-none focus:border-rose-500" />
                        <div className="flex gap-3">
                            <button onClick={() => handleCancel(cancellingId)} disabled={!cancelReason.trim()}
                                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50">Confirm Cancel</button>
                            <button onClick={() => { setCancellingId(null); setCancelReason(''); }}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest">Go Back</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeeReceiptList;
