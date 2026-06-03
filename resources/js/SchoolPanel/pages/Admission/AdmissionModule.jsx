import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ClipboardList, UserCheck, ShieldCheck, HelpCircle } from 'lucide-react';
import ProspectusList from './components/ProspectusList';
import RegistrationForm from './components/RegistrationForm';

const AdmissionModule = () => {
    const location = useLocation();
    
    const tabs = [
        { name: 'Prospectus', icon: ClipboardList, path: '/school-panel/admission' },
        { name: 'Registration', icon: UserCheck, path: '/school-panel/admission/registration' },
    ];

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 text-blue-600 p-2.5 rounded-2xl shadow-sm border border-blue-50">
                            <ClipboardList size={22} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Admission Control Center</h1>
                    </div>
                    <p className="text-slate-500 font-bold ml-1 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-blue-400" />
                        Manage your student enrollment lifecycle and prospectus tracking.
                    </p>
                </div>
                
                <div className="flex items-center bg-white p-1.5 rounded-[1.25rem] shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100 w-fit">
                    {tabs.map((tab) => {
                        const isActive = location.pathname === tab.path;
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.name}
                                to={tab.path}
                                className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-sm font-black transition-all transform ${
                                    isActive 
                                        ? 'bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-200 -translate-y-0.5' 
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                            >
                                <Icon size={18} strokeWidth={2.5} />
                                {tab.name}
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-white p-10 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.03)] border border-slate-100 min-h-[500px] relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <HelpCircle size={120} />
                </div>

                <div className="">
                    <Routes>
                        <Route path="/" element={<ProspectusList />} />
                        <Route path="/registration" element={<RegistrationForm />} />
                    </Routes>
                </div>
            </div>
            
            {/* Footer Stats/Info (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <ClipboardList size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enquiries</p>
                        <p className="text-xl font-bold text-slate-800">Track Pipeline</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                        <UserCheck size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrations</p>
                        <p className="text-xl font-bold text-slate-800">Confirm Students</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admissions</p>
                        <p className="text-xl font-bold text-slate-800">Process Ready</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdmissionModule;
