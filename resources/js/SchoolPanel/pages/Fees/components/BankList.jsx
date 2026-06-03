import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Loader2, Plus, PenBox, Trash2, Search, X, Check, Landmark, School } from 'lucide-react';
import { useBranch } from '../../../context/BranchContext';
import { toast } from 'react-hot-toast';

const BankList = () => {
  const { selectedBranch } = useBranch();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', school_id: '' });

  useEffect(() => {
    if (selectedBranch) {
      fetchBanks();
    }
  }, [selectedBranch]);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await api.get('fee-banks', { params: { branch_id: selectedBranch.id } });
      setBanks(res.data);
    } catch { toast.error('Failed to load banks'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, branch_id: selectedBranch.id };
    try {
      if (editingBank) await api.put(`fee-banks/${editingBank.id}`, payload);
      else await api.post('fee-banks', payload);
      fetchBanks();
      handleCloseModal();
      toast.success('Bank details saved');
    } catch { toast.error('Operation failed'); }
  };

  const handleEdit = (bank) => {
    setEditingBank(bank);
    setFormData({ name: bank.name });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingBank(null);
    setFormData({ name: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bank account?')) return;
    try {
      await api.delete(`fee-banks/${id}`);
      fetchBanks();
      toast.success('Deleted');
    } catch { toast.error('Error deleting'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Fee Banks</h2>
        <button onClick={() => setShowAddModal(true)} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-black transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-100 italic">
          <Plus size={18} /> Add New Bank
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banks.map(b => (
          <div key={b.id} className="bg-white rounded-[2rem] border-2 border-slate-50 p-8 shadow-sm hover:shadow-xl hover:border-slate-100 transition-all group relative">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <Landmark size={28} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(b)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl"><PenBox size={16} /></button>
                <button onClick={() => handleDelete(b.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 mb-1 font-outfit">{b.name}</h3>
            <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <School size={14} className="text-slate-300" /> Linked to School ID: {b.school_id}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs italic">{editingBank ? 'Edit Bank' : 'New Bank Entry'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Bank Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-4 rounded-2xl text-sm font-bold focus:border-slate-800 outline-none transition-all" placeholder="SBI, HDFC..." />
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">Save Bank</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankList;
