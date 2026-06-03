import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
    Settings
} from 'lucide-react';
import SchoolDetails from './components/SchoolDetails';
import SchoolBranches from './components/SchoolBranches';
import SessionsList from './components/SessionsList';
import SubjectsList from './components/SubjectsList';
import LocationSettings from './components/LocationSettings';
import TitlesList from './components/TitlesList';
import CalendarList from './components/CalendarList';
import CustomFieldCategoriesList from './components/CustomFieldCategoriesList';
import CustomFieldsList from './components/CustomFieldsList';
import RolesList from './components/RolesList';
import RoleAllotment from './components/RoleAllotment';
import AttendanceLegends from './components/AttendanceLegends';
import AttendanceSettings from './components/AttendanceSettings';
import CallingReasons from './components/CallingReasons';
import StaffDocumentTypes from './components/StaffDocumentTypes';

const SetupModule = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                        <Settings size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Institutional Setup</h1>
                        <p className="text-slate-400 text-sm font-medium">Core configuration for your school and administrative policies.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-[0_40px_100px_rgb(0,0,0,0.03)] border border-slate-100 min-h-[500px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-50/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="relative z-10">
                    <Routes>
                        <Route path="/" element={<SchoolDetails />} />
                        <Route path="/branches" element={<SchoolBranches />} />
                        <Route path="/subjects" element={<SubjectsList />} />
                        <Route path="/sessions" element={<SessionsList />} />
                        <Route path="/locations" element={<LocationSettings />} />
                        <Route path="/titles" element={<TitlesList />} />
                        <Route path="/calendar" element={<CalendarList />} />
                        <Route path="/custom-categories" element={<CustomFieldCategoriesList />} />
                        <Route path="/custom-fields" element={<CustomFieldsList />} />
                        <Route path="/roles" element={<RolesList />} />
                        <Route path="/role-allotment" element={<RoleAllotment />} />
                        <Route path="/attendance-legends" element={<AttendanceLegends />} />
                        <Route path="/attendance-settings" element={<AttendanceSettings />} />
                        <Route path="/calling-reasons" element={<CallingReasons />} />
                        <Route path="/employee-documents" element={<StaffDocumentTypes />} />
                        <Route path="*" element={<SetupPlaceholder />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

const SetupPlaceholder = () => (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border border-slate-100">
            <Settings size={48} className="animate-pulse" />
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-800 font-outfit">Configuration Module</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium">This configuration interface is being prepared to provide complete institution control.</p>
        </div>
    </div>
);

export default SetupModule;
