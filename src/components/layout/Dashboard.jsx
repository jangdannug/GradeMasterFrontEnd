
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Users, BookOpen, ClipboardCheck, Briefcase, Plus, Trash2, Shield, User, History, Layers } from 'lucide-react';
import { AdminDashboardView } from '../../views/dashboard/AdminDashboardView';
import { TeachingLoadView } from '../../views/dashboard/TeachingLoadView';
import { AdvisoryDashboardView } from './AdvisoryDashboardView';
import { theme } from '../../theme';

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
  assignedSectionId,
  onAddStudent, 
  onRemoveStudent,
  onAssignStudent,
  onUpdateStudent, // Pass updateStudent
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onRefresh
}) {
  const [activeTab, setActiveTab] = React.useState('teaching');
  
  const navigate = useNavigate();

  // DIAGNOSTIC LOG
  React.useEffect(() => {
    console.log("[Dashboard] Render State:", {
      role,
      activeTab,
      hasAdviserSection: !!allSections.find(s => (assignedSectionId && String(s.id) === String(assignedSectionId)) || (s.adviserId || s.adviser_id) === currentTeacherId)
    });
  }, [role, activeTab, allSections, assignedSectionId, currentTeacherId]);

  // Fetch all necessary context data as soon as the dashboard mounts
  React.useEffect(() => {
    onRefresh?.();
  }, [onRefresh]);

  const adviserSection = allSections.find(s => 
    (assignedSectionId && String(s.id) === String(assignedSectionId)) || 
    (s.adviserId || s.adviser_id) === currentTeacherId
  );
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {(String(role).toLowerCase() === 'admin' || String(role).toLowerCase() === 'superadmin') && (
        <AdminDashboardView 
          users={users} 
          allSections={allSections} 
          subjects={subjects} 
        />
      )}

      {String(role).toLowerCase() === 'adviser' && (
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

      {((String(role).toLowerCase() === 'teacher') || (String(role).toLowerCase() === 'adviser' && activeTab === 'teaching')) && (
        <TeachingLoadView 
          role={role}
          subjects={subjects}
          currentTeacherId={currentTeacherId}
          allSections={allSections}
          onSelectSubject={onSelectSubject}
        />
      )}

      {String(role).toLowerCase() === 'adviser' && (activeTab === 'students' || activeTab === 'curriculum') && (
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
          onUpdateStudent={onUpdateStudent} // Pass updateStudent
          onAddSubject={onAddSubject}
          onUpdateSubject={onUpdateSubject}
          onDeleteSubject={onDeleteSubject}
          onRefresh={onRefresh} // NEW: Pass onRefresh to AdvisoryDashboardView
          assignedSectionId={assignedSectionId}
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