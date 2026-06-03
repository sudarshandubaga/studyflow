import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Calendar, Layers, Hash, BookOpen, Users, ShieldCheck } from 'lucide-react';

import UsersList from './components/UsersList';


const MasterModule = () => {
    const location = useLocation();
    
    const tabs = [
        { name: 'Staff Users', icon: Users, path: '/school-panel/master' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-outfit tracking-tight">Academic Master</h1>
                    <p className="text-slate-500 text-sm font-medium">Manage subjects and primary user data.</p>
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex items-center bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.name}
                            to={tab.path}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                isActive 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.name}
                        </Link>
                    )
                })}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-h-[440px]">
                <Routes>
                    <Route path="/" element={<UsersList />} />
                </Routes>
            </div>
        </div>
    );
};

export default MasterModule;
