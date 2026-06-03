import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useSession } from '../../../context/SessionContext';
import { Loader2, Plus, PenBox, Trash2, FileText, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentDocuments = () => {
    const { selectedSession } = useSession();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal & Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', short_name: '' });

    useEffect(() => {
        if (selectedSession) fetchDocuments();
    }, [selectedSession]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await api.get(`student-documents?session_id=${selectedSession.id}`);
            setDocuments(res.data);
        } catch (err) {
            toast.error('Failed to fetch documents');
        } finally { setLoading(false); }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setForm({ name: item.name, short_name: item.short_name || '' });
        } else {
            setEditingItem(null);
            setForm({ name: '', short_name: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = { ...form, session_id: selectedSession.id };
            if (editingItem) {
                await api.put(`student-documents/${editingItem.id}`, data);
                toast.success('Document updated');
            } else {
                await api.post('student-documents', data);
                toast.success('Document created');
            }
            fetchDocuments();
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this document type?')) return;
        try {
            await api.delete(`student-documents/${id}`);
            toast.success('Document deleted');
            fetchDocuments();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const filtered = documents.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.short_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-sm">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 font-outfit">Student Documents</h3>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Manage required documentation list for admissions.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find document..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-sm font-medium focus:ring-4 focus:ring-sky-100 outline-none w-48 transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-sky-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-sky-100 hover:bg-sky-700 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> New Document
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Loader2 size={32} className="animate-spin text-sky-500" />
                    <span className="text-xs font-black uppercase tracking-widest">Loading Records...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(doc => (
                        <div key={doc.id} className="bg-white border border-slate-100 p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-100/50 transition-all group overflow-hidden relative">
                            <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-800 font-outfit">{doc.name}</h4>
                                        {doc.short_name && <span className="px-2 py-0.5 bg-sky-50 text-[10px] font-black text-sky-600 uppercase rounded-lg border border-sky-100">{doc.short_name}</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">Tracking and storage of student records.</p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleOpenModal(doc)} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"><PenBox size={16} /></button>
                                    <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-16 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl">
                            <FileText size={40} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-slate-400 font-bold text-sm">No student documents found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/11 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800 font-outfit">{editingItem ? 'Edit Document' : 'New Document'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Document Name *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-4 focus:ring-sky-100 focus:border-sky-500 outline-none font-bold text-slate-700 transition-all"
                                    placeholder="e.g. Birth Certificate, TC, Marksheet"
                                />
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Short Name / Code</label>
                                <input 
                                    type="text" 
                                    value={form.short_name}
                                    onChange={e => setForm({...form, short_name: e.target.value})}
                                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-4 focus:ring-sky-100 focus:border-sky-500 outline-none font-bold text-slate-700 transition-all"
                                    placeholder="e.g. BC, TC, MS"
                                />
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="flex-[2] bg-sky-600 text-white px-8 py-3.5 rounded-xl shadow-lg shadow-sky-100 hover:bg-sky-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : editingItem ? 'Save Changes' : 'Create Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDocuments;
