import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Filter, 
    MoreHorizontal, 
    Edit, 
    Trash2, 
    ChevronLeft, 
    ChevronRight,
    Download,
    CreditCard,
    User,
    Layers,
    Calendar,
    Hash,
    Phone,
    MapPin,
    Clock,
    Video,
    CheckCircle,
    ChevronDown
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useSession } from '../../../context/SessionContext';
import { useBranch } from '../../../context/BranchContext';

const ProspectusList = () => {
    const { selectedSession } = useSession();
    const { selectedBranch } = useBranch();
    
    const [prospectuses, setProspectuses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProspectus, setEditingProspectus] = useState(null);
    const [formData, setFormData] = useState({
        form_no: '',
        class_id: '',
        name: '',
        father_name: '',
        mobile_no: '',
        total_amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'Cash',
        interaction_type: 'Person',
        reference_number: '',
        meeting_id: '',
        test_date: '',
        test_time: ''
    });

    const paymentModes = ['Cash', 'Cheque', 'Bank', 'DD', 'NEFT', 'Debit/Credit Card', 'Net Banking', 'IMPS', 'TPT', 'UPI'];
    const interactionTypes = ['Person', 'Online'];

    useEffect(() => {
        if (selectedSession && selectedBranch) {
            fetchProspectuses();
            fetchClasses();
        }
    }, [selectedSession, selectedBranch, pagination.current_page, searchTerm]);

    const fetchProspectuses = async () => {
        try {
            setLoading(true);
            const response = await api.get('prospectus', {
                params: {
                    page: pagination.current_page,
                    per_page: pagination.per_page,
                    search: searchTerm
                }
            });
            setProspectuses(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                per_page: response.data.per_page
            });
        } catch (error) {
            toast.error('Failed to fetch prospectuses');
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await api.get('classes', {
                params: { session_id: selectedSession.id }
            });
            setClasses(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch classes');
        }
    };

    const handleOpenModal = async (prospectus = null) => {
        if (prospectus) {
            setEditingProspectus(prospectus);
            setFormData({
                form_no: prospectus.form_no,
                class_id: prospectus.class_id,
                name: prospectus.name,
                father_name: prospectus.father_name,
                mobile_no: prospectus.mobile_no,
                total_amount: prospectus.total_amount,
                payment_date: prospectus.payment_date,
                payment_mode: prospectus.payment_mode,
                interaction_type: prospectus.interaction_type,
                reference_number: prospectus.reference_number || '',
                meeting_id: prospectus.meeting_id || '',
                test_date: prospectus.test_date || '',
                test_time: prospectus.test_time || ''
            });
            setIsModalOpen(true);
        } else {
            setEditingProspectus(null);
            try {
                const res = await api.get('prospectus/next-form-no');
                setFormData({
                    form_no: res.data.next_form_no,
                    class_id: '',
                    name: '',
                    father_name: '',
                    mobile_no: '',
                    total_amount: '',
                    payment_date: new Date().toISOString().split('T')[0],
                    payment_mode: 'Cash',
                    interaction_type: 'Person',
                    reference_number: '',
                    meeting_id: '',
                    test_date: '',
                    test_time: ''
                });
                setIsModalOpen(true);
            } catch (err) {
                toast.error('Failed to generate form number');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProspectus) {
                await api.put(`prospectus/${editingProspectus.id}`, formData);
                toast.success('Prospectus updated successfully');
            } else {
                await api.post('prospectus', formData);
                toast.success('Prospectus created successfully');
            }
            setIsModalOpen(false);
            fetchProspectuses();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this prospectus?')) {
            try {
                await api.delete(`prospectus/${id}`);
                toast.success('Prospectus deleted successfully');
                fetchProspectuses();
            } catch (error) {
                toast.error('Failed to delete prospectus');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name, form no, or mobile..." 
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        <Plus size={18} />
                        Add Prospectus
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                <table className="w-full text-left border-collapse bg-white">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Form No.</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Father's Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Payment</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && prospectuses.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading prospectuses...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : prospectuses.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            prospectuses.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-sm">
                                            #{item.form_no}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                                    <td className="px-6 py-4 font-medium text-slate-600">{item.class?.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{item.father_name}</td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{item.mobile_no}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">₹{parseFloat(item.total_amount).toLocaleString()}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">{item.payment_mode}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(item)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.per_page && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-slate-500 font-medium">
                        Showing <span className="font-bold text-slate-900">{(pagination.current_page - 1) * pagination.per_page + 1}</span> to <span className="font-bold text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of <span className="font-bold text-slate-900">{pagination.total}</span> entries
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={pagination.current_page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                            className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all font-bold"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        {[...Array(pagination.last_page)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPagination(prev => ({ ...prev, current_page: i + 1 }))}
                                className={`w-10 h-10 rounded-xl transition-all font-bold text-sm ${
                                    pagination.current_page === i + 1
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                        : 'text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button 
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                            className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all font-bold"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col scale-in animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 font-outfit">
                                    {editingProspectus ? 'Update Prospectus' : 'New Admission Prospectus'}
                                </h2>
                                <p className="text-slate-500 font-medium text-sm">Please fill in all the required fields correctly.</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl transition-colors border border-slate-200 shadow-sm"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-8 no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Form No. <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="Enter Form Number"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.form_no}
                                            onChange={(e) => setFormData({ ...formData, form_no: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Class <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select 
                                            required
                                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.class_id}
                                            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Name <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="Student Full Name"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Father's Name <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="Father's Full Name"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.father_name}
                                            onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mobile No. <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required
                                            type="tel" 
                                            placeholder="Primary contact number"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.mobile_no}
                                            onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Total Amount <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required
                                            type="number" 
                                            placeholder="Amount Paid (₹)"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.total_amount}
                                            onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Payment Date <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required
                                            type="date" 
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.payment_date}
                                            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Payment Mode <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select 
                                            required
                                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.payment_mode}
                                            onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                                        >
                                            {paymentModes.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Reference Number</label>
                                    <div className="relative">
                                        <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Cheque/TXN ID (Optional)"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.reference_number}
                                            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Interaction Info */}
                                <div className="col-span-full mt-4">
                                    <div className="h-px bg-slate-100 w-full mb-6"></div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <CheckCircle size={18} className="text-blue-500" />
                                        Interaction & Testing Details
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Interaction Type <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select 
                                            required
                                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.interaction_type}
                                            onChange={(e) => setFormData({ ...formData, interaction_type: e.target.value })}
                                        >
                                            {interactionTypes.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Meeting ID</label>
                                    <div className="relative">
                                        <Video size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Online Meeting ID (Optional)"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.meeting_id}
                                            onChange={(e) => setFormData({ ...formData, meeting_id: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Test Date</label>
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="date" 
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.test_date}
                                            onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Test Time</label>
                                    <div className="relative">
                                        <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="time" 
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                            value={formData.test_time}
                                            onChange={(e) => setFormData({ ...formData, test_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount to Pay</p>
                                        <p className="text-2xl font-black text-slate-900 font-outfit tracking-tight">₹{formData.total_amount ? parseFloat(formData.total_amount).toLocaleString() : '0'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 md:flex-none px-8 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 md:flex-none px-10 py-3.5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-xl shadow-blue-200 active:scale-95"
                                    >
                                        {editingProspectus ? 'Update Record' : 'Save Prospectus'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProspectusList;
