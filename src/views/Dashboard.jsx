
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Users, BookOpen, ClipboardCheck, Briefcase, Plus, Trash2, Shield, User, History, Layers } from 'lucide-react';
import { AdminDashboardView } from './dashboard/AdminDashboardView';
import { TeachingLoadView } from './dashboard/TeachingLoadView';
import { AdvisoryDashboardView } from './dashboard/AdvisoryDashboardView';
import { theme } from '../theme';

export function Dashboard({ 
  subjects, 
  section, 
  allSections,
  baseSubjects = [],
  users,
  students, 
  transmutationTable,
  descriptors,
  onSelectSubject, 
  role, 
  currentTeacherId, 
  onAddStudent, 
  onRemoveStudent,
  onAssignStudent,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  syncError
}) {
  const [activeTab, setActiveTab] = React.useState('teaching');
  
  const navigate = useNavigate();
  const adviserSection = allSections.find(s => s.adviserId === currentTeacherId);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {(role === 'admin' || role === 'superadmin') && (
        <AdminDashboardView 
          users={users} 
          allSections={allSections} 
          subjects={subjects} 
        />
      )}

      {role === 'adviser' && (
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-8 shadow-sm">
          <TabButton 
            active={activeTab === 'teaching'} 
            onClick={() => setActiveTab('teaching')}
            icon={<BookOpen size={14} />}
            label="My Teaching Load"
          />
          <TabButton 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')}
            icon={<Users size={14} />}
            label={`${adviserSection?.name || 'Section'} Students`}
          />
          <TabButton 
            active={activeTab === 'curriculum'} 
            onClick={() => setActiveTab('curriculum')}
            icon={<Layers size={14} />}
            label="Subjects"
          />
        </div>
      )}

      {((role === 'teacher') || (role === 'adviser' && activeTab === 'teaching')) && (
        <TeachingLoadView 
          role={role}
          subjects={subjects}
          currentTeacherId={currentTeacherId}
          allSections={allSections}
          onSelectSubject={onSelectSubject}
        />
      )}

      {role === 'adviser' && (activeTab === 'students' || activeTab === 'curriculum') && (
        <AdvisoryDashboardView 
          activeView={activeTab}
          allSections={allSections}
          currentTeacherId={currentTeacherId}
          students={students}
          subjects={subjects}
          baseSubjects={baseSubjects}
          users={users}
          onAddStudent={onAddStudent}
          onRemoveStudent={onRemoveStudent}
          onAssignStudent={onAssignStudent}
          onAddSubject={onAddSubject}
          onUpdateSubject={onUpdateSubject}
          onDeleteSubject={onDeleteSubject}
          syncError={syncError}
        />
      )}
    </motion.div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${
        active 
          ? 'bg-white text-indigo-600 shadow-sm' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}