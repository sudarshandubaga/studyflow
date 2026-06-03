import React from 'react';
import { 
    Users, 
    GraduationCap, 
    Calendar, 
    TrendingUp, 
    ArrowUpRight, 
    ArrowDownRight,
    Search,
    BookOpen,
    Clock,
    CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, trend, color, accent }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className={`relative bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden group`}
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${accent} opacity-5 -mr-12 -mt-12 rounded-full transition-transform group-hover:scale-110`} />
        
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 shadow-sm border border-${color}-100 transition-colors`}>
                <Icon size={24} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        
        <h3 className="text-slate-500 text-sm font-semibold tracking-wide font-outfit uppercase">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight font-outfit">{value}</p>
    </motion.div>
);

const ActivityItem = ({ title, subtitle, time, icon: Icon, statusColor }) => (
    <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 group cursor-pointer">
        <div className={`p-3 rounded-xl ${statusColor} text-white shadow-md shadow-blue-100 flex-shrink-0 transition-transform group-hover:scale-105`}>
            <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-800 line-clamp-1 font-outfit tracking-tight">{title}</h4>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-[11px] font-bold text-slate-400 bg-slate-100/50 px-2 py-1 rounded-md mt-1 shrink-0 uppercase tracking-wider">
            {time}
        </div>
    </div>
);

const DashboardOverview = () => {
    const stats = [
        { title: 'Total Students', value: '2,482', icon: GraduationCap, trend: 12.5, color: 'blue', accent: 'from-blue-600 to-blue-400' },
        { title: 'Total Staff', value: '156', icon: Users, trend: 8.2, color: 'indigo', accent: 'from-indigo-600 to-indigo-400' },
        { title: 'Attendance Today', value: '94.8%', icon: Calendar, trend: -1.4, color: 'orange', accent: 'from-orange-600 to-orange-400' },
        { title: 'Fee Collection', value: '$45.2k', icon: CreditCard, trend: 24.5, color: 'emerald', accent: 'from-emerald-600 to-emerald-400' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">Dashboard</h1>
                    <p className="text-slate-500 font-medium mt-1">Welcome back, Admin! Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all hover:border-slate-300 hover:shadow-sm">
                        Export Report
                    </button>
                    <button className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 flex items-center gap-2">
                        <TrendingUp size={16} /> Update Status
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <StatCard key={idx} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* School Calendar / Schedule */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 font-outfit tracking-tight">Today's Class Schedule</h2>
                                <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                                    <Clock size={14} /> Showing 8 scheduled classes for March 28, 2026
                                </p>
                            </div>
                            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors hover:underline underline-offset-4 decoration-2">
                                View Full Calendar
                            </button>
                        </div>

                        <div className="space-y-4">
                            {[
                                { class: 'Class 10A', subject: 'Mathematics (Algebra)', teacher: 'Dr. Sunita Sharma', time: '09:00 AM - 10:00 AM', status: 'In Progress', statusColor: 'bg-emerald-500 border-emerald-100' },
                                { class: 'Class 12C', subject: 'Physics (Thermodynamics)', teacher: 'Mr. Pradeep Rawat', time: '10:15 AM - 11:15 AM', status: 'Upcoming', statusColor: 'bg-blue-500 border-blue-100' },
                                { class: 'Class 08B', subject: 'English (Literature)', teacher: 'Ms. Priya Singh', time: '11:15 AM - 12:15 PM', status: 'Scheduled', statusColor: 'bg-slate-400 border-slate-100' },
                            ].map((session, idx) => (
                                <div key={idx} className="flex items-center gap-6 p-5 border border-slate-100 rounded-2xl transition-all hover:border-blue-100 hover:bg-blue-50/[0.02] group">
                                    <div className="w-16 h-16 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-2 border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all shrink-0">
                                        <BookOpen size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">{session.class}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-base font-outfit tracking-tight">{session.subject}</h4>
                                        <p className="text-sm font-medium text-slate-500 mt-0.5">Faculty: {session.teacher}</p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md tracking-tight uppercase">
                                                <Clock size={12} /> {session.time}
                                            </span>
                                            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full text-white shadow-sm ${session.statusColor}`}>
                                                {session.status}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-100 hover:border-blue-500">
                                        <ArrowUpRight size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Notifications / Activity */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-slate-800 font-outfit tracking-tight">System Logs</h2>
                            <div className="p-2 rounded-lg bg-slate-50 text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors">
                                <Search size={16} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <ActivityItem 
                                title="Exam Result Published" 
                                subtitle="Class 10th - Mid Term Exams (2025)" 
                                time="2m ago" 
                                icon={TrendingUp} 
                                statusColor="bg-gradient-to-tr from-emerald-600 to-emerald-400" 
                            />
                            <ActivityItem 
                                title="Staff Meeting Reminder" 
                                subtitle="Agenda: Digital Learning Implementation" 
                                time="45m ago" 
                                icon={Clock} 
                                statusColor="bg-gradient-to-tr from-blue-600 to-blue-400" 
                            />
                            <ActivityItem 
                                title="Fee Alert Sent" 
                                subtitle="54 parents notified for pending dues" 
                                time="2h ago" 
                                icon={CreditCard} 
                                statusColor="bg-gradient-to-tr from-orange-600 to-orange-400" 
                            />
                            <ActivityItem 
                                title="New Staff Registered" 
                                subtitle="Rahul Varma added to Computer Dept." 
                                time="5h ago" 
                                icon={Users} 
                                statusColor="bg-gradient-to-tr from-indigo-600 to-indigo-400" 
                            />
                        </div>

                        <button className="w-full mt-8 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl text-sm transition-all border border-slate-100/50 font-outfit tracking-wide">
                            Load More Activities
                        </button>
                    </div>

                    {/* Quick Stats Mini */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-[0_15px_35px_rgba(30,41,59,0.2)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-10 -mt-10 rounded-full transition-transform group-hover:scale-125" />
                        <div className="relative z-10">
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Storage Status</p>
                            <h3 className="text-2xl font-extrabold mt-1 font-outfit">Cloud Backup</h3>
                            <div className="mt-6 flex items-end justify-between">
                                <div className="space-y-1">
                                    <p className="text-slate-300 text-xs font-bold font-outfit">12.4 GB / 15 GB Used</p>
                                    <div className="w-48 h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '82%' }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]" 
                                        />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-white font-outfit tracking-tight">82%</p>
                                </div>
                            </div>
                            <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white text-white hover:text-slate-900 font-bold rounded-xl text-sm transition-all backdrop-blur-md border border-white/10 font-outfit uppercase tracking-tighter">
                                Upgrade Storage
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
