import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardOverview from './pages/DashboardOverview';
import MasterModule from './pages/Master/MasterModule';
import SISModule from './pages/SIS/SISModule';
import FeeModule from './pages/Fees/FeeModule';
import SetupModule from './pages/Setup/SetupModule';
import AdmissionModule from './pages/Admission/AdmissionModule';
import EmployeeModule from './pages/Employee/EmployeeModule';
import Login from './pages/Auth/Login';
import ChangePassword from './pages/Auth/ChangePassword';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

const AppLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen flex bg-slate-50 transition-colors duration-300 font-inter">
            <Toaster position="top-right" reverseOrder={false} />
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Main Content */}
            <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <Navbar />

                <div className="p-6 md:p-8 flex-1 overflow-auto">
                    <Routes>
                        <Route path="/" element={<DashboardOverview />} />
                        <Route path="/admission/*" element={<AdmissionModule />} />
                        <Route path="/master/*" element={<MasterModule />} />
                        <Route path="/students/*" element={<SISModule />} />
                        <Route path="/employee/*" element={<EmployeeModule />} />
                        <Route path="/fees/*" element={<FeeModule />} />
                        <Route path="/setup/*" element={<SetupModule />} />
                        <Route path="/settings/security" element={<ChangePassword />} />
                        
                        {/* Fallback */}
                        <Route path="*" element={<div className="flex flex-col items-center justify-center py-20"><p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Feature in Development</p></div>} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

import { SessionProvider } from './context/SessionContext';
import { BranchProvider } from './context/BranchContext';

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <BranchProvider>
                    <SessionProvider>
                        <Routes>
                            <Route path="/school-panel/login" element={<Login />} />
                            
                            <Route element={<ProtectedRoute />}>
                                <Route path="/school-panel/*" element={<AppLayout />} />
                            </Route>
                            
                            <Route path="*" element={<Navigate to="/school-panel" replace />} />
                        </Routes>
                    </SessionProvider>
                </BranchProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;
