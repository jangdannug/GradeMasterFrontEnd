
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
  onRefresh,
  currentUser
}) {
  const [activeTab, setActiveTab] = React.useState('teaching');
  
  const navigate = useNavigate();

  const currentUserRole = String(currentUser?.role || role).toLowerCase();
  const currentUserSchoolId = currentUser?.schoolId;

  const filteredSectionsForDashboard = React.useMemo(() => {
    if (currentUserRole === 'superadmin') return allSections;
    return allSections.filter(s => String(s.schoolId) === String(currentUserSchoolId));
  }, [allSections, currentUserRole, currentUserSchoolId]);

  const filteredSubjectsForDashboard = React.useMemo(() => {
    if (currentUserRole === 'superadmin') return subjects;
    const schoolSectionIds = new Set(filteredSectionsForDashboard.map(s => String(s.id)));
    return subjects.filter(sub => schoolSectionIds.has(String(sub.sectionId)));
  }, [subjects, filteredSectionsForDashboard, currentUserRole]);

  // DIAGNOSTIC LOG
  React.useEffect(() => {
    console.log("[Dashboard] Render State:", {
      role: currentUserRole,
      activeTab,
      hasAdviserSection: !!allSections.find(s => (assignedSectionId && String(s.id) === String(assignedSectionId)) || (s.adviserId || s.adviser_id) === currentTeacherId)
    });
  }, [currentUserRole, activeTab, allSections, assignedSectionId, currentTeacherId]);

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
      {(currentUserRole === 'admin' || currentUserRole === 'superadmin') && (
        <AdminDashboardView 
          users={users} 
          allSections={filteredSectionsForDashboard} 
          subjects={filteredSubjectsForDashboard} 
        />
      )}

      {currentUserRole === 'adviser' && (
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

      {((currentUserRole === 'teacher') || (currentUserRole === 'adviser' && activeTab === 'teaching')) && (
        <TeachingLoadView 
          role={currentUserRole}
          subjects={filteredSubjectsForDashboard}
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