import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Award, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeeCertificate = () => {
    const [studentId, setStudentId] = useState('');
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchStudentReceipts = async () => {
        if (!studentId) return toast.error('Enter a student ID');
        setLoading(true);
        try {
            const res = await api.get('fee-receipts', { params: { student_id: studentId, status: 'Paid' } });
            setReceipts(Array.isArray(res.data) ? res.data : []);
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const totalPaid = receipts.reduce((s, r) => s + parseFloat(r.paid_amount || 0), 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8 print:hidden">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-indigo-600 to-blue-400 text-white flex items-center justify-center shadow-lg shadow-indigo-200"><Award size={28} /></div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Fee Certificate</h3>
                        <p className="text-sm text-slate-400 font-medium">Generate fee payment certificate for a student.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <input type="number" placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)}
                        className="bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none w-48" />
                    <button onClick={fetchStudentReceipts} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">Generate</button>
                    {receipts.length > 0 && <button onClick={handlePrint} className="bg-slate-800 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2"><Printer size={16} /> Print</button>}
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5"><Loader2 size={40} className="animate-spin text-indigo-500" /> Generating...</div>
            ) : receipts.length > 0 ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-10 shadow-sm print:border-none print:shadow-none print:rounded-none">
                    {/* Certificate Header */}
                    <div className="text-center space-y-2 mb-10 border-b-2 border-slate-800 pb-6">
                        <h2 className="text-3xl font-black text-slate-900 font-outfit uppercase tracking-wider">Fee Payment Certificate</h2>
                        <p className="text-slate-500 text-sm font-medium">This is to certify the following fee payment records</p>
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 rounded-2xl print:bg-transparent print:p-0">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</span>
                            <p className="font-bold text-slate-800 font-outfit text-lg">{receipts[0]?.student?.name || `Student #${studentId}`}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class</span>
                            <p className="font-bold text-slate-800 font-outfit text-lg">{receipts[0]?.edu_class?.name || '—'}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Receipts</span>
                            <p className="font-bold text-slate-800 font-outfit text-lg">{receipts.length}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Paid</span>
                            <p className="font-black text-emerald-700 font-outfit text-2xl">₹{totalPaid.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Receipt Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-slate-800">
                                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Receipt#</th>
                                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Mode</th>
                                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipts.map(r => (
                                <tr key={r.id} className="border-b border-slate-100">
                                    <td className="py-3 px-4 font-mono font-bold text-sm">{r.receipt_no}</td>
                                    <td className="py-3 px-4 text-sm text-slate-600">{new Date(r.receipt_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td className="py-3 px-4 text-sm text-slate-600">{r.payment_mode}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-800">₹{parseFloat(r.paid_amount).toLocaleString()}</td>
                                </tr>
                            ))}
                            <tr className="border-t-2 border-slate-800">
                                <td colSpan={3} className="py-3 px-4 text-right font-black text-sm uppercase">Grand Total</td>
                                <td className="py-3 px-4 text-right font-black text-emerald-700 text-lg">₹{totalPaid.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Footer */}
                    <div className="flex justify-between items-end mt-16 pt-8 border-t border-slate-200">
                        <div className="text-center">
                            <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Signatory</span>
                        </div>
                        <div className="text-center">
                            <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Seal</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-24 text-center">
                    <Award size={64} className="text-slate-200 mb-4 mx-auto" />
                    <h5 className="font-bold text-slate-700 text-lg">Enter a Student ID to generate certificate</h5>
                    <p className="text-slate-400 text-sm mt-1">Certificate will show all paid receipts for the student</p>
                </div>
            )}
        </div>
    );
};

export default FeeCertificate;
