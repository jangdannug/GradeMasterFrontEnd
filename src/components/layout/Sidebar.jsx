
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BookOpen, 
  ClipboardCheck, 
  FileText, 
  Menu, 
  ChevronRight,
  LayoutDashboard,
  UserCircle,
  Table,
  Layout,
  LogOut,
  ShieldAlert,
  UserPlus, 
  GraduationCap,
  CheckCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export function Sidebar({ isOpen, setIsOpen, onLogout, role, hasSubjects }) {
  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 280 : 80 }}
      className="bg-white border-r border-slate-200 flex flex-col z-20 shrink-0 h-screen overflow-hidden print:hidden"
    >
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 h-20">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen className="text-white size-6" />
        </div>

        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <h1 className="font-bold text-lg leading-tight uppercase tracking-tight">
              GradeMaster
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
              DepEd Order 8, s. 2015
            </p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className={`mb-2 px-4 flex items-center gap-2 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <UserCircle size={14} className="text-blue-500" />
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            {role} Profile
          </span>
        </div>

        <SidebarLink 
          to="/"
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          collapsed={!isOpen}
        />

        {(role === 'admin' || role === 'superadmin') && (
          <SidebarLink 
            to="/admin"
            icon={<ShieldAlert size={20} />}
            label="Admin Panel"
            collapsed={!isOpen}
          />
        )}

        {role === 'superadmin' && (
          <SidebarLink 
            to="/schools"
            icon={<GraduationCap size={20} />}
            label="Manage Schools"
            collapsed={!isOpen}
          />
        )}

        {(role === 'superadmin' || role === 'adviser') && (
          <SidebarLink 
            to="/student-management"
            icon={<UserPlus size={20} />}
            label="Enroll Student"
            collapsed={!isOpen}
          />
        )}

        {hasSubjects && (
          <SidebarLink 
            to="/record"
            icon={<ClipboardCheck size={20} />}
            label="Class Record"
            collapsed={!isOpen}
          />
        )}

        {(role === 'superadmin' || role === 'admin') && (
          <SidebarLink 
            to="/sf10"
            icon={<FileText size={20} />}
            label="SF10 Permanent Record"
            collapsed={!isOpen}
          />
        )}

        {(role === 'teacher' || role === 'adviser') && (
          <>
            <SidebarLink 
              to="/submitted-records"
              icon={<FileText size={20} />}
              label="Submitted Records"
              collapsed={!isOpen}
            />

            <SidebarLink 
              to="/verified-records"
              icon={<CheckCircle size={20} />}
              label="Verified Records"
              collapsed={!isOpen}
            />
          </>
        )}

        {(role === 'superadmin' || role === 'admin' || role === 'adviser') && (
          <SidebarLink 
            to="/report"
            icon={<FileText size={20} />}
            label="Progress Report"
            collapsed={!isOpen}
          />
        )}

        {(role === 'admin' || role === 'superadmin') && (
          <>
            <div className={`mt-6 mb-2 px-4 flex items-center gap-2 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
              <Layout size={14} className="text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Planning
              </span>
            </div>

            <SidebarLink 
              to="/templates"
              icon={<Layout size={20} />}
              label="Grading Templates"
              collapsed={!isOpen}
            />

            <div className={`mt-4 mb-2 px-4 flex items-center gap-2 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
              <Table size={14} className="text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Grading Standards
              </span>
            </div>

            <SidebarLink 
              to="/transmutation-table"
              icon={<Table size={20} />}
              label="Transmutation Table"
              collapsed={!isOpen}
            />

            <SidebarLink 
              to="/descriptors"
              icon={<FileText size={20} />}
              label="Grading Descriptors"
              collapsed={!isOpen}
            />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-100 text-[10px] text-slate-400 text-center uppercase tracking-widest font-black italic">
        {isOpen && <span>Session: {role}</span>}
      </div>

      <div className="p-4 space-y-2">
        <button 
          onClick={onLogout}
          title={!isOpen ? "Logout" : ""}
          className={`w-full flex items-center gap-3 h-12 rounded-xl text-rose-500 hover:bg-rose-50 transition-all ${
            isOpen ? 'px-4' : 'justify-center'
          }`}
        >
          <LogOut size={20} />
          {isOpen && <span className="text-sm font-bold">Logout</span>}
        </button>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          className="w-full flex items-center justify-center h-10 rounded-lg hover:bg-slate-50 text-slate-500"
        >
          {isOpen ? <Menu size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </motion.aside>
  );
}

function SidebarLink({ to, icon, label, collapsed }) {
  return (
    <NavLink 
      to={to}
      title={collapsed ? label : ""}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 h-12 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
            : 'text-slate-500 hover:bg-slate-50'
        } ${collapsed ? 'justify-center' : 'px-4'}`
      }
    >
      {icon}
      {!collapsed && (
        <span className="text-sm font-bold tracking-wide">{label}</span>
      )}
    </NavLink>
  );
}