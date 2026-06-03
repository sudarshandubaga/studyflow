import React, { useState } from 'react';
import { 
    Search, 
    Hash, 
    User, 
    Calendar, 
    Phone, 
    CreditCard, 
    Layers,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Printer,
    Download
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useSession } from '../../../context/SessionContext';
import { useBranch } from '../../../context/BranchContext';

const RegistrationForm = () => {
    const { selectedSession } = useSession();
    const { selectedBranch } = useBranch();
    
    const [formNo, setFormNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [prospectus, setProspectus] = useState(null);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!formNo) return;

        try {
            setLoading(true);
            setError(null);
            const response = await api.get('prospectus/find-by-form', {
                params: { form_no: formNo }
            });
            setProspectus(response.data);
        } catch (err) {
            setError('No prospectus found with this Form Number.');
            setProspectus(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        try {
            setLoading(true);
            await api.put(`prospectus/${prospectus.id}`, {
                ...prospectus,
                status: 'Registered'
            });
            toast.success('Student Registered Successfully!');
            // Refresh local state
            setProspectus({ ...prospectus, status: 'Registered' });
        } catch (err) {
            toast.error('Failed to complete registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search Section */}
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                        <Search size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 font-outfit">Student Registration</h2>
                        <p className="text-slate-500 font-medium text-sm">Enter the prospectus form number to proceed.</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Hash size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Enter Form Number (e.g. 2025-001)" 
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-slate-700 text-lg shadow-sm"
                            value={formNo}
                            onChange={(e) => setFormNo(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="px-10 py-4 bg-slate-900 text-white rounded-[1.25rem] font-black text-sm hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Find Prospectus
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm animate-in shake duration-500">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}
            </div>

            {/* Result Section */}
            {prospectus && (
                <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.06)] border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-500">
                    {/* Status Badge */}
                    <div className={`absolute top-8 right-8 px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-sm ${
                        prospectus.status === 'Registered' 
                            ? 'bg-green-100 text-green-600 border border-green-200' 
                            : 'bg-blue-100 text-blue-600 border border-blue-200'
                    }`}>
                        {prospectus.status}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Left Column: Student Details */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-3xl bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center text-slate-400">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 font-outfit uppercase tracking-tight">{prospectus.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                        <Layers size={14} className="text-blue-500" />
                                        Applying for {prospectus.class?.name || 'Unknown Class'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Father's Name</p>
                                        <p className="text-base font-bold text-slate-700">{prospectus.father_name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Number</p>
                                        <p className="text-base font-bold text-slate-700">{prospectus.mobile_no}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Payment Details */}
                        <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 space-y-8">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <CreditCard size={14} />
                                Payment Summary
                            </h4>

                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-bold">Total Amount Paid</span>
                                    <span className="text-2xl font-black text-slate-900 font-outfit">₹{parseFloat(prospectus.total_amount).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-bold">Payment Mode</span>
                                    <span className="bg-white px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-black text-slate-600 shadow-sm">{prospectus.payment_mode}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-bold">Payment Date</span>
                                    <span className="text-slate-900 font-bold">{new Date(prospectus.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                                {prospectus.reference_number && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-bold">Reference No.</span>
                                        <span className="text-slate-900 font-bold">{prospectus.reference_number}</span>
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-slate-200 w-full"></div>

                            {prospectus.status === 'Registered' ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-center gap-2 text-green-600 font-black text-sm uppercase tracking-widest bg-green-50 py-3 rounded-2xl border border-green-100">
                                        <CheckCircle2 size={18} />
                                        Registration Complete
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm">
                                            <Printer size={16} />
                                            Print Receipt
                                        </button>
                                        <button className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm">
                                            <Download size={16} />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleRegister}
                                    disabled={loading}
                                    className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-black text-base hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Complete Registration
                                            <CheckCircle2 size={20} />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationForm;
