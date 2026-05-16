
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
import { theme } from '../../theme';
import gradeMasterLogo from '../../images/gradeMasterLogo.png';

export function Sidebar({ isOpen, setIsOpen, onLogout, role, hasSubjects }) {
  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 280 : 80 }}
      className={`${theme.styles.sidebar} flex flex-col z-20 shrink-0 h-screen overflow-hidden print:hidden`}
    >
      <div className={`flex items-center border-b border-white/5 h-28 transition-all duration-300 ${isOpen ? 'px-6' : 'px-0 justify-center'}`}>
        <img 
          src={gradeMasterLogo} 
          alt="GradeMaster Logo" 
          className={`transition-all duration-300 flex-shrink-0 ${isOpen ? 'h-16 w-auto' : 'h-14 w-14 object-contain'}`}
        />
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-3 flex-1 min-w-0">
            <h1 className={`${theme.styles.heading} text-xl leading-none text-indigo-600`}>
              GradeMaster
            </h1>
            <p className="text-[11px] text-indigo-600 font-black tracking-normal uppercase mt-1">
              L.I.S Integration
            </p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        <div className={`mb-6 px-6 flex items-center gap-2 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <UserCircle size={16} className="text-indigo-600" />
          <span className="text-[12px] font-black text-slate-600 tracking-widest uppercase">
            {role} PORTAL
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
            <div className={`${theme.styles.navLabel} mt-8 ${!isOpen && 'opacity-0'}`} style={{ transition: 'opacity 0.3s ease-in-out' }}>
              Planning
            </div>

            <SidebarLink 
              to="/templates"
              icon={<Layout size={20} />}
              label="Templates"
              collapsed={!isOpen}
            />

            <div className={`${theme.styles.navLabel} mt-6 ${!isOpen && 'opacity-0'}`}>
              Standards
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
              label="Descriptors"
              collapsed={!isOpen}
            />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/10 text-[10px] text-slate-400 text-center uppercase tracking-widest font-black italic">
        {isOpen && <span>Session: {role}</span>}
      </div>

      <div className="p-4 space-y-2">
        <button 
          onClick={onLogout}
          title={!isOpen ? "Logout" : ""}
          className={`w-full flex items-center h-14 rounded-3xl text-rose-300 hover:bg-rose-500/10 transition-all ${
            isOpen ? 'px-8 gap-3' : 'justify-center gap-0'
          }`}
        >
          <LogOut size={20} />
          {isOpen && <span className="text-xs font-black uppercase tracking-widest">Logout</span>}
        </button>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          className="w-full flex items-center justify-center h-12 rounded-2xl hover:bg-indigo-500/10 text-indigo-300 transition-colors"
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
        `${theme.styles.navItem} ${
          isActive ? theme.styles.navActive : ''
        } ${collapsed ? '!px-0 justify-center !gap-0' : ''}`
      }
    >
      {icon}
      {!collapsed && (
        <span className="text-sm font-bold tracking-wide">{label}</span>
      )}
    </NavLink>
  );
}