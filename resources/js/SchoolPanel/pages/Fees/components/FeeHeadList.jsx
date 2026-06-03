import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, Search, X, Check, CheckSquare, Square, ToggleLeft, ToggleRight, School, GraduationCap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { toast } from 'react-hot-toast';

const FeeHeadList = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { selectedSession } = useSession();

  const [heads, setHeads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHead, setEditingHead] = useState(null);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    is_admission_fee: false,
    is_refundable: false,
    is_once_a_year: false,
    is_once_a_career: false,
    student_category_id: '',
    school_id: ''
  });

  useEffect(() => {
    if (selectedBranch && selectedSession) {
      fetchHeads();
      fetchCategories();
    }
  }, [selectedBranch, selectedSession]);

  const fetchHeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('fee-heads', {
        params: { branch_id: selectedBranch.id, session_id: selectedSession.id }
      });
      setHeads(res.data);
    } catch (err) {
      toast.error('Failed to fetch fee heads');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('student-categories', { params: { session_id: selectedSession.id } });
      setCategories(res.data);
    } catch (err) { }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      branch_id: selectedBranch.id,
      session_id: selectedSession.id
    };

    try {
      if (editingHead) {
        await api.put(`fee-heads/${editingHead.id}`, payload);
        toast.success('Fee Head updated');
      } else {
        await api.post('fee-heads', payload);
        toast.success('Fee Head created');
      }
      fetchHeads();
      handleCloseModal();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (head) => {
    setEditingHead(head);
    setFormData({
      name: head.name,
      short_name: head.short_name || '',
      is_admission_fee: !!head.is_admission_fee,
      is_refundable: !!head.is_refundable,
      is_once_a_year: !!head.is_once_a_year,
      is_once_a_career: !!head.is_once_a_career,
      student_category_id: head.student_category_id || '',
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingHead(null);
    setFormData({
      name: '', short_name: '', is_admission_fee: false, is_refundable: false,
      is_once_a_year: false, is_once_a_career: false, student_category_id: ''
    });
  };

  const toggleActive = async (head) => {
    try {
      await api.put(`fee-heads/${head.id}`, { is_active: !head.is_active });
      setHeads(heads.map(h => h.id === head.id ? { ...h, is_active: !h.is_active } : h));
    } catch (err) { }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`fee-heads/${id}`);
      fetchHeads();
      toast.success('Deleted');
    } catch (err) { }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Fee Heads</h2>
        <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all font-bold text-sm">
          <Plus size={18} /> Add Fee Head
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Checks</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {heads.map(h => (
              <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-700">{h.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold">{h.short_name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-tighter">
                    {!!h.is_admission_fee && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">Admission</span>}
                    {!!h.is_refundable && <span className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded">Refundable</span>}
                    {!!h.is_once_a_year && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded">Yearly</span>}
                    {!!h.is_once_a_career && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">Career</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-500">{h.category?.name || 'All'}</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleActive(h)} className={`transition-all ${h.is_active ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {h.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(h)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><PenBox size={16} /></button>
                    <button onClick={() => handleDelete(h.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">{editingHead ? 'Edit Fee Head' : 'Add Fee Head'}</h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Head Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Short Name</label>
                  <input type="text" value={formData.short_name} onChange={e => setFormData({ ...formData, short_name: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Student Category</label>
                  <select value={formData.student_category_id} onChange={e => setFormData({ ...formData, student_category_id: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Admission Fee', field: 'is_admission_fee' },
                  { label: 'Refundable', field: 'is_refundable' },
                  { label: 'Once a Year', field: 'is_once_a_year' },
                  { label: 'Once a Career', field: 'is_once_a_career' },
                ].map(check => (
                  <button type="button" key={check.field} onClick={() => setFormData({ ...formData, [check.field]: !formData[check.field] })} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all group ${formData[check.field] ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                    {formData[check.field] ? <CheckSquare size={18} /> : <Square size={18} className="group-hover:text-slate-400" />}
                    <span className="text-[11px] font-bold uppercase tracking-wide">{check.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] bg-slate-800 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">Save Fee Head</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeHeadList;
