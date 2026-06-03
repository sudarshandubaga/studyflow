import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Camera,
    User,
    Home,
    Shield,
    Book,
    Phone,
    Mail,
    Loader2,
    Calendar,
    Globe,
    FileText,
    ArrowLeft,
    LayoutGrid
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useBranch } from '../../../context/BranchContext';
import { motion } from 'framer-motion';

const StudentAdmissionForm = ({ section, studentId = null, onCancel, onSuccess }) => {
    const { selectedBranch } = useBranch();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [masters, setMasters] = useState({
        titles: [],
        categories: [],
        customFields: [],
        countries: [],
        states: [],
        cities: []
    });

    const [form, setForm] = useState({
        title_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: '',
        admission_no: '', // Enrollment
        roll_no: '',
        dob: '',
        doj: '',
        student_category_id: '',
        father_email_id: '',
        father_mobile_no: '',
        apaar_id: '',
        scholar_id: '',
        country_id: '',
        state_id: '',
        city_id: '',
        custom_fields: {},
        avatar: null
    });

    const [existingPhoto, setExistingPhoto] = useState(null);

    useEffect(() => {
        fetchMasters().then(() => {
            if (studentId) {
                fetchStudentData();
            }
        });
    }, [studentId]);

    const fetchMasters = async () => {
        try {
            const [titlesRes, catRes, cfRes, countryRes] = await Promise.all([
                api.get('student-titles'),
                api.get('student-categories'),
                api.get('custom-fields', { params: { module: 'Student' } }),
                api.get('countries')
            ]);

            setMasters(prev => ({
                ...prev,
                titles: titlesRes.data,
                categories: catRes.data,
                customFields: cfRes.data,
                countries: countryRes.data
            }));
        } catch (err) {
            toast.error('Failed to load form requirements');
        }
    };

    const fetchStudentData = async () => {
        setFetching(true);
        try {
            const res = await api.get(`students/${studentId}`);
            const s = res.data;
            
            // Map flat values
            const newForm = {
                title_id: s.title_id || '',
                first_name: s.first_name || '',
                middle_name: s.middle_name || '',
                last_name: s.last_name || '',
                gender: s.gender || '',
                admission_no: s.enrollment_no || '',
                roll_no: s.roll_no || '',
                dob: s.dob || '',
                doj: s.doj || '',
                student_category_id: s.student_category_id || '',
                father_email_id: s.father_email_id || '',
                father_mobile_no: s.father_mobile_no || '',
                apaar_id: s.apaar_id || '',
                scholar_id: s.scholar_id || '',
                country_id: s.country_id || '',
                state_id: s.state_id || '',
                city_id: s.city_id || '',
                custom_fields: {},
                avatar: null
            };

            // Map custom fields
            if (s.custom_field_values) {
                s.custom_field_values.forEach(cfv => {
                    newForm.custom_fields[cfv.custom_field_id] = cfv.value;
                });
            }

            setForm(newForm);
            setExistingPhoto(s.photo);

            // Fetch dependent locations
            if (s.country_id) {
                const statesRes = await api.get(`states?country_id=${s.country_id}`);
                setMasters(prev => ({ ...prev, states: statesRes.data }));
                if (s.state_id) {
                    const citiesRes = await api.get(`cities?state_id=${s.state_id}`);
                    setMasters(prev => ({ ...prev, cities: citiesRes.data }));
                }
            }
        } catch (err) {
            toast.error('Failed to load student data');
        } finally {
            setFetching(false);
        }
    };

    const handleLocationChange = async (type, id) => {
        setForm(prev => ({ ...prev, [type]: id }));
        if (type === 'country_id') {
            const res = await api.get(`states?country_id=${id}`);
            setMasters(prev => ({ ...prev, states: res.data, cities: [] }));
            setForm(prev => ({ ...prev, state_id: '', city_id: '' }));
        } else if (type === 'state_id') {
            const res = await api.get(`cities?state_id=${id}`);
            setMasters(prev => ({ ...prev, cities: res.data }));
            setForm(prev => ({ ...prev, city_id: '' }));
        }
    };

    const handleSubmit = async (e) => {
        if(e) e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        Object.keys(form).forEach(key => {
            if (key === 'custom_fields') {
                formData.append('custom_fields', JSON.stringify(form.custom_fields));
            } else if (key === 'avatar') {
                if (form.avatar) formData.append('avatar', form.avatar);
            } else {
                formData.append(key, form[key] || '');
            }
        });
        
        formData.append('section_id', section.id);

        if (studentId) {
            formData.append('_method', 'PUT');
        }

        try {
            const url = studentId ? `students/${studentId}` : 'students';
            await api.post(url, formData, {
                headers: {
                    'branch-id': selectedBranch?.id,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success(studentId ? 'Student updated successfully!' : 'Student admitted successfully!');
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save student data');
        } finally {
            setLoading(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title, desc }) => (
        <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                <Icon size={24} />
            </div>
            <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">{title}</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">{desc}</p>
            </div>
        </div>
    );

    // Group custom fields by category
    const groupedCustomFields = masters.customFields.reduce((acc, field) => {
        const catName = field.category?.name || 'General Information';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(field);
        return acc;
    }, {});

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="text-slate-400 font-bold text-sm">Retrieving student profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onCancel}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 font-outfit tracking-tight">
                            {studentId ? 'Edit Student Profile' : 'Student Admission Registry'}
                        </h2>
                        <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mt-0.5">
                            {studentId ? `Correcting Record: ${form.first_name}` : `Application for Section ${section.name}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-xs font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 uppercase tracking-widest"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {studentId ? 'Update Profile' : 'Save Student'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-x-12 gap-y-16 py-4">
                {/* 1. Identity Segment */}
                <div className="md:col-span-8 space-y-12">
                    <div>
                        <SectionHeader icon={User} title="Student Identity" desc="Primary identification details" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title *</label>
                                <select
                                    className="bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-bold text-slate-700 text-sm"
                                    required
                                    value={form.title_id}
                                    onChange={e => setForm({ ...form, title_id: e.target.value })}
                                >
                                    <option value="">Select Title</option>
                                    {masters.titles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender *</label>
                                <div className="flex gap-3">
                                    {['Male', 'Female', 'Other'].map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setForm({ ...form, gender: g })}
                                            className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black transition-all border-2 uppercase tracking-widest ${form.gender === g ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name *</label>
                                <input type="text" required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-bold text-slate-700 text-sm" placeholder="John" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Middle Name</label>
                                <input type="text" value={form.middle_name} onChange={e => setForm({ ...form, middle_name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-bold text-slate-700 text-sm" placeholder="Quincy" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                                <input type="text" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-bold text-slate-700 text-sm" placeholder="Doe" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                                <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-bold text-slate-700 text-sm uppercase" />
                            </div>
                        </div>
                    </div>

                    {/* 2. Academic Segment */}
                    <div>
                        <SectionHeader icon={Book} title="Academic Record" desc="Enrollment & joining details" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enrollment No *</label>
                                <input type="text" required value={form.admission_no} onChange={e => setForm({ ...form, admission_no: e.target.value })} className="w-full bg-blue-50/50 border border-blue-100 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 text-sm" placeholder="ADM/2026/001" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Roll Number</label>
                                <input type="text" value={form.roll_no} onChange={e => setForm({ ...form, roll_no: e.target.value })} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 text-sm" placeholder="e.g. 15" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Joining</label>
                                <input type="date" value={form.doj} onChange={e => setForm({ ...form, doj: e.target.value })} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 text-sm uppercase" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Category</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 text-sm"
                                    value={form.student_category_id}
                                    onChange={e => setForm({ ...form, student_category_id: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {masters.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Photo & Stats */}
                <div className="md:col-span-4 space-y-10">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center">
                        <label className="relative group cursor-pointer mb-6">
                            <div className="w-40 h-48 rounded-[2rem] bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-[1.02]">
                                {form.avatar ? (
                                    <img src={URL.createObjectURL(form.avatar)} className="w-full h-full object-cover" />
                                ) : existingPhoto ? (
                                    <img src={`/storage/${existingPhoto}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                        <Camera size={48} strokeWidth={1.5} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:bg-blue-700 transition-colors">
                                <Camera size={20} />
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={e => setForm({ ...form, avatar: e.target.files[0] })} />
                        </label>
                        <h4 className="font-bold text-slate-800 font-outfit">Student Photograph</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Recommended: 400x500px</p>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                        <Shield className="mb-4 opacity-50" size={32} />
                        <h4 className="text-lg font-black font-outfit leading-tight mb-2">Academic Integrity</h4>
                        <p className="text-xs font-bold text-indigo-100 leading-relaxed uppercase tracking-wider opacity-80">All records are stored with audit logs. Please ensure ID numbers match official documents.</p>
                    </div>
                </div>

                <div className="md:col-span-12 h-px bg-slate-100 my-4" />

                {/* 3. Family Segment */}
                <div className="md:col-span-6">
                    <SectionHeader icon={Phone} title="Family Contacts" desc="Gardian communication details" />
                    <div className="space-y-6 max-w-md">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Father's Mobile No.</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input type="text" value={form.father_mobile_no} onChange={e => setForm({ ...form, father_mobile_no: e.target.value })} className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 text-sm" placeholder="+91 00000 00000" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Father's Email ID</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input type="email" value={form.father_email_id} onChange={e => setForm({ ...form, father_email_id: e.target.value })} className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 text-sm" placeholder="father@example.com" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Geography Segment */}
                <div className="md:col-span-6">
                    <SectionHeader icon={Globe} title="Location Details" desc="Current residential geography" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                            <select value={form.country_id} onChange={e => handleLocationChange('country_id', e.target.value)} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm">
                                <option value="">Select Country</option>
                                {masters.countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                            <select value={form.state_id} onChange={e => handleLocationChange('state_id', e.target.value)} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm">
                                <option value="">Select State</option>
                                {masters.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2 sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                            <select value={form.city_id} onChange={e => setForm({ ...form, city_id: e.target.value })} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm">
                                <option value="">Select City</option>
                                {masters.cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-12 h-px bg-slate-100 my-4" />

                {/* 5. Identification Segment */}
                <div className="md:col-span-12">
                    <SectionHeader icon={FileText} title="National Identification" desc="Government assigned unique IDs" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">APAAR ID</label>
                            <input type="text" value={form.apaar_id} onChange={e => setForm({ ...form, apaar_id: e.target.value })} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 text-sm" placeholder="12-digit APAAR" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scholar ID</label>
                            <input type="text" value={form.scholar_id} onChange={e => setForm({ ...form, scholar_id: e.target.value })} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 text-sm" placeholder="SCHOLAR123" />
                        </div>
                    </div>
                </div>

                {/* 6. Dynamic Custom Fields */}
                <div className="md:col-span-12 space-y-16 mt-8">
                    {Object.entries(groupedCustomFields).map(([catName, fields]) => (
                        <div key={catName}>
                            <SectionHeader icon={LayoutGrid} title={catName} desc="Custom data as configured by institution" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {fields.map(field => (
                                    <div key={field.id} className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.field_name}</label>
                                        <input
                                            type="text"
                                            value={form.custom_fields[field.id] || ''}
                                            className="bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm"
                                            onChange={(e) => setForm({
                                                ...form,
                                                custom_fields: { ...form.custom_fields, [field.id]: e.target.value }
                                            })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </form>
        </div>
    );
};

export default StudentAdmissionForm;
