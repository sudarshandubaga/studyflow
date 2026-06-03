import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Calendar,
    Fingerprint,
    Wallet,
    MessageCircle,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
    ShieldCheck,
    ClipboardList,
    Briefcase,
    ChevronDown,
    ChevronRight,
    Circle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, path, active = false, minimized = false, depth = 0 }) => (
    <Link to={path} className={`
        flex items-center cursor-pointer transition-all duration-200 group relative
        ${depth === 0 ? 'px-4 py-3' : 'pl-11 pr-4 py-2.5 my-0.5 mx-2 rounded-lg'}
        ${active
            ? depth === 0
                ? 'bg-blue-600/10 text-blue-600 border-r-4 border-blue-600'
                : 'bg-blue-50 text-blue-600 font-medium'
            : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}
    `}>
        {Icon ? (
            <Icon size={depth === 0 ? 22 : 18} className={`${active ? 'text-blue-600' : 'group-hover:text-blue-600'} flex-shrink-0 transition-colors`} />
        ) : (
            <Circle size={8} className={`${active ? 'fill-blue-600 text-blue-600' : 'text-slate-300 group-hover:text-blue-400'} flex-shrink-0 transition-colors`} />
        )}
        {!minimized && (
            <span className={`
                ${depth === 0 ? 'ml-4 font-medium' : 'ml-3 text-[13.5px]'} 
                whitespace-nowrap overflow-hidden transition-all duration-300 font-outfit
            `}>
                {label}
            </span>
        )}
        {active && depth > 0 && (
            <motion.div
                layoutId="activeChild"
                className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
            />
        )}
    </Link>
);

