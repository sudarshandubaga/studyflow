import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useBranch } from '../../../context/BranchContext';
import { motion, AnimatePresence } from 'framer-motion';

const StaffUploadDocuments = () => {
    const { selectedBranch } = useBranch();
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const processFiles = (acceptedFiles) => {
        const newFiles = Array.from(acceptedFiles).map(file => {
            const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
            const parts = nameWithoutExt.split('_');
            const isValidName = parts.length >= 2;
            
            return {
                file,
                id: Math.random().toString(36).substr(2, 9),
                status: 'pending',
                isValidName,
                shortName: isValidName ? parts[0] : null,
                attendanceCode: isValidName ? parts[1] : null
            };
        });
        setFiles(prev => [...prev, ...newFiles]);
        setResults(null);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const onDragLeave = () => {
        setIsDragActive(false);
    };

    const onFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
    };

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleUpload = async () => {
        const validFiles = files.filter(f => f.isValidName);
        if (validFiles.length === 0) {
            return toast.error('No valid files to upload. Please check naming convention.');
        }

        setUploading(true);
        const formData = new FormData();
        validFiles.forEach(f => {
            formData.append('files[]', f.file);
        });

        try {
            const res = await api.post('staff-documents/bulk-upload', formData, {
                headers: { 
                    'branch-id': selectedBranch?.id,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setResults(res.data);
            setFiles([]);
            toast.success('Upload process completed!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <Upload size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight font-outfit">Bulk Document Upload</h2>
                    <p className="text-sm font-bold text-slate-400 font-outfit">Upload multiple staff documents at once</p>
                </div>
            </div>

            {/* Instruction Card */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-2xl flex gap-4 items-start">
                <Info className="text-blue-500 mt-1 flex-shrink-0" size={20} />
                <div>
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider mb-2">Naming Convention Required</h4>
                    <p className="text-sm text-blue-700 leading-relaxed font-medium">
                        Files must be named as: <strong className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-950">[Document_Short_Name]_[Attendance_Code]</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-2 font-bold italic">
                        Example: AC_00001234 (AC = Aadhaar Card, 00001234 = Staff Attendance Code)
                    </p>
                </div>
            </div>

            {/* Dropzone */}
            <div 
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current.click()}
                className={`border-4 border-dashed rounded-[2.5rem] p-12 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-4 ${isDragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/30'}`}
            >
                <input 
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={onFileSelect}
                    className="hidden"
                    accept=".jpeg,.jpg,.png,.pdf,.doc,.docx"
                />
                <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-indigo-500 mb-2">
                    <Upload size={32} />
                </div>
                <div>
                    <p className="text-xl font-black text-slate-700 font-outfit tracking-tight">Drag & drop files here</p>
                    <p className="text-sm font-bold text-slate-400">or click to browse from your computer</p>
                </div>
                <div className="flex gap-4 mt-6">
                    <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">JPG/PNG</span>
                    <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">PDF</span>
                    <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">DOC/DOCX</span>
                </div>
            </div>

            {/* File List */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Queue ({files.length} files)</h3>
                            <button 
                                onClick={() => setFiles([])}
                                className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-tight"
                            >
                                Clear All
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {files.map((f) => (
                                <div key={f.id} className={`flex items-center justify-between p-4 rounded-2xl border bg-white transition-all ${f.isValidName ? 'border-slate-100' : 'border-red-100 bg-red-50/30'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.isValidName ? 'bg-indigo-50 text-indigo-500' : 'bg-red-100 text-red-500'}`}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{f.file.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-black text-slate-400">{(f.file.size / 1024).toFixed(1)} KB</span>
                                                {f.isValidName ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase">
                                                        <CheckCircle2 size={10} /> Valid Format ({f.shortName} | {f.attendanceCode})
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase">
                                                        <AlertCircle size={10} /> Invalid Naming Component
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeFile(f.id)}
                                        className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleUpload}
                                disabled={uploading || files.filter(f => f.isValidName).length === 0}
                                className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />}
                                Start Uploading {files.filter(f => f.isValidName).length} Files
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Display */}
            <AnimatePresence>
                {results && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl overflow-hidden"
                    >
                        <h3 className="text-xl font-black text-slate-800 mb-6 font-outfit">Upload Results</h3>
                        
                        <div className="space-y-6">
                            {results.success.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-emerald-600 mb-4 px-1">
                                        <CheckCircle2 size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Successfully Uploaded ({results.success.length})</span>
                                    </div>
                                    <div className="space-y-2">
                                        {results.success.map((s, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                                <span className="text-xs font-bold text-emerald-900">{s.file}</span>
                                                <div className="flex gap-2">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter bg-white px-2 py-0.5 rounded border border-emerald-100">{s.employee}</span>
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter bg-white px-2 py-0.5 rounded border border-indigo-100">{s.document_type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.errors.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-red-600 mb-4 px-1">
                                        <AlertCircle size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Errors / Failures ({results.errors.length})</span>
                                    </div>
                                    <div className="space-y-2">
                                        {results.errors.map((e, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                                                <span className="text-xs font-bold text-red-900">{e.file}</span>
                                                <span className="text-[10px] font-black text-red-600 uppercase tracking-tight">{e.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
                            <button 
                                onClick={() => setResults(null)}
                                className="text-sm font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                            >
                                Dismiss Results
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StaffUploadDocuments;
