import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, Globe, MapPin, Map, X, Check, Search, Hash } from 'lucide-react';
import { useBranch } from '../../../context/BranchContext';
import { toast } from 'react-hot-toast';

const LocationSettings = () => {
    const { selectedBranch } = useBranch();
    const [activeTab, setActiveTab] = useState('countries'); // countries | states | cities

    // Data States
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Inline Add States
    const [isAdding, setIsAdding] = useState(false);
    
    // Forms
    const [countryForm, setCountryForm] = useState({ name: '', short_name: '' });
    const [stateForm, setStateForm] = useState({ name: '', country_id: '' });
    const [cityForm, setCityForm] = useState({ name: '', state_id: '' });

    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        if (selectedBranch) {
            fetchData();
        }
    }, [selectedBranch, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'countries') {
                const res = await api.get('countries', { headers: { 'school-branch-id': selectedBranch.id } });
                setCountries(res.data);
            } else if (activeTab === 'states') {
                const [statesRes, countriesRes] = await Promise.all([
                    api.get('states'),
                    api.get('countries', { headers: { 'school-branch-id': selectedBranch.id } })
                ]);
                setStates(statesRes.data);
                setCountries(countriesRes.data); // Needed for dropdown
            } else if (activeTab === 'cities') {
                const [citiesRes, statesRes] = await Promise.all([
                    api.get('cities'),
                    api.get('states')
                ]);
                setCities(citiesRes.data);
                setStates(statesRes.data); // Needed for dropdown
            }
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // --- CREATE ---
    const handleAdd = async () => {
        setSaving(true);
        try {
            if (activeTab === 'countries') {
                if (!countryForm.name.trim()) return;
                await api.post('countries', { ...countryForm, branch_id: selectedBranch.id });
                setCountryForm({ name: '', short_name: '' });
            } else if (activeTab === 'states') {
                if (!stateForm.name.trim() || !stateForm.country_id) return;
                await api.post('states', stateForm);
                setStateForm({ name: '', country_id: '' });
            } else if (activeTab === 'cities') {
                if (!cityForm.name.trim() || !cityForm.state_id) return;
                await api.post('cities', cityForm);
                setCityForm({ name: '', state_id: '' });
            }
            toast.success('Added successfully');
            fetchData();
            setIsAdding(false);
        } catch (err) {
            toast.error('Failed to add');
        } finally {
            setSaving(false);
        }
    };

    // --- UPDATE ---
    const handleUpdate = async (id) => {
        setSaving(true);
        try {
            if (activeTab === 'countries') {
                await api.put(`countries/${id}`, { ...editForm, branch_id: selectedBranch.id });
            } else if (activeTab === 'states') {
                await api.put(`states/${id}`, editForm);
            } else if (activeTab === 'cities') {
                await api.put(`cities/${id}`, editForm);
            }
            toast.success('Updated successfully');
            setEditingId(null);
            fetchData();
        } catch (err) {
            toast.error('Failed to update');
        } finally {
            setSaving(false);
        }
    };

    // --- DELETE ---
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            if (activeTab === 'countries') await api.delete(`countries/${id}`);
            else if (activeTab === 'states') await api.delete(`states/${id}`);
            else if (activeTab === 'cities') await api.delete(`cities/${id}`);
            
            toast.success('Deleted successfully');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const tabs = [
        { id: 'countries', name: 'Countries', icon: Globe },
        { id: 'states', name: 'States', icon: Map },
        { id: 'cities', name: 'Cities', icon: MapPin },
    ];

    const getFilteredData = () => {
        const query = searchQuery.toLowerCase();
        if (activeTab === 'countries') return countries.filter(c => c.name.toLowerCase().includes(query) || c.short_name?.toLowerCase().includes(query));
        if (activeTab === 'states') return states.filter(s => s.name.toLowerCase().includes(query) || s.country?.name.toLowerCase().includes(query));
        if (activeTab === 'cities') return cities.filter(c => c.name.toLowerCase().includes(query) || c.state?.name.toLowerCase().includes(query));
        return [];
    };

    const data = getFilteredData();

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <Globe size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-slate-800 font-outfit tracking-tight">Location Settings</h3>
                        <p className="text-sm text-slate-400 font-medium">Manage countries, states and cities.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={`Find ${activeTab}...`}
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
                            <Plus size={18} /> New
                        </button>
                    )}
                </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl w-fit">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setIsAdding(false); setEditingId(null); }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                isActive 
                                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.name}
                        </button>
                    )
                })}
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[11px] gap-5">
                    <Loader2 size={40} className="animate-spin text-indigo-500" />
                    Fetching records...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Add Form */}
                    {isAdding && (
                        <div className="bg-white border-2 border-indigo-600 rounded-[2.5rem] p-6 space-y-5 shadow-2xl shadow-indigo-100 animate-in zoom-in-95 duration-300 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Adding new</span>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            </div>
                            <div className="space-y-4 font-inter">
                                {/* Name Input */}
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Name"
                                    value={activeTab === 'countries' ? countryForm.name : activeTab === 'states' ? stateForm.name : cityForm.name}
                                    onChange={e => {
                                        if (activeTab === 'countries') setCountryForm({...countryForm, name: e.target.value});
                                        if (activeTab === 'states') setStateForm({...stateForm, name: e.target.value});
                                        if (activeTab === 'cities') setCityForm({...cityForm, name: e.target.value});
                                    }}
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                />

                                {/* Conditional Secondary Inputs */}
                                {activeTab === 'countries' && (
                                    <input
                                        type="text"
                                        placeholder="Short Name (e.g. IN)"
                                        value={countryForm.short_name}
                                        onChange={e => setCountryForm({...countryForm, short_name: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all"
                                    />
                                )}
                                
                                {activeTab === 'states' && (
                                    <select 
                                        value={stateForm.country_id}
                                        onChange={e => setStateForm({...stateForm, country_id: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all appearance-none"
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                )}

                                {activeTab === 'cities' && (
                                    <select 
                                        value={cityForm.state_id}
                                        onChange={e => setCityForm({...cityForm, state_id: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-all appearance-none"
                                    >
                                        <option value="">Select State</option>
                                        {states.map(s => <option key={s.id} value={s.id}>{s.name} ({s.country?.name})</option>)}
                                    </select>
                                )}
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={saving}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all text-xs font-black uppercase tracking-widest"
                            >
                                {saving ? 'Adding...' : 'Confirm'}
                            </button>
                        </div>
                    )}

                    {/* Data List */}
                    {data.map(item => (
                        <div key={item.id} className="group bg-white border border-slate-100 rounded-[2.5rem] p-6 hover:shadow-[0_40px_80px_rgb(0,0,0,0.05)] transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-2xl flex items-center justify-center transition-all">
                                        {activeTab === 'countries' && <Globe size={20} />}
                                        {activeTab === 'states' && <Map size={20} />}
                                        {activeTab === 'cities' && <MapPin size={20} />}
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-95 translate-x-2 group-hover:translate-x-0">
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setEditingId(item.id); 
                                                setEditForm({ ...item, country_id: item.country_id || '', state_id: item.state_id || '' }); 
                                            }} 
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                        >
                                            <PenBox size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} 
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {editingId === item.id ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 relative z-20">
                                        <div className="space-y-3">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800"
                                            />
                                            {activeTab === 'countries' && (
                                                <input
                                                    type="text"
                                                    value={editForm.short_name || ''}
                                                    onChange={e => setEditForm({ ...editForm, short_name: e.target.value })}
                                                    className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800"
                                                />
                                            )}
                                            {activeTab === 'states' && (
                                                <select 
                                                    value={editForm.country_id}
                                                    onChange={e => setEditForm({...editForm, country_id: e.target.value})}
                                                    className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 appearance-none"
                                                >
                                                    <option value="">Select Country</option>
                                                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            )}
                                            {activeTab === 'cities' && (
                                                <select 
                                                    value={editForm.state_id}
                                                    onChange={e => setEditForm({...editForm, state_id: e.target.value})}
                                                    className="w-full bg-indigo-50/50 border-2 border-indigo-100 p-3 rounded-xl outline-none font-bold text-slate-800 appearance-none"
                                                >
                                                    <option value="">Select State</option>
                                                    {states.map(s => <option key={s.id} value={s.id}>{s.name} ({s.country?.name})</option>)}
                                                </select>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleUpdate(item.id)} disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{saving ? '...' : 'Save'}</button>
                                            <button onClick={() => setEditingId(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">X</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="space-y-0.5">
                                            <h4 className="font-bold text-slate-800 font-outfit text-xl tracking-tight line-clamp-1">{item.name}</h4>
                                            {activeTab === 'countries' && <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{item.short_name || 'NO SHORT NAME'}</p>}
                                            {activeTab === 'states' && <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{item.country?.name || 'NO COUNTRY'}</p>}
                                            {activeTab === 'cities' && <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">State: {item.state?.name || 'NO STATE'}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {data.length === 0 && !isAdding && (
                        <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/20">
                            <Hash size={48} className="text-slate-200 mb-6 mx-auto animate-bounce-slow" />
                            <h5 className="font-bold text-slate-700 text-lg uppercase tracking-tight">No records found</h5>
                            <button onClick={() => setIsAdding(true)} className="mt-6 text-indigo-600 font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white px-8 py-3 rounded-2xl border-2 border-indigo-600 transition-all">Start adding</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationSettings;
