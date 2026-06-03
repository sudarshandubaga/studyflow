import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, Search, X, Check, CheckSquare, Square, Layers, Eye, Users, Hash } from 'lucide-react';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { toast } from 'react-hot-toast';

const BillSchemeList = () => {
  const { selectedBranch } = useBranch();
  const { selectedSession } = useSession();
  
  const [schemes, setSchemes] = useState([]);
  const [heads, setHeads] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [assignTab, setAssignTab] = useState('sections'); // 'sections' | 'students'
  
  const [filterClassId, setFilterClassId] = useState('');
  const [filterSectionId, setFilterSectionId] = useState('');
  
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilterClassId, setStudentFilterClassId] = useState('');
  const [studentFilterSectionId, setStudentFilterSectionId] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    slab: '',
    details: [{ fee_head_id: '', amount: '' }],
    section_ids: [],
    student_ids: []
  });

  useEffect(() => {
    if (selectedBranch && selectedSession) {
      fetchSchemes();
      fetchHeads();
      fetchClasses();
      fetchSections();
      fetchStudents();
    }
  }, [selectedBranch, selectedSession]);

  useEffect(() => {
    if (showAddModal && !editingScheme && heads.length > 0) {
      setFormData(prev => ({
        ...prev,
        details: heads.map(h => ({ fee_head_id: h.id, amount: 0, head_name: h.name }))
      }));
    }
  }, [showAddModal, heads, editingScheme]);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await api.get('bill-schemes', {
        params: { branch_id: selectedBranch.id, session_id: selectedSession.id }
      });
      setSchemes(res.data);
    } catch { toast.error('Failed to load schemes'); }
    setLoading(false);
  };

  const fetchHeads = async () => {
    const res = await api.get('fee-heads', { params: { branch_id: selectedBranch.id, session_id: selectedSession.id } });
    setHeads(res.data);
  };

  const fetchClasses = async () => {
    const res = await api.get('classes');
    setClasses(res.data);
  };

  const fetchSections = async () => {
    const res = await api.get('sections');
    setSections(res.data);
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('students', { params: { branch_id: selectedBranch.id } });
      setStudents(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch { toast.error('Failed to load students'); }
  };

  const addDetailRow = () => {
    setFormData({...formData, details: [...formData.details, { fee_head_id: '', amount: '' }]});
  };

  const removeDetailRow = (index) => {
    const newDetails = [...formData.details];
    newDetails.splice(index, 1);
    setFormData({...formData, details: newDetails});
  };

  const toggleSelection = (field, id) => {
    const current = [...formData[field]];
    if (current.includes(id)) {
      setFormData({...formData, [field]: current.filter(i => i !== id)});
    } else {
      setFormData({...formData, [field]: [...current, id]});
    }
  };

  const toggleClassSections = (classSections) => {
    const sectionIds = classSections.map(s => s.id);
    const allSelected = sectionIds.every(id => formData.section_ids.includes(id));
    
    let newSectionIds;
    if (allSelected) {
      newSectionIds = formData.section_ids.filter(id => !sectionIds.includes(id));
    } else {
      const toAdd = sectionIds.filter(id => !formData.section_ids.includes(id));
      newSectionIds = [...formData.section_ids, ...toAdd];
    }
    
    setFormData({ ...formData, section_ids: newSectionIds });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      branch_id: selectedBranch.id,
      session_id: selectedSession.id
    };

    try {
      if (editingScheme) {
        await api.put(`bill-schemes/${editingScheme.id}`, payload);
        toast.success('Updated');
      } else {
        await api.post('bill-schemes', payload);
        toast.success('Created');
      }
      fetchSchemes();
      handleCloseModal();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Error saving scheme'); 
    }
  };

  const handleEdit = (scheme) => {
    setEditingScheme(scheme);
    setFormData({
      name: scheme.name,
      date: scheme.date || '',
      slab: scheme.slab || '',
      details: scheme.details.map(d => ({ fee_head_id: d.fee_head_id, amount: d.amount, head_name: d.head?.name })),
      section_ids: scheme.sections.map(s => s.section_id),
      student_ids: scheme.students.map(s => s.student_id)
    });
    setShowAddModal(true);
  };

  const handleOpenAssign = (scheme, tab = 'sections') => {
    setEditingScheme(scheme);
    setFormData({
      name: scheme.name,
      date: scheme.date || '',
      slab: scheme.slab || '',
      details: scheme.details.map(d => ({ fee_head_id: d.fee_head_id, amount: d.amount, head_name: d.head?.name })),
      section_ids: scheme.sections.map(s => s.section_id),
      student_ids: scheme.students.map(s => s.student_id)
    });
    setAssignTab(tab);
    setShowAssignModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowAssignModal(false);
    setEditingScheme(null);
    setFormData({ name: '', date: '', slab: '', details: [{ fee_head_id: '', amount: '' }], section_ids: [], student_ids: [] });
    setStudentSearch('');
    setStudentFilterClassId('');
    setStudentFilterSectionId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Bill Schemes</h2>
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            <select value={filterClassId} onChange={e => {setFilterClassId(e.target.value); setFilterSectionId('');}} className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none border-r border-slate-50 cursor-pointer hover:bg-slate-50 rounded-l-xl transition-colors">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterSectionId} onChange={e => setFilterSectionId(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer hover:bg-slate-50 rounded-r-xl transition-colors">
              <option value="">All Sections</option>
              {sections.filter(s => !filterClassId || s.class_id == filterClassId).map(s => <option key={s.id} value={s.id}>{s.name} ({s.edu_class?.name})</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 italic">
          <Plus size={18} /> Create New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schemes
          .filter(s => {
            if (!filterClassId && !filterSectionId) return true;
            if (filterSectionId) return s.sections.some(ss => ss.section_id == filterSectionId);
            if (filterClassId) return s.sections.some(ss => ss.section?.class_id == filterClassId);
            return true;
          })
          .map(s => (
          <div key={s.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <Layers size={24} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(s)} className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors" title="Edit Scheme"><PenBox size={16} /></button>
                <button onClick={() => {/* delete */}} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors" title="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <h3 className="font-black text-slate-800 text-lg mb-1 leading-tight">{s.name}</h3>
            <div className="flex gap-2 mb-4">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Slab: {s.slab || 'N/A'}</p>
              {s.date && <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">Date: {new Date(s.date).toLocaleDateString()}</p>}
            </div>
            
            <div className="space-y-3 border-t border-slate-50 pt-4 mt-2">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                <span>Fee Breakdown</span>
                <span className="text-emerald-500">Total: ₹{s.details.reduce((sum, d) => sum + parseFloat(d.amount), 0).toLocaleString()}</span>
              </div>
              {s.details.map(d => (
                <div key={d.id} className="flex justify-between items-center text-sm font-bold text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                  <span>{d.head?.name}</span>
                  <span className="text-slate-800">₹{parseFloat(d.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex gap-3">
                <button onClick={() => handleOpenAssign(s, 'sections')} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors">
                  <Layers size={14} /> Assign Sections ({s.sections.length})
                </button>
                <button onClick={() => handleOpenAssign(s, 'students')} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-4 py-2.5 rounded-xl hover:bg-amber-100 transition-colors">
                  <Users size={14} /> Assign Students ({s.students.length})
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">{editingScheme ? <PenBox size={18} /> : <Plus size={18} />}</div>
                  {editingScheme ? `Edit Scheme: ${editingScheme.name}` : 'Create New Bill Scheme'}
                </h3>
              </div>
              <button onClick={handleCloseModal} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-600 border border-slate-100 shadow-sm"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10">
              <div className="space-y-8">
                {/* Basics */}
                <div className="grid grid-cols-3 gap-5">
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Scheme Name</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-4 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-inner" placeholder="Batch 2024-25..." />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Date</label>
                      <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-4 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-inner" />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Slab Name</label>
                      <input type="text" value={formData.slab} onChange={e => setFormData({...formData, slab: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-4 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-inner" placeholder="Q1, Q2..." />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                      Fee Breakdown
                    </label>
                    {formData.details.map((detail, idx) => (
                      <div key={idx} className="flex gap-4 p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl group relative">
                        <div className="flex-1 flex items-center px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                          {heads.find(h => h.id == detail.fee_head_id)?.name || detail.head_name || 'Unknown Head'}
                        </div>
                        <div className="relative w-40">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input type="number" placeholder="Amount" value={detail.amount} onChange={e => {
                            const newD = [...formData.details];
                            newD[idx].amount = e.target.value;
                            setFormData({...formData, details: newD});
                          }} className="w-full bg-white border border-slate-200 pl-8 pr-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-emerald-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 px-10">
                <div className="flex-1 flex items-center text-[10px] font-black text-slate-400 gap-6 uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" /> 
                    Total Fee: <span className="text-slate-800 ml-1">₹{formData.details.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0).toLocaleString()}</span>
                  </span>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={handleCloseModal} className="px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white transition-all">Cancel</button>
                  <button type="button" onClick={handleSubmit} className="bg-slate-900 text-white px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">Save Scheme</button>
                </div>
              </div>
            </div>
          </div>
        )}

      {showAssignModal && editingScheme && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Assignment Manager</p>
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-3">
                  {editingScheme.name}
                </h3>
              </div>
              <button onClick={handleCloseModal} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-600 border border-slate-100 shadow-sm"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-10 py-8">
              <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl mb-8">
                <button onClick={() => setAssignTab('sections')} className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assignTab === 'sections' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Layers size={14} /> Sections ({formData.section_ids.length})
                </button>
                <button onClick={() => setAssignTab('students')} className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assignTab === 'students' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Users size={14} /> Students ({formData.student_ids.length})
                </button>
              </div>

              {assignTab === 'sections' ? (
                <div className="space-y-6">
                  {Object.entries(
                    sections.reduce((acc, s) => {
                      const className = s.edu_class?.name || 'Unassigned';
                      if (!acc[className]) acc[className] = [];
                      acc[className].push(s);
                      return acc;
                    }, {})
                  ).map(([className, classSections]) => (
                    <div key={className} className="space-y-3">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{className}</label>
                        <button 
                          type="button" 
                          onClick={() => toggleClassSections(classSections)}
                          className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50/50 px-2 py-1 rounded-lg transition-colors"
                        >
                          {classSections.every(s => formData.section_ids.includes(s.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {classSections.map(s => (
                          <button key={s.id} type="button" onClick={() => toggleSelection('section_ids', s.id)} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${formData.section_ids.includes(s.id) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100 hover:bg-white shadow-sm'}`}>
                            {formData.section_ids.includes(s.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                            <span className="text-[11px] font-black">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-3 mb-6">
                    <div className="col-span-6 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="text" placeholder="Search name/ENR..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:border-amber-500 outline-none transition-all" />
                    </div>
                    <div className="col-span-3">
                      <select value={studentFilterClassId} onChange={e => {setStudentFilterClassId(e.target.value); setStudentFilterSectionId('');}} className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-amber-500">
                        <option value="">Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <select value={studentFilterSectionId} onChange={e => setStudentFilterSectionId(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-amber-500">
                        <option value="">Sec</option>
                        {sections.filter(s => !studentFilterClassId || s.class_id == studentFilterClassId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {students
                      .filter(s => {
                        const matchesSearch = !studentSearch || 
                          s.first_name?.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          s.last_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.enrollment_no?.toLowerCase().includes(studentSearch.toLowerCase());
                        const matchesSection = !studentFilterSectionId || s.section_id == studentFilterSectionId;
                        const matchesClass = !studentFilterClassId || s.section?.class_id == studentFilterClassId;
                        const isInCategory = formData.section_ids.length === 0 || formData.section_ids.includes(s.section_id);
                        
                        return matchesSearch && matchesSection && matchesClass && isInCategory;
                      })
                      .map(s => (
                        <button key={s.id} type="button" onClick={() => toggleSelection('student_ids', s.id)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${formData.student_ids.includes(s.id) ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100 hover:bg-white shadow-sm'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-[12px] font-black text-slate-400">
                              {s.first_name.charAt(0)}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black leading-tight">{s.first_name} {s.last_name}</p>
                              <p className="text-[10px] font-bold opacity-60">ENR: {s.enrollment_no} | {s.section?.edu_class?.name} - {s.section?.name}</p>
                            </div>
                          </div>
                          {formData.student_ids.includes(s.id) ? <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg"><Check size={14} strokeWidth={4} /></div> : <div className="w-6 h-6 bg-slate-200/50 rounded-full flex items-center justify-center text-slate-400"><Plus size={14} /></div>}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 px-10">
              <button type="button" onClick={handleCloseModal} className="flex-1 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white transition-all">Close</button>
              <button type="button" onClick={handleSubmit} className="flex-[2] bg-slate-900 text-white px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 italic">Apply Assignments</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillSchemeList;
