import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
    Briefcase, 
    Search
} from 'lucide-react';

import RolesList from '../Setup/components/RolesList';
import RoleAllotment from '../Setup/components/RoleAllotment';
import AttendanceLegends from '../Setup/components/AttendanceLegends';
import AttendanceSettings from '../Setup/components/AttendanceSettings';
import CallingReasons from '../Setup/components/CallingReasons';
import StaffDocumentTypes from '../Setup/components/StaffDocumentTypes';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';

import MarkAttendance from './components/MarkAttendance';
import LeaveApplication from './components/LeaveApplication';
import LeaveApplicationList from './components/LeaveApplicationList';
import EmployeeFastEdit from './components/EmployeeFastEdit';
import StaffUploadDocuments from './components/StaffUploadDocuments';

const EmployeeModule = () => {
    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-violet-600 to-indigo-400 flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                        <Briefcase size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Employee Management</h1>
                        <p className="text-slate-400 text-sm font-medium">Streamline staff lifecycle, attendance, and professional tracking.</p>
                    </div>
                </div>
                <div className="relative group min-w-[320px]">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500" />
                    <input type="text" placeholder="Search by name, code or role..." className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-8 focus:ring-violet-50 focus:border-violet-500 transition-all shadow-sm" />
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-[0_40px_100_rgb(0,0,0,0.03)] border border-slate-100 min-h-[500px]">
                <Routes>
                    <Route path="/roles" element={<RolesList />} />
                    <Route path="/allocations" element={<RoleAllotment />} />
                    <Route path="/legends" element={<AttendanceLegends />} />
                    <Route path="/attendance-config" element={<AttendanceSettings />} />
                    <Route path="/calling-reasons" element={<CallingReasons />} />
                    <Route path="/documents" element={<StaffDocumentTypes />} />
                    <Route path="/view" element={<EmployeeList />} />
                    <Route path="/fast-edit" element={<EmployeeFastEdit />} />
                    <Route path="/add" element={<EmployeeForm />} />
                    <Route path="/edit/:id" element={<EmployeeForm />} />
                    <Route path="/attendance" element={<MarkAttendance />} />
                    <Route path="/upload-docs" element={<StaffUploadDocuments />} />
                    <Route path="/leave" element={<LeaveApplicationList />} />
                    <Route path="/leave/apply" element={<LeaveApplication />} />
                    <Route path="*" element={<EmployeePlaceholder />} />
                </Routes>
            </div>
        </div>
    );
};

const EmployeePlaceholder = () => (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
        <div className="w-24 h-24 bg-violet-50 rounded-full flex items-center justify-center text-violet-200 border border-violet-100">
            <Briefcase size={48} className="animate-pulse" />
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-800 font-outfit">Staff Module</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium">Select an option above to manage your staff resources and operations.</p>
        </div>
    </div>
);

export default EmployeeModule;
