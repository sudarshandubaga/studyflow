import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, Layers, Hash, Search, X, GripVertical, Check, ArrowUpDown, Box } from 'lucide-react';
import { useSession } from '../../../context/SessionContext';
import { motion, Reorder, AnimatePresence } from 'framer-motion';

const ClassesSections = () => {
    const { selectedSession, loading: sessionLoading } = useSession();
    const [classes, setClasses] = useState([]);
    const [classesLoading, setClassesLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSortingMode, setIsSortingMode] = useState(false);

    // Modal States
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form States
    const [classForm, setClassForm] = useState({ 
        mode: 'manual', name: '', rangeStart: '1', rangeEnd: '10', prefix: '', suffix: ''
    });
    const [sectionForm, setSectionForm] = useState({ 
        mode: 'manual', name: '', class_id: '', rangeStart: 'A', rangeEnd: 'C'
    });
    const [groupForm, setGroupForm] = useState({ 
        mode: 'manual', name: '', section_id: '', rangeStart: '1', rangeEnd: '4'
    });

    useEffect(() => {
        if (selectedSession) fetchClasses(selectedSession.id);
    }, [selectedSession]);

    const fetchClasses = async (sessionId) => {
        setClassesLoading(true);
        try {
            const res = await api.get(`classes?session_id=${sessionId}`);
            setClasses(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch classes', err);
        } finally { setClassesLoading(false); }
    };

    const handleReorder = async (newOrder) => {
        setClasses(newOrder);
    };

    const saveNewOrder = async () => {
        setSaving(true);
        try {
            await api.post('classes/reorder', {
                class_ids: classes.map(c => c.id)
            });
            setIsSortingMode(false);
        } catch (err) {
            setError('Failed to save arrangement');
        } finally { setSaving(false); }
    };

    const filteredClasses = useMemo(() => {
        if (!searchQuery.trim()) return classes;
        const query = searchQuery.toLowerCase();
        return classes.filter(cls => 
            cls.name.toLowerCase().includes(query) || 
            cls.sections?.some(sec => sec.name.toLowerCase().includes(query))
        );
    }, [classes, searchQuery]);

    // Range Generator
    const generateRange = (start, end, prefix = '', suffix = '') => {
        if (!start || !end) return [];
        const items = [];
        if (!isNaN(start) && !isNaN(end)) {
            for (let i = parseInt(start); i <= parseInt(end); i++) items.push(`${prefix}${i}${suffix}`.trim());
        } else {
            const s = start.toUpperCase().charCodeAt(0), e = end.toUpperCase().charCodeAt(0);
            for (let i = s; i <= e; i++) items.push(`${prefix}${String.fromCharCode(i)}${suffix}`.trim());
        }
        return items;
    };

    // Class CRUD
    const handleOpenClassModal = (cls = null) => {
        setError('');
        if (cls) {
            setEditingItem(cls);
            setClassForm({ mode: 'manual', name: cls.name, rangeStart: '1', rangeEnd: '10', prefix: '', suffix: '' });
        } else {
            setEditingItem(null);
            setClassForm({ mode: 'range', name: '', rangeStart: '1', rangeEnd: '10', prefix: '', suffix: 'th Standard' });
        }
        setIsClassModalOpen(true);
    };

    const handleSaveClass = async (e) => {
        e.preventDefault();
        setError(''); setSaving(true);
        try {
            if (editingItem) {
                await api.put(`classes/${editingItem.id}`, { name: classForm.name, session_id: selectedSession.id });
            } else {
                if (classForm.mode === 'range') {
                    const classesToCreate = generateRange(classForm.rangeStart, classForm.rangeEnd, classForm.prefix, classForm.suffix);
                    await api.post('classes/bulk', { classes: classesToCreate, session_id: selectedSession.id });
                } else {
                    await api.post('classes', { name: classForm.name, session_id: selectedSession.id });
                }
            }
            fetchClasses(selectedSession.id); setIsClassModalOpen(false);
        } catch (err) { setError(err.response?.data?.message || err.message); } finally { setSaving(false); }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm('Delete this class and all sections?')) return;
        try { await api.delete(`classes/${id}`); fetchClasses(selectedSession.id); } catch (err) { alert('Failed to delete class'); }
    };

    // Section CRUD
    const handleOpenSectionModal = (section = null, classId = null) => {
        setError('');
        if (section) {
            setEditingItem(section);
            setSectionForm({ mode: 'manual', name: section.name, class_id: section.class_id, rangeStart: 'A', rangeEnd: 'C' });
        } else {
            setEditingItem(null);
            setSectionForm({ mode: 'range', name: '', class_id: classId, rangeStart: 'A', rangeEnd: 'D' });
        }
        setIsSectionModalOpen(true);
    };

    const handleSaveSection = async (e) => {
        e.preventDefault(); setError(''); setSaving(true);
        try {
            if (editingItem) {
                await api.put(`sections/${editingItem.id}`, { name: sectionForm.name, class_id: sectionForm.class_id });
            } else {
                if (sectionForm.mode === 'range') {
                    const sections = generateRange(sectionForm.rangeStart, sectionForm.rangeEnd);
                    await api.post('sections/bulk', { sections, class_id: sectionForm.class_id });
                } else {
                    await api.post('sections', { name: sectionForm.name, class_id: sectionForm.class_id });
                }
            }
            fetchClasses(selectedSession.id); setIsSectionModalOpen(false);
        } catch (err) { setError(err.response?.data?.message || err.message); } finally { setSaving(false); }
    };

    const handleDeleteSection = async (id) => {
        if (!window.confirm('Delete section?')) return;
        try { await api.delete(`sections/${id}`); fetchClasses(selectedSession.id); } catch (err) { alert('Failed to delete section'); }
    };

    // Group CRUD
    const handleOpenGroupModal = (group = null, sectionId = null) => {
        setError('');
        if (group) {
            setEditingItem(group);
            setGroupForm({ mode: 'manual', name: group.name, section_id: group.section_id, rangeStart: '1', rangeEnd: '4' });
        } else {
            setEditingItem(null);
            setGroupForm({ mode: 'range', name: '', section_id: sectionId, rangeStart: '1', rangeEnd: '4' });
        }
        setIsGroupModalOpen(true);
    };

    const handleSaveGroup = async (e) => {
        e.preventDefault(); setError(''); setSaving(true);
        try {
            if (editingItem) {
                await api.put(`groups/${editingItem.id}`, { name: groupForm.name, section_id: groupForm.section_id });
            } else {
                if (groupForm.mode === 'range') {
                    const groups = generateRange(groupForm.rangeStart, groupForm.rangeEnd, 'Group ');
                    await api.post('groups/bulk', { groups, section_id: groupForm.section_id });
                } else {
                    await api.post('groups', { name: groupForm.name, section_id: groupForm.section_id });
                }
            }
            fetchClasses(selectedSession.id); setIsGroupModalOpen(false);
        } catch (err) { setError(err.response?.data?.message || err.message); } finally { setSaving(false); }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm('Delete group?')) return;
        try { await api.delete(`groups/${id}`); fetchClasses(selectedSession.id); } catch (err) { alert('Failed to delete group'); }
    };

    if (sessionLoading) return (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs gap-3">
            <Loader2 size={24} className="animate-spin text-blue-500" /> Initializing...
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100"><Layers size={20} /></div>
                    <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Academic Structure</h3>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {!isSortingMode ? (
                        <>
                            <div className="relative group w-full sm:w-72">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input type="text" placeholder="Find classes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-100 pl-11 pr-10 py-2.5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100" />
                            </div>
                            <button onClick={() => setIsSortingMode(true)} disabled={classes.length < 2} className="w-full sm:w-auto p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 font-bold text-xs">
                                <ArrowUpDown size={16} /> Rearrange
                            </button>
                            <button onClick={() => handleOpenClassModal()} disabled={!selectedSession} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                                <Plus size={16} /> Add Class
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest px-4 mr-2">Sequence Arrangement</span>
                            <button onClick={() => { setIsSortingMode(false); fetchClasses(selectedSession.id); }} className="px-6 py-2.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all text-xs">Discard</button>
                            <button onClick={saveNewOrder} disabled={saving} className="bg-blue-600 text-white px-8 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 flex items-center gap-2">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Sequence
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {classesLoading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[10px] gap-4">
                    <Loader2 size={32} className="animate-spin text-blue-500" /> Syncing Layout...
                </div>
            ) : isSortingMode ? (
                <div className="max-w-2xl mx-auto">
                    <Reorder.Group axis="y" values={classes} onReorder={handleReorder} className="space-y-3">
                        {classes.map((cls) => (
                            <Reorder.Item 
                                key={cls.id} 
                                value={cls}
                                className="bg-white border border-slate-100 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group ring-blue-100 hover:ring-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-50 text-slate-300 rounded-full group-hover:text-blue-400 group-hover:bg-blue-500/5 transition-colors">
                                        <GripVertical size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-slate-800 text-lg font-outfit">{cls.name}</h4>
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{cls.sections?.length || 0} Divisions Assigned</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    {classes.indexOf(cls) + 1}
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.length > 0 ? filteredClasses.map((cls) => (
                        <motion.div 
                            layout 
                            key={cls.id} 
                            className="bg-white border border-slate-100 rounded-[2.5rem] p-6 hover:shadow-[0_40px_80px_rgb(0,0,0,0.06)] transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.25rem] bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-50"><Layers size={22} /></div>
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-slate-800 font-outfit text-lg leading-tight">{cls.name}</h4>
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Level {classes.indexOf(cls) + 1}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleOpenClassModal(cls)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><PenBox size={16} /></button>
                                    <button onClick={() => handleDeleteClass(cls.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="space-y-2.5 relative z-10">
                                {cls.sections?.map(section => (
                                    <div key={section.id} className="space-y-2 p-4 rounded-[2rem] bg-slate-50/50 border border-slate-100 group/section">
                                        <div className="flex items-center justify-between pb-2">
                                            <div className="flex items-center gap-3">
                                                <Hash size={12} className="text-blue-500" />
                                                <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{section.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover/section:opacity-100 transition-all scale-90">
                                                <button onClick={() => handleOpenGroupModal(null, section.id)} className="p-1.5 text-blue-500 hover:bg-blue-600 hover:text-white rounded-lg transition-all" title="Add Group"><Plus size={14} /></button>
                                                <button onClick={() => handleOpenSectionModal(section)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm"><PenBox size={14} /></button>
                                                <button onClick={() => handleDeleteSection(section.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        
                                        {/* Groups Sub-list */}
                                        <div className="flex flex-wrap gap-2 px-1">
                                            {section.groups?.map(group => (
                                                <div key={group.id} className="group/group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all">
                                                    <span className="text-[11px] font-bold text-slate-600">{group.name}</span>
                                                    <div className="flex items-center opacity-0 group-hover/group:opacity-100 transition-all scale-75 ml-1">
                                                        <button onClick={() => handleOpenGroupModal(group)} className="p-1 text-slate-400 hover:text-blue-600"><PenBox size={12} /></button>
                                                        <button onClick={() => handleDeleteGroup(group.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => handleOpenSectionModal(null, cls.id)} className="w-full mt-4 py-4 border-2 border-dashed border-slate-100 rounded-[1.5rem] text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-slate-50/20"><Plus size={16} /> New Division</button>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
                            <Layers size={56} className="text-slate-200 mb-6 mx-auto" />
                            <h5 className="font-bold text-slate-700 text-lg">Empty Academy</h5>
                        </div>
                    )}
                </div>
            )}

            {/* Modals remain the same but use updated save handlers */}
            {/* Class Modal */}
            {isClassModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-xl text-slate-800 font-outfit">{editingItem ? 'Edit Class' : 'Multiple Class Setup'}</h3>
                            <button onClick={() => setIsClassModalOpen(false)} className="p-2 text-slate-400"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveClass} className="p-8 space-y-6">
                            {error && <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-sm font-bold">{error}</div>}
                            {!editingItem && (
                                <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                                    {['manual', 'range'].map(m => (
                                        <button key={m} type="button" onClick={() => setClassForm({...classForm, mode: m})} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${classForm.mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{m === 'manual' ? 'Single Entry' : 'Quick Range'}</button>
                                    ))}
                                </div>
                            )}
                            {classForm.mode === 'manual' ? (
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Class Name *</label>
                                    <input type="text" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700" placeholder="e.g. 1st Standard" required={classForm.mode === 'manual'} />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">From</label>
                                            <input type="text" value={classForm.rangeStart} onChange={e => setClassForm({ ...classForm, rangeStart: e.target.value })} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-center font-bold text-slate-700" placeholder="1" required />
                                        </div>
                                        <div className="space-y-2 flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">To</label>
                                            <input type="text" value={classForm.rangeEnd} onChange={e => setClassForm({ ...classForm, rangeEnd: e.target.value })} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-center font-bold text-slate-700" placeholder="12" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Prefix</label>
                                            <input type="text" value={classForm.prefix} onChange={e => setClassForm({ ...classForm, prefix: e.target.value })} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700" placeholder="Class " />
                                        </div>
                                        <div className="space-y-2 flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Suffix</label>
                                            <input type="text" value={classForm.suffix} onChange={e => setClassForm({ ...classForm, suffix: e.target.value })} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700" placeholder="th" />
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 rounded-3xl p-5 border border-blue-100">
                                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-3">Preview:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {generateRange(classForm.rangeStart, classForm.rangeEnd, classForm.prefix, classForm.suffix).slice(0, 8).map((item, idx) => (
                                                <div key={idx} className="px-3 py-1.5 rounded-lg bg-white border border-blue-100 text-[10px] font-bold text-blue-600 shadow-sm">{item}</div>
                                            ))}
                                            {generateRange(classForm.rangeStart, classForm.rangeEnd, classForm.prefix, classForm.suffix).length > 8 && <div className="px-3 py-1.5 rounded-lg bg-blue-100 text-[10px] font-bold text-blue-800">...</div>}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setIsClassModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-[2] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-blue-700 flex items-center justify-center gap-3 font-bold">
                                    {saving ? 'Creating...' : editingItem ? 'Save Changes' : classForm.mode === 'range' ? `Add ${generateRange(classForm.rangeStart, classForm.rangeEnd, classForm.prefix, classForm.suffix).length} Classes` : 'Add Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Section Modal */}
            {isSectionModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-xl text-slate-800 font-outfit">{editingItem ? 'Edit Section' : 'Add Sections'}</h3>
                            <button onClick={() => setIsSectionModalOpen(false)} className="p-2 text-slate-400"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveSection} className="p-8 space-y-6">
                            {error && <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-sm font-bold">{error}</div>}
                            {!editingItem && (
                                <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                                    {['manual', 'range'].map(m => (
                                        <button key={m} type="button" onClick={() => setSectionForm({...sectionForm, mode: m})} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sectionForm.mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{m === 'manual' ? 'Single Entry' : 'Quick Range'}</button>
                                    ))}
                                </div>
                            )}
                            {sectionForm.mode === 'manual' ? (
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Section Name *</label>
                                    <input type="text" value={sectionForm.name} onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700" placeholder="e.g. Lotus" required={sectionForm.mode === 'manual'} />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Starts At</label>
                                            <input type="text" maxLength={1} value={sectionForm.rangeStart} onChange={e => setSectionForm({ ...sectionForm, rangeStart: e.target.value })} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-center uppercase font-bold text-slate-700" required={sectionForm.mode === 'range'} />
                                        </div>
                                        <div className="space-y-2 flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ends At</label>
                                            <input type="text" maxLength={1} value={sectionForm.rangeEnd} onChange={e => setSectionForm({ ...sectionForm, rangeEnd: e.target.value })} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-center uppercase font-bold text-slate-700" required={sectionForm.mode === 'range'} />
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 rounded-3xl p-5 border border-blue-100">
                                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-3">Preview:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {generateRange(sectionForm.rangeStart, sectionForm.rangeEnd).map((item, idx) => (
                                                <div key={idx} className="w-8 h-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shadow-sm">{item}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setIsSectionModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Discard</button>
                                <button type="submit" disabled={saving} className="flex-[2] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-blue-700 flex items-center justify-center gap-3 font-bold">
                                    {saving ? 'Creating...' : editingItem ? 'Save Changes' : sectionForm.mode === 'range' ? `Add ${generateRange(sectionForm.rangeStart, sectionForm.rangeEnd).length} Sections` : 'Add Section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Group Modal */}
            {isGroupModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-xl text-slate-800 font-outfit">{editingItem ? 'Edit Group' : 'Add Groups'}</h3>
                            <button onClick={() => setIsGroupModalOpen(false)} className="p-2 text-slate-400"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveGroup} className="p-8 space-y-6">
                            {error && <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-sm font-bold">{error}</div>}
                            {!editingItem && (
                                <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                                    {['manual', 'range'].map(m => (
                                        <button key={m} type="button" onClick={() => setGroupForm({...groupForm, mode: m})} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupForm.mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{m === 'manual' ? 'Single Entry' : 'Quick Range'}</button>
                                    ))}
                                </div>
                            )}
                            {groupForm.mode === 'manual' ? (
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Group Name *</label>
                                    <input type="text" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700" placeholder="e.g. Group 1" required={groupForm.mode === 'manual'} />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Start Num</label>
                                            <input type="number" value={groupForm.rangeStart} onChange={e => setGroupForm({ ...groupForm, rangeStart: e.target.value })} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-center font-bold text-slate-700" required={groupForm.mode === 'range'} />
                                        </div>
                                        <div className="space-y-2 flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">End Num</label>
                                            <input type="number" value={groupForm.rangeEnd} onChange={e => setGroupForm({ ...groupForm, rangeEnd: e.target.value })} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-center font-bold text-slate-700" required={groupForm.mode === 'range'} />
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 rounded-3xl p-5 border border-blue-100">
                                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-3">Preview:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {generateRange(groupForm.rangeStart, groupForm.rangeEnd, 'Group ').map((item, idx) => (
                                                <div key={idx} className="px-3 py-1.5 rounded-lg bg-white border border-blue-100 text-[10px] font-bold text-blue-600 shadow-sm">{item}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setIsGroupModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Discard</button>
                                <button type="submit" disabled={saving} className="flex-[2] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-blue-700 flex items-center justify-center gap-3 font-bold">
                                    {saving ? 'Creating...' : editingItem ? 'Save Changes' : groupForm.mode === 'range' ? `Add ${generateRange(groupForm.rangeStart, groupForm.rangeEnd, 'Group ').length} Groups` : 'Add Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassesSections;
