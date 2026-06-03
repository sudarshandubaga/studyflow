import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useBranch } from '../../../context/BranchContext';
import { useSession } from '../../../context/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';

const StudentUploadDocuments = () => {
    const { selectedBranch } = useBranch();
    const { selectedSession } = useSession();
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
                enrollmentNo: isValidName ? parts[1] : null
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
            const res = await api.post('student-uploaded-files/bulk-upload', formData, {
                headers: { 
                    'branch-id': selectedBranch?.id,
                    'session-id': selectedSession?.id,
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg">
                    <Upload size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight font-outfit">Student Batch Document Upload</h2>
                    <p className="text-sm font-bold text-slate-400 font-outfit uppercase tracking-widest">Global Student Archive System</p>
                </div>
            </div>

            {/* Instruction Card */}
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-2xl flex gap-4 items-start shadow-sm">
                <Info className="text-indigo-500 mt-1 flex-shrink-0" size={20} />
                <div>
                    <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-2">Automated Mapping Protocol</h4>
                    <p className="text-sm text-indigo-700 leading-relaxed font-bold">
                        Files must follow this sequence: <strong className="bg-white px-2 py-0.5 rounded text-indigo-950 shadow-sm">[Short_Name]_[Enrollment_No]</strong>
                    </p>
                    <p className="text-[10px] text-indigo-600 mt-3 font-bold bg-white/50 inline-block px-2 py-1 rounded">
                        Example: TC_2024001 (TC = Transfer Certificate, 2024001 = Student EnrollmentID)
                    </p>
                </div>
            </div>

            {/* Dropzone */}
            <div 
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current.click()}
                className={`border-4 border-dashed rounded-[3rem] p-16 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-6 ${isDragActive ? 'border-blue-500 bg-blue-50/50 scale-[0.99] shadow-inner' : 'border-slate-100 hover:border-blue-400 bg-white shadow-sm hover:shadow-md'}`}
            >
                <input 
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={onFileSelect}
                    className="hidden"
                    accept=".jpeg,.jpg,.png,.pdf,.doc,.docx"
                />
                <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center text-blue-500 mb-2 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    <Upload size={40} />
                </div>
                <div>
                    <p className="text-2xl font-black text-slate-800 font-outfit tracking-tight">Drop documents here</p>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Maximum 5MB per segment</p>
                </div>
                <div className="flex gap-4 mt-4">
                    <span className="px-4 py-1.5 bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border border-slate-100">Images</span>
                    <span className="px-4 py-1.5 bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border border-slate-100">PDF</span>
                    <span className="px-4 py-1.5 bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border border-slate-100">DOCX</span>
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
                        <div className="flex items-center justify-between px-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Processing Queue ({files.length})</h3>
                            <button 
                                onClick={() => setFiles([])}
                                className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest"
                            >
                                Purge All
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {files.map((f) => (
                                <div key={f.id} className={`flex items-center justify-between p-5 rounded-3xl border-2 bg-white transition-all ${f.isValidName ? 'border-slate-50 shadow-sm' : 'border-rose-100 bg-rose-50/20'}`}>
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${f.isValidName ? 'bg-blue-50 text-blue-500' : 'bg-rose-100 text-rose-500'}`}>
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 tracking-tight">{f.file.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">{(f.file.size / 1024).toFixed(1)} KB</span>
                                                {f.isValidName ? (
                                                    <span className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-wider">
                                                        <CheckCircle2 size={12} /> Format Verified ({f.shortName} | {f.enrollmentNo})
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase tracking-wider">
                                                        <AlertCircle size={12} /> Incompatible Naming Format
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeFile(f.id)}
                                        className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shadow-sm"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6">
                            <button
                                onClick={handleUpload}
                                disabled={uploading || files.filter(f => f.isValidName).length === 0}
                                className="w-full bg-slate-900 text-white rounded-[2rem] py-5 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} className="group-hover:-translate-y-1 transition-transform" />}
                                Commit Batch to Register ({files.filter(f => f.isValidName).length} units)
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
                        className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
                    >
                        <h3 className="text-2xl font-black text-slate-800 mb-8 font-outfit uppercase tracking-tight">Transmission Manifest</h3>
                        
                        <div className="space-y-8">
                            {results.success.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 text-emerald-600 mb-6 bg-emerald-50 w-fit px-4 py-1.5 rounded-full border border-emerald-100">
                                        <CheckCircle2 size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Secure ({results.success.length})</span>
                                    </div>
                                    <div className="space-y-3">
                                        {results.success.map((s, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-xs font-bold text-slate-800 tracking-tight">{s.file}</span>
                                                <div className="flex gap-3">
                                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-blue-100 shadow-sm">{s.student}</span>
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-emerald-100 shadow-sm">{s.document_type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.errors.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 text-rose-600 mb-6 bg-rose-50 w-fit px-4 py-1.5 rounded-full border border-rose-100">
                                        <AlertCircle size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Rejection Flags ({results.errors.length})</span>
                                    </div>
                                    <div className="space-y-3">
                                        {results.errors.map((e, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-rose-50/30 rounded-2xl border border-rose-100">
                                                <span className="text-xs font-bold text-rose-900 tracking-tight">{e.file}</span>
                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.1em] bg-white px-3 py-1 rounded-lg border border-rose-200">{e.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-10 pt-8 border-t border-slate-50 flex justify-center">
                            <button 
                                onClick={() => setResults(null)}
                                className="px-10 py-3 rounded-2xl text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-[0.3em] transition-all hover:bg-slate-50"
                            >
                                Purge Result Buffer
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentUploadDocuments;
