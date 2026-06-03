import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Settings, Clock, Calendar, Check, Save } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const AttendanceSettings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({ 
        default_in_time: '', 
        default_out_time: '', 
        mark_attendance_on_weekend: false 
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user?.school_id) {
            fetchSettings();
        }
    }, [user]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('attendance-settings', {
                headers: { 'branch-id': user.branch_id || user.school_id }
            });
            if (res.data) {
                setSettings({
                    default_in_time: res.data.default_in_time || '',
                    default_out_time: res.data.default_out_time || '',
                    mark_attendance_on_weekend: !!res.data.mark_attendance_on_weekend
                });
            }
        } catch (err) { toast.error('Failed to fetch settings'); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('attendance-settings', { 
                ...settings, 
                branch_id: user.branch_id || user.school_id 
            });
            toast.success('Settings updated');
        } catch (err) { toast.error('Failed to save settings'); }
        finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-12 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center gap-6 border-b border-slate-100 pb-8">
                <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                    <Settings size={32} />
                </div>
                <div>
                    <h3 className="font-bold text-3xl text-slate-800 font-outfit tracking-tight">Attendance Settings</h3>
                    <p className="text-base text-slate-400 font-medium">Configure global rules for staff and student attendance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Working Hours */}
                <div className="bg-white border-2 border-slate-50 rounded-[3rem] p-10 space-y-8 hover:shadow-2xl hover:shadow-indigo-50 transition-all transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                        <h4 className="font-bold text-xl text-slate-800">Working Hours</h4>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Default In Time</label>
                            <input 
                                type="time"
                                value={settings.default_in_time}
                                onChange={e => setSettings({...settings, default_in_time: e.target.value})}
                                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Default Out Time</label>
                            <input 
                                type="time"
                                value={settings.default_out_time}
                                onChange={e => setSettings({...settings, default_out_time: e.target.value})}
                                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Calendar Config */}
                <div className="bg-white border-2 border-slate-50 rounded-[3rem] p-10 space-y-8 hover:shadow-2xl hover:shadow-indigo-50 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Calendar size={20} />
                        </div>
                        <h4 className="font-bold text-xl text-slate-800">Calendar Policy</h4>
                    </div>
                    <div className="space-y-6">
                        <label className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${
                            settings.mark_attendance_on_weekend ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-slate-200'
                        }`}>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={settings.mark_attendance_on_weekend}
                                onChange={e => setSettings({...settings, mark_attendance_on_weekend: e.target.checked})}
                            />
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                settings.mark_attendance_on_weekend ? 'bg-white text-indigo-600 shadow-sm' : 'bg-white border-2 border-slate-100 text-transparent'
                            }`}>
                                <Check size={16} strokeWidth={4} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="font-black uppercase text-[10px] tracking-widest">Weekend Attendance</span>
                                <p className={`text-[11px] font-bold ${settings.mark_attendance_on_weekend ? 'text-indigo-100' : 'text-slate-400'}`}>Allow marking attendance on Sundays.</p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-start border-t border-slate-100 pt-10">
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {saving ? 'Saving Changes...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );
};

export default AttendanceSettings;
