import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Plus } from 'lucide-react';

const CalendarView = ({ events, onEdit, onDelete }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const prevMonthDays = daysInMonth(year, month - 1);
    const days = [];

    // Fill previous month gaps
    for (let i = startDay - 1; i >= 0; i--) {
        days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }

    // Fill current month
    for (let i = 1; i <= totalDays; i++) {
        days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }

    // Fill next month gaps
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
        days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }

    const changeMonth = (offset) => {
        setCurrentDate(new Date(year, month + offset, 1));
    };

    const getEventsForDate = (date) => {
        return events.filter(event => {
            const start = new Date(event.start_date);
            const end = new Date(event.end_date);
            // Reset times for comparison
            const compareDate = new Date(date).setHours(0,0,0,0);
            const compareStart = new Date(start).setHours(0,0,0,0);
            const compareEnd = new Date(end).setHours(0,0,0,0);
            return compareDate >= compareStart && compareDate <= compareEnd;
        });
    };

    const getEventTypeStyles = (type) => {
        switch (type) {
            case 'Holiday': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Assessment': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Sport': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        }
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Calendar Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-6">
                    <h2 className="text-2xl font-black text-slate-800 font-outfit tracking-tight">
                        {currentDate.toLocaleString('default', { month: 'long' })} <span className="text-indigo-600">{year}</span>
                    </h2>
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><ChevronLeft size={20} /></button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all border-x border-slate-100">Today</button>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><ChevronRight size={20} /></button>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {['Event', 'Holiday', 'Assessment', 'Sport'].map(type => (
                        <div key={type} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-100 shadow-sm">
                            <div className={`w-2 h-2 rounded-full ${getEventTypeStyles(type).split(' ')[0]}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{type}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-collapse">
                {weekDays.map(day => (
                    <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-50 bg-slate-50/30">
                        {day}
                    </div>
                ))}
                
                {days.map((item, idx) => {
                    const dateEvents = getEventsForDate(item.date);
                    const isToday = new Date().toDateString() === item.date.toDateString();
                    
                    return (
                        <div 
                            key={idx} 
                            className={`min-h-[140px] p-3 border-r border-b border-slate-50 transition-all relative group ${
                                !item.currentMonth ? 'bg-slate-50/20 grayscale-[0.5] opacity-40' : 'hover:bg-slate-50/30'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-xl transition-all ${
                                    isToday 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                        : item.currentMonth ? 'text-slate-700' : 'text-slate-300'
                                }`}>
                                    {item.day}
                                </span>
                            </div>

                            <div className="space-y-1.5 max-h-[100px] overflow-y-auto no-scrollbar">
                                {dateEvents.map(event => (
                                    <div 
                                        key={event.id}
                                        onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                                        className={`group/event px-2 py-1.5 rounded-lg border text-[9px] font-bold cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm truncate flex items-center justify-between ${getEventTypeStyles(event.event_type)}`}
                                    >
                                        <span className="truncate">{event.name}</span>
                                        {event.mark_attendance && <Info size={10} className="shrink-0 opacity-50" />}
                                    </div>
                                ))}
                            </div>

                            {item.currentMonth && (
                                <button className="absolute bottom-2 right-2 p-1.5 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-slate-200 shadow-sm text-indigo-600">
                                    <Plus size={14} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
