import { Routes, Route } from 'react-router-dom';
import { 
    Users, 
    Search, 
    BookOpen
} from 'lucide-react';
import ClassesSections from './components/ClassesSections';
import StudentCategories from './components/StudentCategories';
import StudentDocuments from './components/StudentDocuments';
import AttendanceLegends from './components/AttendanceLegends';
import StudentAdmissionManager from './components/StudentAdmissionManager';
import StudentMarkAttendance from './components/StudentMarkAttendance';
import StudentLeaveApplication from './components/StudentLeaveApplication';
import StudentFastEdit from './components/StudentFastEdit';
import StudentPromotion from './components/StudentPromotion';
import StudentActiveInactive from './components/StudentActiveInactive';
import StudentUploadDocuments from './components/StudentUploadDocuments';

const SISModule = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-2xl shadow-blue-200">
                        <Users size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Student Information System</h1>
                        <p className="text-slate-400 text-sm font-medium">Manage the complete student lifecycle and academic records.</p>
                    </div>
                </div>
                <div className="relative group min-w-[320px]">
                    <Search 
                        size={18} 
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" 
                    />
                    <input 
                        type="text" 
                        placeholder="Search by name, ID or guardian..."
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-blue-50 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-700 shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-[0_40px_100px_rgb(0,0,0,0.03)] border border-slate-100 min-h-[500px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                    <Routes>
                        <Route path="/" element={<StudentAdmissionManager />} />
                        <Route path="/classes" element={<ClassesSections />} />
                        <Route path="/categories" element={<StudentCategories />} />
                        <Route path="/documents" element={<StudentDocuments />} />
                        <Route path="/legends" element={<AttendanceLegends />} />
                        <Route path="/attendance" element={<StudentMarkAttendance />} />
                        <Route path="/leave" element={<StudentLeaveApplication />} />
                        <Route path="/admission" element={<StudentAdmissionManager />} />
                        <Route path="/fast-edit" element={<StudentFastEdit />} />
                        <Route path="/promotion" element={<StudentPromotion />} />
                        <Route path="/active-inactive" element={<StudentActiveInactive />} />
                        <Route path="/upload-docs" element={<StudentUploadDocuments />} />
                        <Route path="*" element={<PlaceholderView />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

const PlaceholderView = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
            <BookOpen size={48} />
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-800 font-outfit">Feature Coming Soon</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">We are currently building this module to provide you with the best student management experience.</p>
        </div>
    </div>
);

export default SISModule;
