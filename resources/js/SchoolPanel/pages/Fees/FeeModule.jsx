import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Wallet, Search } from 'lucide-react';

// Master Components
import FeeHeadList from './components/FeeHeadList';
import BillSchemeList from './components/BillSchemeList';
import ConcessionList from './components/ConcessionList';
import FineList from './components/FineList';
import BankList from './components/BankList';

// Operations Components
import FeeChargeList from './components/FeeChargeList';
import FeeReceiptWizard from './components/FeeReceiptWizard';
import FeeReceiptList from './components/FeeReceiptList';
import FeeBillSlip from './components/FeeBillSlip';
import BillBookList from './components/BillBookList';

// Report Components
import FeeChargeReport from './components/FeeChargeReport';
import FeeDueReport from './components/FeeDueReport';
import FeeCancelledReport from './components/FeeCancelledReport';
import FeeCertificate from './components/FeeCertificate';
import ConcessionReport from './components/ConcessionReport';
import FeeHeadwiseReport from './components/FeeHeadwiseReport';

const FeeModule = () => {
    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-2xl shadow-emerald-200">
                        <Wallet size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Fee Management</h1>
                        <p className="text-slate-400 text-sm font-medium">Financial operations, billing, and fee configurations.</p>
                    </div>
                </div>
                <div className="relative group min-w-[320px]">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" />
                    <input type="text" placeholder="Search fees, receipts, students..." className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-8 focus:ring-emerald-50 focus:border-emerald-500 transition-all shadow-sm" />
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-[0_40px_100px_rgb(0,0,0,0.03)] border border-slate-100 min-h-[500px]">
                <Routes>
                    {/* Master Routes */}
                    <Route path="/heads" element={<FeeHeadList />} />
                    <Route path="/bill-schemes" element={<BillSchemeList />} />
                    <Route path="/concessions" element={<ConcessionList />} />
                    <Route path="/fines" element={<FineList />} />
                    <Route path="/banks" element={<BankList />} />

                    {/* Operations Routes */}
                    <Route path="/charges" element={<FeeChargeList />} />
                    <Route path="/receipt-wizard" element={<FeeReceiptWizard />} />
                    <Route path="/receipts" element={<FeeReceiptList />} />
                    <Route path="/bill-slips" element={<FeeBillSlip />} />
                    <Route path="/bill-books" element={<BillBookList />} />

                    {/* Report Routes */}
                    <Route path="/reports/charges" element={<FeeChargeReport />} />
                    <Route path="/reports/due" element={<FeeDueReport />} />
                    <Route path="/reports/cancelled" element={<FeeCancelledReport />} />
                    <Route path="/reports/certificate" element={<FeeCertificate />} />
                    <Route path="/reports/concessions" element={<ConcessionReport />} />
                    <Route path="/reports/headwise" element={<FeeHeadwiseReport />} />

                    {/* Default */}
                    <Route path="*" element={<FeePlaceholder />} />
                </Routes>
            </div>
        </div>
    );
};

const FeePlaceholder = () => (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-200 border border-emerald-100">
            <Wallet size={48} className="animate-pulse" />
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-800 font-outfit">Fee Module</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium">Select an option from the sidebar to manage fee operations.</p>
        </div>
    </div>
);

export default FeeModule;