import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, Calendar, Search, X, Check, Hash, CheckSquare, Square, Info, UserCheck, Users, GraduationCap, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import CalendarView from './CalendarView';

const CalendarList = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    
    // Inline Add State
    const [isAdding, setIsAdding] = useState(false);
    const [newEvent, setNewEvent] = useState({ 
        name: '', 
        event_type: 'Event', 
        start_date: '', 
        end_date: '', 
        description: '', 
        mark_attendance: false, 
        event_for: 'Both' 
    });
    const [saving, setSaving] = useState(false);

    // Inline Edit State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ 
        name: '', 
        event_type: 'Event', 
        start_date: '', 
        end_date: '', 
        description: '', 
        mark_attendance: false, 
        event_for: 'Both',
        is_active: true 
    });

    useEffect(() => {
        if (user?.school_id) {
            fetchEvents();
            setSelectedIds([]);
        }
    }, [user]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get('event-calendars', {
                headers: { 'school-id': user.school_id }
            });
            setEvents(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            toast.error('Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = async () => {
        if (!newEvent.name.trim() || !newEvent.start_date || !newEvent.end_date) {
            toast.error('Please fill all required fields');
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('event-calendars', {
                ...newEvent,
                school_id: user.school_id
            });
            setEvents([...events, res.data]);
            setNewEvent({ 
                name: '', 
                event_type: 'Event', 
                start_date: '', 
                end_date: '', 
                description: '', 
                mark_attendance: false, 
                event_for: 'Both' 
            });
            setIsAdding(false);
            toast.success('Event added to calendar');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add event');
        } finally { setSaving(false); }
    };

    const handleSaveEdit = async (id) => {
        if (!editForm.name.trim() || !editForm.start_date || !editForm.end_date) return;
        setSaving(true);
        try {
            const res = await api.put(`event-calendars/${id}`, {
                ...editForm,
                school_id: user.school_id
            });
            setEvents(events.map(e => e.id === id ? res.data : e));
            setEditingId(null);
            toast.success('Event updated');
        } catch (err) {
            toast.error('Failed to update event');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await api.delete(`event-calendars/${id}`);
            setEvents(events.filter(e => e.id !== id));
            toast.success('Event deleted');
        } catch (err) {
            toast.error('Failed to delete event');
        }
    };

    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;
        if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} events forever?`)) return;
        
        setIsBulkLoading(true);
        try {
            await api.post('event-calendars/bulk', {
                ids: selectedIds,
                action
            });
            
            if (action === 'delete') {
                setEvents(events.filter(e => !selectedIds.includes(e.id)));
                setSelectedIds([]);
            } else {
                fetchEvents();
                setSelectedIds([]);
            }
            toast.success('Bulk operation success');
        } catch (err) {
            toast.error('Bulk operation failed');
        } finally {
            setIsBulkLoading(false);
        }
    };

    const toggleSelect = id => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const filtered = events.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.event_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(e => e.id));
    };

    const getEventTypeColor = (type) => {
        switch (type) {
            case 'Holiday': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'Assessment': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Sport': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        }
    };

    const getEventForIcon = (forWhom) => {
        switch (forWhom) {
            case 'Employee': return <UserCheck size={14} />;
            case 'Student': return <GraduationCap size={14} />;
            default: return <Users size={14} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">School Calendar</h3>
                        <p className="text-sm text-slate-400 font-medium">Manage holidays, events, assessments and sports schedules.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100 mr-2 shadow-sm">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-xl border border-slate-100 ring-4 ring-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xl border border-slate-100 ring-4 ring-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>

                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find event..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-100 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-indigo-50 focus:border-indigo-500 outline-none w-64 transition-all"
                        />
                    </div>
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> Add Event
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex items-center gap-6 bg-slate-900 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl shadow-slate-900/40 border border-slate-800">
                        <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-black text-sm">
                                {selectedIds.length}
                            </div>
                            <span className="text-sm font-bold text-slate-300">Selected</span>
                            </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => handleBulkAction('enable')}
                                disabled={isBulkLoading}
                                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-white hover:text-slate-900 transition-all"
                            >
                                Enable
                            </button>
                            <button 
                                onClick={() => handleBulkAction('disable')}
                                disabled={isBulkLoading}
                                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-white hover:text-slate-900 transition-all"
                            >
                                Disable
                            </button>
                            <button 
                                onClick={() => handleBulkAction('delete')}
                                disabled={isBulkLoading}
                                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                            >
                                Delete
                            </button>
                            <button 
                                onClick={() => setSelectedIds([])}
                                className="ml-4 text-slate-500 hover:text-white text-xs font-bold"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5">
                    <Loader2 size={40} className="animate-spin text-indigo-500" />
                    Syncing calendar...
                </div>
            ) : viewMode === 'grid' ? (
                <CalendarView 
                    events={filtered}
                    onEdit={(event) => { 
                        setEditingId(event.id); 
                        setEditForm({ 
                            ...event,
                            start_date: event.start_date.split('T')[0],
                            end_date: event.end_date.split('T')[0]
                        }); 
                    }}
                    onDelete={handleDelete}
                />
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-6">
                        <button 
                            onClick={toggleSelectAll}
                            className="flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            {selectedIds.length === filtered.length && filtered.length > 0 ? (
                                <CheckSquare size={20} className="text-indigo-600" />
                            ) : (
                                <Square size={20} />
                            )}
                            <span className="text-xs font-black uppercase tracking-widest">Select All {filtered.length > 0 && `(${filtered.length})`}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* Inline Add Card */}
                        {isAdding && (
                            <div className="bg-white border-2 border-indigo-600 rounded-[2.5rem] p-6 space-y-5 shadow-2xl shadow-indigo-100 animate-in zoom-in-95 duration-300 relative z-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Adding new event</span>
                                    <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                                </div>
                                <div className="space-y-4 font-inter">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Event Name"
                                        value={newEvent.name}
                                        onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            value={newEvent.event_type}
                                            onChange={e => setNewEvent({ ...newEvent, event_type: e.target.value })}
                                            className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm"
                                        >
                                            <option value="Event">Event</option>
                                            <option value="Holiday">Holiday</option>
                                            <option value="Assessment">Assessment</option>
                                            <option value="Sport">Sport</option>
                                        </select>
                                        <select
                                            value={newEvent.event_for}
                                            onChange={e => setNewEvent({ ...newEvent, event_for: e.target.value })}
                                            className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm"
                                        >
                                            <option value="Student">For Students</option>
                                            <option value="Employee">For Employees</option>
                                            <option value="Both">For Both</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 px-2">Start Date</label>
                                            <input
                                                type="date"
                                                value={newEvent.start_date}
                                                onChange={e => setNewEvent({ ...newEvent, start_date: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 px-2">End Date</label>
                                            <input
                                                type="date"
                                                value={newEvent.end_date}
                                                onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                    <textarea
                                        placeholder="Description (Optional)"
                                        value={newEvent.description}
                                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all text-sm h-24 resize-none"
                                    />
                                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={newEvent.mark_attendance} 
                                            onChange={e => setNewEvent({...newEvent, mark_attendance: e.target.checked})}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-0" 
                                        />
                                        <span className="text-sm font-bold text-slate-700">Mark Attendance Required</span>
                                    </label>
                                </div>
                                <button
                                    onClick={handleAddEvent}
                                    disabled={saving || !newEvent.name.trim() || !newEvent.start_date || !newEvent.end_date}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all text-xs font-black uppercase tracking-widest"
                                >
                                    {saving ? 'Adding...' : 'Confirm creation'}
                                </button>
                            </div>
                        )}

                        {filtered.map(event => {
                            const isSelected = selectedIds.includes(event.id);
                            return (
                                <div 
                                    key={event.id} 
                                    onClick={() => toggleSelect(event.id)}
                                    className={`group bg-white border cursor-pointer rounded-[2.5rem] p-6 hover:shadow-[0_40px_80px_rgb(0,0,0,0.05)] transition-all relative overflow-hidden ${
                                        isSelected ? 'ring-2 ring-indigo-600 border-transparent bg-indigo-50/10 shadow-xl' : 'border-slate-100'
                                    }`}
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-all ${
                                        isSelected ? 'bg-indigo-500/20' : 'bg-slate-50/50 group-hover:bg-indigo-50'
                                    }`} />
                                    
                                    <div className="relative z-10 space-y-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'
                                                }`}>
                                                    {isSelected && <Check size={14} strokeWidth={4} />}
                                                </div>
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                                                    isSelected ? 'bg-indigo-600 text-white border-transparent' : getEventTypeColor(event.event_type)
                                                }`}>
                                                    <Calendar size={20} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-95 translate-x-2 group-hover:translate-x-0">
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setEditingId(event.id); 
                                                        setEditForm({ 
                                                            ...event,
                                                            start_date: event.start_date.split('T')[0],
                                                            end_date: event.end_date.split('T')[0]
                                                        }); 
                                                    }} 
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                                >
                                                    <PenBox size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }} 
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {editingId === event.id ? (
                                            <div onClick={e => e.stopPropagation()} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="space-y-3">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                        className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                                    />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <select
                                                            value={editForm.event_type}
                                                            onChange={e => setEditForm({ ...editForm, event_type: e.target.value })}
                                                            className="bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                                        >
                                                            <option value="Event">Event</option>
                                                            <option value="Holiday">Holiday</option>
                                                            <option value="Assessment">Assessment</option>
                                                            <option value="Sport">Sport</option>
                                                        </select>
                                                        <select
                                                            value={editForm.event_for}
                                                            onChange={e => setEditForm({ ...editForm, event_for: e.target.value })}
                                                            className="bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                                        >
                                                            <option value="Student">Students</option>
                                                            <option value="Employee">Employees</option>
                                                            <option value="Both">Both</option>
                                                        </select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="date"
                                                            value={editForm.start_date}
                                                            onChange={e => setEditForm({ ...editForm, start_date: e.target.value })}
                                                            className="bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={editForm.end_date}
                                                            onChange={e => setEditForm({ ...editForm, end_date: e.target.value })}
                                                            className="bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm"
                                                        />
                                                    </div>
                                                    <textarea
                                                        value={editForm.description}
                                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                        className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 text-sm h-20 resize-none"
                                                    />
                                                    <div className="flex flex-col gap-2">
                                                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-slate-100 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={editForm.mark_attendance} 
                                                                onChange={e => setEditForm({...editForm, mark_attendance: e.target.checked})}
                                                                className="w-4 h-4 rounded text-indigo-600" 
                                                            />
                                                            <span className="text-xs font-bold text-slate-700">Attendance</span>
                                                        </label>
                                                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-slate-100 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={editForm.is_active} 
                                                                onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                                                                className="w-4 h-4 rounded text-indigo-600" 
                                                            />
                                                            <span className="text-xs font-bold text-slate-700">Active</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleSaveEdit(event.id)} disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{saving ? '...' : 'Save'}</button>
                                                    <button onClick={() => setEditingId(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">X</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getEventTypeColor(event.event_type)}`}>
                                                            {event.event_type}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[8px] font-black uppercase text-slate-400 tracking-wider">
                                                            {getEventForIcon(event.event_for)}
                                                            {event.event_for === 'Both' ? 'Student & Employee' : event.event_for}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 font-outfit text-lg tracking-tight line-clamp-1">{event.name}</h4>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black uppercase text-slate-400">Start</span>
                                                            {new Date(event.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="h-6 w-px bg-slate-200" />
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-[8px] font-black uppercase text-slate-400">End</span>
                                                            {new Date(event.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    
                                                    {event.description && (
                                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed px-1">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                            event.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                            {event.is_active ? 'Active' : 'Disabled'}
                                                        </span>
                                                        {event.mark_attendance && (
                                                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                                                                <Info size={8} /> Attendance
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {filtered.length === 0 && !isAdding && (
                            <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/20">
                                <Hash size={48} className="text-slate-200 mb-6 mx-auto animate-bounce-slow" />
                                <h5 className="font-bold text-slate-700 text-lg uppercase tracking-tight">No calendar events yet</h5>
                                <button onClick={() => setIsAdding(true)} className="mt-6 text-indigo-600 font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white px-8 py-3 rounded-2xl border-2 border-indigo-600 transition-all">Start building calendar</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarList;
