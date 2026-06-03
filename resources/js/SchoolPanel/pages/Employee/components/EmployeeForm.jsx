import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../utils/api';
import { 
    Briefcase, 
    User, 
    Mail, 
    Phone, 
    Shield, 
    Globe, 
    Calendar, 
    Camera, 
    Loader2, 
    ChevronLeft,
    ChevronDown,
    CheckCircle2,
    XCircle,
    Building2,
    Lock,
    UserSquare2,
    FileText,
    LayoutGrid,
    Upload,
    Crop,
    Check,
    MapPin,
    Tags
} from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'react-hot-toast';
import { useBranch } from '../../../context/BranchContext';

const ASPECT_RATIO = 4 / 5;

const EmployeeForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { selectedBranch } = useBranch();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    
    // Master data
    const [titles, setTitles] = useState([]);
    const [roles, setRoles] = useState([]);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [customFieldCategories, setCustomFieldCategories] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        title_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: 'Male',
        dob: '',
        doj: '',
        mobile_number: '', // mapping to phone
        email: '',
        username: '',
        password: '',
        employee_type: 'Teaching Staff',
        attendance_code: '',
        role: 'staff',
        custom_roles: [],
        country_id: '',
        state_id: '',
        city_id: '',
        photo: null,
    });
    
    const [customFieldValues, setCustomFieldValues] = useState({});
    const [employeeDocuments, setEmployeeDocuments] = useState({});
    const [photoPreview, setPhotoPreview] = useState(null);

    // Cropper state
    const [showCropper, setShowCropper] = useState(false);
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const imgRef = useRef(null);

    useEffect(() => {
        fetchInitialData();
        if (isEdit) fetchEmployee();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            const [titlesRes, rolesRes, countriesRes, cfRes, docTypesRes] = await Promise.all([
                api.get('titles'),
                api.get('roles'),
                api.get('countries'),
                api.get('custom-field-categories', { params: { type: 'Employee' }}),
                api.get('staff-document-types')
            ]);
            setTitles(titlesRes.data);
            setRoles(rolesRes.data);
            setCountries(countriesRes.data);
            setCustomFieldCategories(cfRes.data.filter(c => c.type === 'Employee'));
            setDocumentTypes(docTypesRes.data.filter(d => d.is_active));
        } catch (err) {
            toast.error('Failed to load form data');
        }
    };

    const fetchEmployee = async () => {
        try {
            const res = await api.get(`users/${id}`);
            const user = res.data;
            const empData = user.employee || {};
            setFormData({
                ...formData,
                // Personal identity fields (users table)
                title_id: user.title_id || '',
                first_name: user.first_name || '',
                middle_name: user.middle_name || '',
                last_name: user.last_name || '',
                gender: user.gender || 'Male',
                dob: user.dob || '',
                mobile_number: user.mobile_number || user.phone || '',
                email: user.email || '',
                username: user.username || '',
                // Employment fields (employees table)
                doj: empData.doj || '',
                employee_type: empData.employee_type || 'Teaching Staff',
                attendance_code: empData.attendance_code || '',
                role: user.role || 'staff',
                custom_roles: user.roles?.map(r => r.name).filter(n => n !== (user.role || 'staff')) || [],
                country_id: empData.country_id || '',
                state_id: empData.state_id || '',
                city_id: empData.city_id || '',
            });
            
            if (user.avatar) setPhotoPreview(`/storage/${user.avatar}`);
            
            // Handle custom field values from employee
            const cfValues = {};
            empData.custom_field_values?.forEach(cv => {
                cfValues[cv.custom_field_id] = cv.field_value;
            });
            setCustomFieldValues(cfValues);

            // Fetch dependent data
            if (empData.country_id) fetchStates(empData.country_id);
            if (empData.state_id) fetchCities(empData.state_id);
            
        } catch (err) {
            toast.error('Failed to fetch employee details');
            navigate('/school-panel/employee/view');
        } finally {
            setLoading(false);
        }
    };

    const fetchStates = async (countryId) => {
        try {
            const res = await api.get('states', { params: { country_id: countryId }});
            setStates(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchCities = async (stateId) => {
        try {
            const res = await api.get('cities', { params: { state_id: stateId }});
            setCities(res.data);
        } catch (err) { console.error(err); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'country_id') {
            setStates([]);
            setCities([]);
            setFormData(prev => ({ ...prev, state_id: '', city_id: '' }));
            if (value) fetchStates(value);
        }
        if (name === 'state_id') {
            setCities([]);
            setFormData(prev => ({ ...prev, city_id: '' }));
            if (value) fetchCities(value);
        }
    };

    const handleRoleChange = (roleName) => {
        setFormData(prev => {
            const current = [...prev.custom_roles];
            if (current.includes(roleName)) {
                return { ...prev, custom_roles: current.filter(r => r !== roleName) };
            } else {
                return { ...prev, custom_roles: [...current, roleName] };
            }
        });
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        const initialCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, ASPECT_RATIO, width, height),
            width,
            height
        );
        setCrop(initialCrop);
    };

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() || '');
                setShowCropper(true);
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCropDone = async () => {
        if (!completedCrop || !imgRef.current) return;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Chrome and other browsers do not currently support AVIF encoding natively via canvas.toBlob.
        // Requesting 'image/avif' silently falls back to 'image/png', resulting in large file sizes.
        // We use 'image/webp' instead to guarantee modern, lightweight compression out-of-the-box.
        canvas.toBlob((blob) => {
            if (blob) {
                const extension = blob.type === 'image/webp' ? 'webp' : 'png';
                const file = new File([blob], `photo.${extension}`, { type: blob.type });
                setFormData(prev => ({ ...prev, photo: file }));
                setPhotoPreview(URL.createObjectURL(blob));
                setShowCropper(false);
            }
        }, 'image/webp', 0.9);
    };

    const handleDocumentChange = (docTypeId, file) => {
        setEmployeeDocuments(prev => ({ ...prev, [docTypeId]: file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'custom_roles') {
                    formData[key].forEach(r => data.append('custom_roles[]', r));
                } else if (key === 'photo') {
                    if (formData[key]) data.append('photo', formData[key]);
                } else {
                    data.append(key, formData[key]);
                }
            });

            // mobile_number is already included in formData and the backend maps it to phone

            // Add custom fields
            Object.keys(customFieldValues).forEach(fieldId => {
                data.append(`custom_fields[${fieldId}]`, customFieldValues[fieldId]);
            });

            // Add documents
            Object.keys(employeeDocuments).forEach(docTypeId => {
                if (employeeDocuments[docTypeId]) {
                    data.append(`documents[${docTypeId}]`, employeeDocuments[docTypeId]);
                }
            });

            if (isEdit) {
                // Laravel doesn't support multipart form data for PUT requests, so use POST with _method spoofing
                data.append('_method', 'PUT');
                await api.post(`users/${id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Employee updated successfully');
            } else {
                await api.post('users', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Employee created successfully');
            }
            navigate('/school-panel/employee/view');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-violet-600" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Personnel File...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button 
                        onClick={() => navigate('/school-panel/employee/view')}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:shadow-lg transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 font-outfit tracking-tight">
                            {isEdit ? 'Update Personnel Profile' : 'Onboard New Employee'}
                        </h2>
                        <p className="text-sm text-slate-400 font-medium italic">Complete the professional dossier below.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* 1. Personal Information */}
                <div className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-200">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">Personal Information</h3>
                            <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Identity & Basic Details</p>
                        </div>
                    </div>

                    <div className="p-10 space-y-10">
                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* Photo Upload */}
                            <div className="flex flex-col items-center gap-4 py-4">
                                <div className="relative group cursor-pointer">
                                    <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 border-4 border-white shadow-xl overflow-hidden relative group-hover:shadow-violet-200 transition-all">
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                <Camera size={40} />
                                                <span className="text-[10px] font-black uppercase mt-2">Dossier Photo</span>
                                            </div>
                                        )}
                                        <label className="absolute inset-0 bg-violet-600/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                            <Camera size={24} />
                                            <span className="text-[10px] font-black uppercase mt-1">Upload Photo</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                        </label>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border border-slate-50 flex items-center justify-center text-violet-600">
                                        <Camera size={18} />
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Passport Size Recommended</p>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                                {/* Title */}
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1 flex items-center gap-2">
                                        Title <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative group/field">
                                        <UserSquare2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                        <select 
                                            name="title_id"
                                            required
                                            value={formData.title_id}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-10 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all appearance-none"
                                        >
                                            <option value="">Select Title</option>
                                            {titles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* First Name */}
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1 flex items-center gap-2">
                                        First Name <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative group/field">
                                        <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                        <input 
                                            type="text" 
                                            name="first_name"
                                            required
                                            placeholder="Gaurav"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all" 
                                        />
                                    </div>
                                </div>

                                {/* Middle Name */}
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Middle Name</label>
                                    <div className="relative group/field">
                                        <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                        <input 
                                            type="text" 
                                            name="middle_name"
                                            placeholder="Kumar"
                                            value={formData.middle_name}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all" 
                                        />
                                    </div>
                                </div>

                                {/* Last Name */}
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Last Name</label>
                                    <div className="relative group/field">
                                        <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                        <input 
                                            type="text" 
                                            name="last_name"
                                            required
                                            placeholder="Sharma"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all" 
                                        />
                                    </div>
                                </div>

                                {/* Gender */}
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Gender</label>
                                    <div className="flex p-1 bg-slate-100 rounded-[1.25rem] gap-1">
                                        {['Male', 'Female'].map(g => (
                                            <button 
                                                key={g}
                                                type="button" 
                                                onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                                                className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                                    formData.gender === g 
                                                        ? 'bg-white text-violet-600 shadow-sm' 
                                                        : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* DOB */}
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Date of Birth</label>
                                    <div className="relative group/field">
                                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                        <input 
                                            type="date" 
                                            name="dob"
                                            required
                                            value={formData.dob}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-50 w-full"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {/* DOJ */}
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Date of Joining</label>
                                <div className="relative group/field">
                                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                    <input 
                                        type="date" 
                                        name="doj"
                                        required
                                        value={formData.doj}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all" 
                                    />
                                </div>
                            </div>

                            {/* Mobile Number */}
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Mobile Number <span className="text-rose-500">*</span></label>
                                <div className="relative group/field">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                    <input 
                                        type="tel" 
                                        name="mobile_number"
                                        required
                                        placeholder="+91 98765 43210"
                                        value={formData.mobile_number}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all" 
                                    />
                                </div>
                            </div>

                            {/* Username */}
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Username <span className="text-rose-500">*</span></label>
                                <div className="relative group/field">
                                    <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        name="username"
                                        required
                                        placeholder="gaurav_staff"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all" 
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">{isEdit ? 'New Password (Optional)' : 'Password *'}</label>
                                <div className="relative group/field">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                    <input 
                                        type="password" 
                                        name="password"
                                        required={!isEdit}
                                        placeholder="********"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all" 
                                    />
                                </div>
                            </div>

                            {/* Employee Type */}
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Employee Type</label>
                                <div className="relative group/field">
                                    <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                    <select 
                                        name="employee_type"
                                        value={formData.employee_type}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-10 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all appearance-none"
                                    >
                                        <option value="Teaching Staff">Teaching Staff</option>
                                        <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                                        <option value="Management">Management</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Attendance Code */}
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Attendance Code</label>
                                <div className="relative group/field">
                                    <LayoutGrid size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        name="attendance_code"
                                        placeholder="EDP-101"
                                        value={formData.attendance_code}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all" 
                                    />
                                </div>
                            </div>

                            {/* Email ID */}
                            <div className="space-y-1.5 flex flex-col col-span-1 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Email ID</label>
                                <div className="relative group/field">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                    <input 
                                        type="email" 
                                        name="email"
                                        required
                                        placeholder="gaurav@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Roles & Operations */}
                <div className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-sky-500/5 transition-all overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-200">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">Access & Operations Role</h3>
                            <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Dynamic Permission Assignment</p>
                        </div>
                    </div>

                    <div className="p-10">
                        <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {roles.filter(r => !['owner', 'superuser', 'parent'].includes(r.name)).map(role => (
                                <label key={role.id} className="flex items-center gap-3 cursor-pointer group/role">
                                    <div 
                                        onClick={() => handleRoleChange(role.name)}
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
                                            formData.custom_roles.includes(role.name) || formData.role === role.name
                                                ? 'bg-sky-600 border-sky-600 text-white' 
                                                : 'bg-white border-slate-200 group-hover/role:border-sky-400'
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${formData.custom_roles.includes(role.name) || formData.role === role.name ? 'scale-100' : 'scale-0'} transition-transform bg-white`} />
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-widest ${
                                        formData.custom_roles.includes(role.name) || formData.role === role.name ? 'text-slate-800' : 'text-slate-400'
                                    }`}>
                                        {role.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Location Information */}
                <div className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">Place of Origin</h3>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Regional Location Details</p>
                        </div>
                    </div>

                    <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Country */}
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Country</label>
                            <div className="relative group/field">
                                <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-emerald-500 transition-colors" />
                                <select 
                                    name="country_id"
                                    value={formData.country_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-10 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-500 transition-all appearance-none"
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* State */}
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">State</label>
                            <div className="relative group/field">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-emerald-500 transition-colors" />
                                <select 
                                    name="state_id"
                                    disabled={!formData.country_id}
                                    value={formData.state_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-10 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-500 transition-all appearance-none disabled:opacity-50"
                                >
                                    <option value="">Select State</option>
                                    {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* City */}
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">City</label>
                            <div className="relative group/field">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-emerald-500 transition-colors" />
                                <select 
                                    name="city_id"
                                    disabled={!formData.state_id}
                                    value={formData.city_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-10 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-500 transition-all appearance-none disabled:opacity-50"
                                >
                                    <option value="">Select City</option>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Custom Information Groups */}
                {customFieldCategories.map(category => (
                    <div key={category.id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">{category.name}</h3>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Custom Metadata Segment</p>
                            </div>
                        </div>

                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {category.custom_fields?.map(field => (
                                <div key={field.id} className="space-y-1.5 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">
                                        {field.name} {field.is_mandatory && <span className="text-rose-500">*</span>}
                                    </label>
                                    {field.field_type === 'Textbox' && (
                                        <input 
                                            type="text" 
                                            placeholder={field.placeholder}
                                            required={field.is_mandatory}
                                            value={customFieldValues[field.id] || ''}
                                            onChange={(e) => setCustomFieldValues({...customFieldValues, [field.id]: e.target.value})}
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl p-3.5 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all"
                                        />
                                    )}
                                    {field.field_type === 'textarea' && (
                                        <textarea 
                                            placeholder={field.placeholder}
                                            required={field.is_mandatory}
                                            value={customFieldValues[field.id] || ''}
                                            onChange={(e) => setCustomFieldValues({...customFieldValues, [field.id]: e.target.value})}
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl p-3.5 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all min-h-[100px]"
                                        />
                                    )}
                                    {field.field_type === 'date' && (
                                        <input 
                                            type="date" 
                                            required={field.is_mandatory}
                                            value={customFieldValues[field.id] || ''}
                                            onChange={(e) => setCustomFieldValues({...customFieldValues, [field.id]: e.target.value})}
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl p-3.5 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all"
                                        />
                                    )}
                                    {field.field_type === 'Pulldown' && (
                                        <div className="relative group/field">
                                            <Tags size={18} className="absolute left-4 top-1/2 -translate-y-1-2 text-slate-400 group-focus-within/field:text-violet-500 transition-colors" />
                                            <select 
                                                required={field.is_mandatory}
                                                value={customFieldValues[field.id] || ''}
                                                onChange={(e) => setCustomFieldValues({...customFieldValues, [field.id]: e.target.value})}
                                                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-10 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all appearance-none"
                                            >
                                                <option value="">Select Option</option>
                                                {field.options?.split(',').map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* 5. Employee Documents */}
                <div className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">Personnel Dossier (Documents)</h3>
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Required Verification Files</p>
                        </div>
                    </div>

                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {documentTypes.map(doc => (
                            <div key={doc.id} className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">
                                    {doc.name} {doc.short_name && <span className="text-slate-300 ml-1">({doc.short_name})</span>}
                                </label>
                                <div className="relative group/doc">
                                    <div className={`
                                        relative w-full bg-slate-50/50 border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-2
                                        ${employeeDocuments[doc.id] ? 'border-orange-200 bg-orange-50/20' : 'border-slate-100 group-hover/doc:border-orange-300'}
                                    `}>
                                        {employeeDocuments[doc.id] ? (
                                            <>
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-bold text-slate-700 truncate">{employeeDocuments[doc.id].name}</p>
                                                        <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">{(employeeDocuments[doc.id].size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleDocumentChange(doc.id, null)}
                                                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center group-hover/doc:bg-orange-100 group-hover/doc:text-orange-500 transition-all">
                                                    <Upload size={18} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Select File</p>
                                                <input 
                                                    type="file" 
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={(e) => handleDocumentChange(doc.id, e.target.files[0])}
                                                />
                                            </>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-1 pl-1 italic">Format: PDF, JPG, PNG (Max 5MB)</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4">
                    <button 
                        type="button" 
                        onClick={() => navigate('/school-panel/employee/view')}
                        className="px-8 py-4 rounded-[1.5rem] bg-white border-2 border-slate-100 text-slate-400 font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-50 transition-all"
                    >
                        Cancel Transaction
                    </button>
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="px-12 py-4 rounded-[1.5rem] bg-violet-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-violet-200 hover:bg-violet-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Synchronizing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={18} />
                                {isEdit ? 'Update Personnel Record' : 'Commit Onboarding'}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Cropper Modal */}
            {showCropper && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg">
                                    <Crop size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 uppercase tracking-tight">Crop Profile Photo</h3>
                                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Fixed 4:5 Aspect Ratio</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowCropper(false)}
                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-8 bg-slate-50/50">
                            <div className="relative flex items-center justify-center bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 p-4 min-h-[300px] max-h-[60vh] overflow-hidden">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c, percentCrop) => setCrop(percentCrop)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={ASPECT_RATIO}
                                    keepSelection
                                    className="max-h-full"
                                >
                                    <img 
                                        ref={imgRef}
                                        src={imgSrc} 
                                        onLoad={onImageLoad}
                                        alt="To Crop" 
                                        className="object-contain"
                                        style={{ maxHeight: '50vh', width: 'auto' }}
                                    />
                                </ReactCrop>
                            </div>
                            <p className="text-center text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">
                                Drag handles to adjust crop area
                            </p>
                        </div>

                        <div className="p-8 bg-white flex items-center justify-end gap-4 shadow-[0_-1px_0_rgba(0,0,0,0.05)]">
                            <button 
                                onClick={() => setShowCropper(false)}
                                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCropDone}
                                className="px-10 py-3 bg-violet-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-violet-200 hover:bg-violet-700 transition-all flex items-center gap-2"
                            >
                                <Check size={16} /> Apply & Optimize
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeForm;
