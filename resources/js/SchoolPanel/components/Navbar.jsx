import React from 'react';
import { Search, Bell, Mail, HelpCircle, ChevronDown, Calendar, School } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useBranch } from '../context/BranchContext';

const NavItem = ({ icon: Icon, badge, active = false }) => (
    <div className={`relative p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group`}>
        <Icon size={20} className={`text-slate-600 group-hover:text-blue-600 transition-colors`} />
        {badge && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {badge}
            </span>
        )}
    </div>
);

const Navbar = () => {
    const { sessions, selectedSession, setSelectedSession, loading: sessionLoading } = useSession();
    const { branches, selectedBranch, setSelectedBranch, loading: branchLoading, isOwner } = useBranch();

    return (
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-white/80">
            {/* Left Side: Branch & Session Selectors */}
            <div className="flex items-center gap-6 flex-1">
                {/* Global Branch Selector (Only for Owners) */}
                {isOwner && (
                    <div className="flex items-center gap-2 bg-emerald-50/50 px-3 py-2 rounded-xl border border-emerald-100/50 group transition-all hover:bg-emerald-50">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <School size={16} />
                        </div>
                        <div className="flex flex-col min-w-[140px]">
                            <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest leading-none mb-1 text-left">School Branch</span>
                            {branchLoading ? (
                                <div className="h-4 w-24 bg-emerald-100/50 animate-pulse rounded"></div>
                            ) : (
                                <div className="relative flex items-center">
                                    <select 
                                        value={selectedBranch?.id || ''}
                                        onChange={(e) => setSelectedBranch(branches.find(b => b.id == e.target.value))}
                                        className="bg-transparent border-none p-0 pr-4 text-xs font-bold text-slate-700 outline-none focus:ring-0 cursor-pointer appearance-none"
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={10} className="absolute right-0 text-emerald-400 pointer-events-none" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Global Session Selector */}
                <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-2 rounded-xl border border-blue-100/50 group transition-all hover:bg-blue-50">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <Calendar size={16} />
                    </div>
                    <div className="flex flex-col min-w-[120px]">
                        <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest leading-none mb-1 text-left">Academic Session</span>
                        {sessionLoading ? (
                            <div className="h-4 w-20 bg-blue-100/50 animate-pulse rounded"></div>
                        ) : (
                            <div className="relative flex items-center">
                                <select 
                                    value={selectedSession?.id || ''}
                                    onChange={(e) => setSelectedSession(sessions.find(s => s.id == e.target.value))}
                                    className="bg-transparent border-none p-0 pr-4 text-xs font-bold text-slate-700 outline-none focus:ring-0 cursor-pointer appearance-none"
                                >
                                    {sessions.length > 0 ? (
                                        sessions.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} {s.is_active === 'active' ? '●' : ''}</option>
                                        ))
                                    ) : (
                                        <option value="">No Session</option>
                                    )}
                                </select>
                                <ChevronDown size={10} className="absolute right-0 text-blue-400 pointer-events-none" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="hidden xl:block relative group/search flex-1 max-w-xs ml-4">
                    <Search 
                        size={18} 
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" 
                    />
                    <input 
                        type="text" 
                        placeholder="Search..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-12 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-inter"
                    />
                </div>
            </div>

            {/* Right Side: Quick Actions & Profile */}
            <div className="flex items-center gap-4 ml-6">
                <div className="hidden lg:flex items-center gap-1 border-r border-slate-200 pr-4 mr-2">
                    <NavItem icon={Mail} badge="3" />
                    <NavItem icon={Bell} badge="5" />
                    <NavItem icon={HelpCircle} />
                </div>

                {/* Profile Card */}
                <div className="flex items-center gap-3 p-1.5 pr-4 rounded-xl cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100 group transition-all">
                    <div className="relative">
                        <img 
                            src="https://images.unsplash.com/photo-1540324155974-7523202daa3f?auto=format&fit=crop&q=80&w=150&h=150" 
                            alt="Admin User" 
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-blue-100 transition-all"
                        />
                        <div className="absolute bottom-[-2px] right-[-2px] w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm shadow-green-200"></div>
                    </div>
                    <div className="hidden sm:block">
                        <h4 className="text-sm font-bold text-slate-800 font-outfit tracking-tight leading-tight">Rajesh Kumar</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Super Administrator</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 ml-1 group-hover:text-blue-600 transition-all" />
                </div>
            </div>
        </header>
    );
};

export default Navbar;