const SidebarDropdown = ({
    icon: Icon,
    label,
    children,
    isOpen,
    onToggle,
    active = false,
    minimized = false,
    depth = 0,
    pathname
}) => {
    const hasActiveChild = (items) => {
        return items.some(item => {
            if (item.path === pathname) return true;
            if (item.children) return hasActiveChild(item.children);
            return false;
        });
    };

    useEffect(() => {
        if (hasActiveChild(children) && !isOpen) {
            onToggle();
        }
    }, [pathname]);

    const [openChild, setOpenChild] = useState(null);

    return (
        <div className="flex flex-col">
            <div
                onClick={() => !minimized && onToggle()}
                className={`
                    flex items-center justify-between cursor-pointer transition-all duration-200 group
                    ${depth === 0 ? 'px-4 py-3' : 'pl-11 pr-4 py-2.5 my-0.5 mx-2 rounded-lg'}
                    ${active
                        ? 'text-blue-600 bg-blue-600/5'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}
                `}
            >
                <div className="flex items-center">
                    {Icon ? (
                        <Icon size={depth === 0 ? 22 : 18} className={`${active ? 'text-blue-600' : 'group-hover:text-blue-600'} flex-shrink-0 transition-colors`} />
                    ) : (
                        <Circle size={8} className={`${active ? 'fill-blue-600 text-blue-600' : 'text-slate-300 group-hover:text-blue-400'} flex-shrink-0 transition-colors`} />
                    )}
                    {!minimized && (
                        <span className={`
                            ${depth === 0 ? 'ml-4 font-medium' : 'ml-3 text-[13.5px]'} 
                            whitespace-nowrap overflow-hidden transition-all duration-300 font-outfit
                        `}>
                            {label}
                        </span>
                    )}
                </div>
                {!minimized && (
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-slate-400 group-hover:text-blue-600"
                    >
                        <ChevronDown size={16} />
                    </motion.div>
                )}
            </div>

            <AnimatePresence initial={false}>
                {isOpen && !minimized && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden flex flex-col"
                    >
                        {children.map((child, idx) => (
                            child.children ? (
                                <SidebarDropdown
                                    key={idx}
                                    {...child}
                                    depth={depth + 1}
                                    minimized={minimized}
                                    pathname={pathname}
                                    active={hasActiveChild(child.children)}
                                    isOpen={openChild === child.label}
                                    onToggle={() => setOpenChild(openChild === child.label ? null : child.label)}
                                />
                            ) : (
                                <SidebarItem
                                    key={idx}
                                    {...child}
                                    depth={depth + 1}
                                    minimized={minimized}
                                    active={pathname === child.path}
                                />
                            )
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();
    const { logout } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/school-panel' },
        {
            icon: Briefcase,
            label: 'Employee Management',
            children: [
                {
                    label: 'Masters',
                    children: [
                        { label: 'Employee Role', path: '/school-panel/employee/roles' },
                        { label: 'Role Allocation', path: '/school-panel/employee/allocations' },
                        { label: 'Attendance Legends', path: '/school-panel/employee/legends' },
                        { label: 'Attendance Settings', path: '/school-panel/employee/attendance-config' },
                        { label: 'Calling Reason', path: '/school-panel/employee/calling-reasons' },
                        { label: 'Employee Document', path: '/school-panel/employee/documents' },
                    ]
                },
                {
                    label: 'Transactions',
                    children: [
                        { label: 'View Employees', path: '/school-panel/employee/view' },
                        { label: 'Mark Attendance', path: '/school-panel/employee/attendance' },
                        { label: 'Leave Application', path: '/school-panel/employee/leave' },
                        { label: 'Upload Attendance', path: '/school-panel/employee/upload-attendance' },
                        { label: 'Employee Fast Edit', path: '/school-panel/employee/fast-edit' },
                        { label: 'Calling Register', path: '/school-panel/employee/calling-register' },
                        { label: 'Assignments', path: '/school-panel/employee/assignments' },
                        { label: 'Teacher Planner', path: '/school-panel/employee/planner' },
                        { label: 'Upload Documents', path: '/school-panel/employee/upload-docs' },
                    ]
                },
                {
                    label: 'Reports',
                    children: [
                        { label: 'Attendance Report', path: '/school-panel/employee/reports/attendance' },
                        { label: 'Dynamic Report', path: '/school-panel/employee/reports/dynamic' },
                        { label: 'Male Female Report', path: '/school-panel/employee/reports/gender' },
                        { label: 'Class Teacher', path: '/school-panel/employee/reports/class-teacher' },
                        { label: 'Role Based', path: '/school-panel/employee/reports/role-based' },
                        { label: 'Complete Report', path: '/school-panel/employee/reports/complete' },
                        { label: 'Eservice', path: '/school-panel/employee/reports/eservice' },
                        { label: 'Upload Status', path: '/school-panel/employee/reports/upload-status' },
                        { label: 'PTM Report', path: '/school-panel/employee/reports/ptm' },
                        { label: 'Salary Slip', path: '/school-panel/employee/reports/salary' },
                        { label: 'Assignment Report', path: '/school-panel/employee/reports/assignments' },
                    ]
                },
            ]
        },
        {
            icon: GraduationCap,
            label: 'Student Management',
            children: [
                {
                    label: 'Academic Masters',
                    children: [
                        { label: 'Class / Sections', path: '/school-panel/students/classes' },
                        { label: 'Student Category', path: '/school-panel/students/categories' },
                        { label: 'Student Document', path: '/school-panel/students/documents' },
                        { label: 'Attendance Legends', path: '/school-panel/students/legends' },
                    ]
                },
                {
                    label: 'Operations',
                    children: [
                        { label: 'Add Student', path: '/school-panel/students/admission' },
                        { label: 'Mark Attendance', path: '/school-panel/students/attendance' },
                        { label: 'Leave Application', path: '/school-panel/students/leave' },
                        { label: 'Student Fast Edit', path: '/school-panel/students/fast-edit' },
                        { label: 'Siblings', path: '/school-panel/students/siblings' },
                        { label: 'Assignments', path: '/school-panel/students/assignments' },
                        { label: 'Promotion / Demotion', path: '/school-panel/students/promotion' },
                        { label: 'Active / Inactive', path: '/school-panel/students/active-inactive' },
                        { label: 'Upload Documents', path: '/school-panel/students/upload-docs' },
                    ]
                },
            ]
        },
        {
            icon: Wallet,
            label: 'Fee Management',
            children: [
                {
                    label: 'Master',
                    children: [
                        { label: 'Fee Head', path: '/school-panel/fees/heads' },
                        { label: 'Bill Scheme', path: '/school-panel/fees/bill-schemes' },
                        { label: 'Concession', path: '/school-panel/fees/concessions' },
                        { label: 'Fine', path: '/school-panel/fees/fines' },
                        { label: 'Bank', path: '/school-panel/fees/banks' },
                    ]
                },
                {
                    label: 'Operations',
                    children: [
                        { label: 'Fee Receipt Wizard', path: '/school-panel/fees/receipt-wizard' },
                        { label: 'Search Fee Receipt', path: '/school-panel/fees/receipts' },
                        { label: 'Fee Bill Slip', path: '/school-panel/fees/bill-slips' },
                        { label: 'Fee Bill Book', path: '/school-panel/fees/bill-books' },
                    ]
                },
                {
                    label: 'Reports',
                    children: [
                        { label: 'Fee Charge Report', path: '/school-panel/fees/reports/charges' },
                        { label: 'Fee Due Report', path: '/school-panel/fees/reports/due' },
                        { label: 'Fee Cancelled Report', path: '/school-panel/fees/reports/cancelled' },
                        { label: 'Fee Certificate', path: '/school-panel/fees/reports/certificate' },
                        { label: 'Concession Report', path: '/school-panel/fees/reports/concessions' },
                        { label: 'Fee Headwise Report', path: '/school-panel/fees/reports/headwise' },
                    ]
                },
            ]
        },
        { icon: BookOpen, label: 'Academic Master', path: '/school-panel/master' },
        { icon: Fingerprint, label: 'Exams', path: '/school-panel/exams' },
        { icon: MessageCircle, label: 'Messages', path: '/school-panel/messages' },
        {
            icon: Settings,
            label: 'School Setup',
            children: [
                {
                    label: 'Institutional Masters',
                    children: [
                        { label: 'School Details', path: '/school-panel/setup' },
                        { label: 'Branches', path: '/school-panel/setup/branches' },
                        { label: 'Common Subjects', path: '/school-panel/setup/subjects' },
                        { label: 'Location Settings', path: '/school-panel/setup/locations' },
                        { label: 'Title Settings', path: '/school-panel/setup/titles' },
                    ]
                },
                {
                    label: 'Staff Settings',
                    children: [
                        { label: 'Staff Roles', path: '/school-panel/setup/roles' },
                        { label: 'Role Allotment', path: '/school-panel/setup/role-allotment' },
                        { label: 'Attendance Legends', path: '/school-panel/setup/attendance-legends' },
                        { label: 'Attendance Settings', path: '/school-panel/setup/attendance-settings' },
                        { label: 'Calling Reason', path: '/school-panel/setup/calling-reasons' },
                        { label: 'Employee Documents', path: '/school-panel/setup/employee-documents' },
                    ]
                },
                {
                    label: 'Policy & Annual',
                    children: [
                        { label: 'Academic Sessions', path: '/school-panel/setup/sessions' },
                        { label: 'School Calendar', path: '/school-panel/setup/calendar' },
                        { label: 'Custom Categories', path: '/school-panel/setup/custom-categories' },
                        { label: 'Custom Fields', path: '/school-panel/setup/custom-fields' },
                        { label: 'Audit Trails (Logs)', path: '/school-panel/setup/audit' },
                    ]
                },
            ]
        },
    ];

    const isPathActive = (item) => {
        if (item.path === location.pathname) return true;
        if (item.children) {
            return item.children.some(child => isPathActive(child));
        }
        return false;
    };

    const [openMenu, setOpenMenu] = useState(null);

    return (
        <aside className={`
            fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50
            transition-all duration-300 shadow-sm flex flex-col
            ${isOpen ? 'w-64' : 'w-20'}
        `}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0`}>
                <Link to="/school-panel" className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-md shadow-blue-200">
                        <GraduationCap size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-outfit">
                        StudyFlow
                    </span>
                </Link>
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors shadow-sm"
                >
                    {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Menu Sections */}
            <div className="py-6 flex-1 overflow-y-auto no-scrollbar">
                <div className="px-4 mb-4">
                    <p className={`text-[11px] font-bold text-slate-400 uppercase tracking-widest ${isOpen ? 'px-2' : 'text-center'}`}>
                        {isOpen ? 'Main Menu' : '•••'}
                    </p>
                </div>
                {menuItems.map((item, idx) => (
                    item.children ? (
                        <SidebarDropdown
                            key={idx}
                            {...item}
                            minimized={!isOpen}
                            pathname={location.pathname}
                            active={isPathActive(item)}
                            isOpen={openMenu === item.label}
                            onToggle={() => setOpenMenu(openMenu === item.label ? null : item.label)}
                        />
                    ) : (
                        <SidebarItem
                            key={idx}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                            active={location.pathname === item.path}
                            minimized={!isOpen}
                        />
                    )
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex-shrink-0">
                <button
                    onClick={logout}
                    className={`
                        w-full flex items-center px-4 py-3 rounded-xl transition-all cursor-pointer bg-slate-50 hover:bg-red-50 group border border-transparent hover:border-red-100
                    `}
                >
                    <LogOut size={20} className="text-slate-500 group-hover:text-red-600 flex-shrink-0" />
                    {isOpen && (
                        <span className="ml-4 font-medium text-slate-600 group-hover:text-red-700 transition-all font-outfit">
                            Sign Out
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
