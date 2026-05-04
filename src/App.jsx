import React, { useState, useMemo, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { useGradeManagement } from './hooks/useGradeManagement';
import { INITIAL_SECTION } from './mockData';
import { ShieldAlert, Loader2 } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute'; // UPDATED
import authService from './services/authService'; // UPDATED
import { theme } from './theme';

// Lazy loaded views for code splitting
const Dashboard = lazy(() => import('./components/layout/Dashboard').then(m => ({ default: m.Dashboard })));
const AdminPanel = lazy(() => import('./views/AdminPanel').then(m => ({ default: m.AdminPanel })));
const ClassRecord = lazy(() => import('./views/ClassRecord').then(m => ({ default: m.ClassRecord })));
const ProgressReport = lazy(() => import('./views/ProgressReport').then(m => ({ default: m.ProgressReport })));
const TransmutationSettings = lazy(() => import('./views/TransmutationSettings').then(m => ({ default: m.TransmutationSettings })));
const DescriptorSettings = lazy(() => import('./views/DescriptorSettings').then(m => ({ default: m.DescriptorSettings })));
const TemplatesView = lazy(() => import('./views/TemplatesView').then(m => ({ default: m.TemplatesView })));
const SubmittedRecords = lazy(() => import('./views/SubmittedRecords').then(m => ({ default: m.SubmittedRecords })));
const StudentManagementView = lazy(() => import('./components/layout/StudentManagementView').then(m => ({ default: m.StudentManagementView }))); // Renamed
const Login = lazy(() => import('./views/Login').then(m => ({ default: m.Login })));

export default function App() {
  const { 
    students, 
    subjects, 
    baseSubjects,
    savedClassRecords,
    classRecordLogs,
    users,
    registrations,
    sections,
    assignAdviser,
    createSection,
    updateSection,
    deleteSection,
    createBaseSubject,
    updateBaseSubject,
    deleteBaseSubject,
    addSubject,
    updateSubject,
    deleteSubject,
    updateUser,
    deleteUser,
    registerUser,
    approveRegistration,
    rejectRegistration,
    transmutationTable,
    descriptors,
    setTransmutationTable,
    setDescriptors,
    submitClassRecord,
    requestEditClassRecord,
    approveEditRequest,
    rejectEditRequest,
    lockClassRecord,
    updateCategoryWeight, 
    updateCategoryTitle,
    addCategory,
    removeCategory,
    resetSubjectTemplate,
    updateGrade, 
    updateColumnName,
    addColumnToCategory,
    removeColumnFromCategory,
    addStudent, // This is now addStudentToSection
    removeStudent,
    assignStudentToSection,
    updateStudent, // Pass updateStudent
    enrollStudentOverall // New
  } = useGradeManagement();

  const [selectedQuarter, setSelectedQuarter] = useState(1);
  // UPDATED: Now uses authService profile retrieval
  const [currentUser, setCurrentUser] = useState(() => authService.getProfile());

  const [selectedSubjectId, setSelectedSubjectId] = useState(() => {
    const user = authService.getProfile();
    return (user?.assignedSubjectIds && user.assignedSubjectIds.length > 0) ? user.assignedSubjectIds[0] : '';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const userHasSubjects = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return false;
    
    const mySubjects = subjects.filter(s =>
      (currentUser.assignedSubjectIds || []).includes(s.id) || s.teacherId === currentUser.id
    );

    if (currentUser.role === 'adviser' && currentUser.assignedSectionId) {
      // Adviser must teach at least one subject in their assigned section to access class records
      return mySubjects.some(s => s.sectionId === currentUser.assignedSectionId);
    }

    return mySubjects.length > 0;
  }, [currentUser, subjects]);

  const filteredSubjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return [];

    const myTeachingLoad = subjects.filter(s =>
      (currentUser.assignedSubjectIds || []).includes(s.id) || s.teacherId === currentUser.id
    );

    // Show all teaching load to allow viewing of submitted/locked records in the grading view
    let displayLoad = myTeachingLoad;

    if (currentUser.role === 'adviser' && currentUser.assignedSectionId) {
      const isTeachingInAdvisory = myTeachingLoad.some(s => s.sectionId === currentUser.assignedSectionId);
      if (!isTeachingInAdvisory) return [];
      
      // Advisers also see all subjects in their section (including locked ones for oversight)
      const advisorySubjects = subjects.filter(s => s.sectionId === currentUser.assignedSectionId);
      const combined = [...displayLoad, ...advisorySubjects];
      return combined.filter((s, idx, self) => self.findIndex(t => t.id === s.id) === idx);
    }

    return displayLoad;
  }, [currentUser, subjects, savedClassRecords]);

  const reportSubjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return subjects;
    if (currentUser.role === 'adviser' && currentUser.assignedSectionId) {
      return subjects.filter(s => s.sectionId === currentUser.assignedSectionId);
    }
    return [];
  }, [currentUser, subjects]);

  const selectedSubject = useMemo(() => {
    const found = filteredSubjects.find(s => s.id === selectedSubjectId);
    return found || filteredSubjects[0] || null;
  }, [selectedSubjectId, filteredSubjects, subjects]);

  // Loading fallback component
  const PageLoader = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
      <Loader2 className={`animate-spin text-${theme.styles.primary}`} size={32} />
      <p className="text-xs font-black uppercase tracking-widest italic">Loading GradeMaster...</p>
    </div>
  );

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        {!currentUser ? (
          <Login // UPDATED: Removed mock users/registrations props
            onRegister={registerUser}
            onLogin={(user) => {
              setCurrentUser(user);
              if (user.assignedSubjectIds && user.assignedSubjectIds.length > 0) {
                setSelectedSubjectId(user.assignedSubjectIds[0]);
              }
            }}
          />
        ) : (
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          onLogout={() => { // UPDATED: Centralized logout
            authService.logout();
            setCurrentUser(null);
          }}
          role={currentUser?.role} 
          hasSubjects={userHasSubjects}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          <Routes>
            <Route path="/" element={
              // UPDATED: All routes except login are protected
              <ProtectedRoute roles={['admin', 'teacher', 'adviser']}>
                <Header 
                  section={sections.find(s => s.id === currentUser.assignedSectionId) || INITIAL_SECTION}
                  userName={currentUser.name}
                />
                <div className="flex-1 overflow-auto p-4 md:p-8">
                  <Dashboard 
                    students={students}
                    subjects={subjects} 
                    baseSubjects={baseSubjects}
                      savedClassRecords={savedClassRecords}
                    transmutationTable={transmutationTable}
                    descriptors={descriptors}
                    section={INITIAL_SECTION} 
                    allSections={sections}
                    users={users}
                    onSelectSubject={setSelectedSubjectId}
                    role={currentUser.role}
                    currentTeacherId={currentUser.id}
                    onAddStudent={addStudent}
                    onRemoveStudent={removeStudent}
                    onAssignStudent={assignStudentToSection}
                    onAddSubject={addSubject}
                    onUpdateSubject={updateSubject}
                    onDeleteSubject={deleteSubject}
                  />
                </div>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <>
                  <Header 
                    section={INITIAL_SECTION} 
                    userName={currentUser.name}
                  />
                  <div className="flex-1 overflow-auto p-4 md:p-8">
                    <AdminPanel 
                      sections={sections} 
                      users={users} 
                      registrations={registrations}
                      onAssignAdviser={assignAdviser} 
                      onCreateSection={createSection}
                      onUpdateSection={updateSection}
                      onDeleteSection={deleteSection}
                      onApproveRegistration={approveRegistration}
                      onRejectRegistration={rejectRegistration}
                      baseSubjects={baseSubjects}
                      onCreateBaseSubject={createBaseSubject}
                      onUpdateBaseSubject={updateBaseSubject}
                      onDeleteBaseSubject={deleteBaseSubject}
                      onUpdateUser={updateUser}
                      onDeleteUser={deleteUser}
                      currentUserId={currentUser.id}
                    />
                  </div>
                </>
              </ProtectedRoute>
            } />
            
            <Route path="/record" element={
              <ProtectedRoute roles={['teacher', 'adviser']}>
                <>
                  <Header 
                    section={sections.find(s => s.id === selectedSubject?.sectionId) || INITIAL_SECTION}
                    userName={currentUser.name}
                    extraContent={
                      <div className="flex items-center gap-3">
                        <select 
                          value={selectedQuarter}
                          title="Select Quarter"
                          onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                          className="bg-indigo-600 text-white border-none rounded-lg px-2 md:px-4 py-2 text-xs md:text-sm font-black focus:ring-2 focus:ring-indigo-300 outline-none"
                        >
                          {[1, 2, 3, 4].map(q => (
                            <option key={q} value={q} className="text-slate-900 bg-white">QUARTER {q}</option>
                          ))}
                        </select>

                        {filteredSubjects.length > 1 && (
                          <select 
                            value={selectedSubjectId}
                            title="Select subject"
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 md:px-4 py-2 text-xs md:text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none max-w-[120px] md:max-w-none"
                          >
                            {filteredSubjects.map(sub => (
                              <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    }
                  />
                  <div className="flex-1 overflow-auto p-4 md:p-8">
                    {filteredSubjects.length > 0 && selectedSubject ? (
                      <ClassRecord 
                        students={students.filter(s => s.sectionId === selectedSubject.sectionId)} 
                        subject={selectedSubject} 
                        transmutationTable={transmutationTable}
                        descriptors={descriptors}
                        section={sections.find(sec => sec.id === selectedSubject.sectionId) || INITIAL_SECTION} 
                        userRole={currentUser.role}
                        currentUser={currentUser}
                        quarter={selectedQuarter}
                        isReadOnly={selectedSubject.teacherId !== currentUser.id}
                        savedRecord={savedClassRecords.find(record => record.id === `${selectedSubject.sectionId}-${selectedSubject.id}-Q${selectedQuarter}`)}
                        updateGrade={updateGrade}
                        onSubmitClassRecord={(data) => {
                          const result = submitClassRecord({ ...data, quarter: selectedQuarter });
                          if (!result.success) alert(result.message);
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                        <ShieldCheck size={48} className="opacity-20" />
                        <p className="font-bold">
                          {userHasSubjects ? "All assigned class records have been submitted and locked." : "No assigned subjects found for your account."}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              </ProtectedRoute>
            } />

            <Route path="/submitted-records" element={
              <ProtectedRoute roles={['teacher', 'adviser']}>
                <>
                  <Header 
                    section={sections.find(s => s.id === currentUser.assignedSectionId) || INITIAL_SECTION}
                    userName={currentUser.name}
                  />
                  <div className="flex-1 overflow-auto p-4 md:p-8">
                    <SubmittedRecords 
                      savedRecords={savedClassRecords}
                      classRecordLogs={classRecordLogs}
                      userRole={currentUser.role}
                      currentUserId={currentUser.id}
                      currentUserName={currentUser.name}
                      sections={sections}
                      onRequestEdit={requestEditClassRecord}
                      onApproveEdit={approveEditRequest}
                      onRejectEdit={rejectEditRequest}
                      onLockRecord={lockClassRecord}
                      onSelectSubject={setSelectedSubjectId}
                    />
                  </div>
                </>
              </ProtectedRoute>
            } />

            <Route path="/report" element={
              <ProtectedRoute roles={['admin', 'adviser']}>
                <>
                  <Header 
                    section={sections.find(s => s.id === currentUser.assignedSectionId) || INITIAL_SECTION}
                    userName={currentUser.name}
                  />
                  <div className="flex-1 overflow-auto p-4 md:p-8">
                    <ProgressReport 
                    students={students.filter(s => s.sectionId === (currentUser.assignedSectionId || sections[0]?.id || ''))} 
                      subjects={reportSubjects} 
                      transmutationTable={transmutationTable}
                      descriptors={descriptors}
                    section={sections.find(sec => sec.id === currentUser.assignedSectionId) || sections[0] || INITIAL_SECTION} 
                    savedClassRecords={savedClassRecords}
                    />
                  </div>
                </>
              </ProtectedRoute>
            } />

            <Route path="/transmutation-table" element={
              <ProtectedRoute roles={['admin']}>
                <>
                  <Header 
                    section={INITIAL_SECTION} 
                    userName={currentUser.name}
                  />
                  <div className="flex-1 overflow-auto p-4 md:p-8">
                    <TransmutationSettings data={transmutationTable} onSave={setTransmutationTable} />
                  </div>
                </>
              </ProtectedRoute>
            } />

            <Route path="/descriptors" element={
              <ProtectedRoute roles={['admin']}>
                <>
                  <Header 
                    section={INITIAL_SECTION} 
                    userName={currentUser.name}
                  />
                  <div className="flex-1 overflow-auto p-4 md:p-8">
                    <DescriptorSettings data={descriptors} onSave={setDescriptors} />
                  </div>
                </>
              </ProtectedRoute>
            } />

            <Route path="/templates" element={
              <ProtectedRoute roles={['admin']}>
                <>
                  <Header 
                    section={INITIAL_SECTION} 
                    userName={currentUser.name}
                  />
                  <div className="flex-1 overflow-auto p-4 md:p-8">
                    <TemplatesView 
                      subjects={baseSubjects}
                      students={students}
                      addCategory={addCategory}
                      removeCategory={removeCategory}
                      resetSubjectTemplate={resetSubjectTemplate}
                      updateCategoryTitle={updateCategoryTitle}
                      updateCategoryWeight={updateCategoryWeight}
                      addColumnToCategory={addColumnToCategory}
                      removeColumnFromCategory={removeColumnFromCategory}
                      updateColumnName={updateColumnName}
                    />
                  </div>
                </>
              </ProtectedRoute>
            } />

            <Route path="/student-management" element={
              <ProtectedRoute roles={['admin', 'adviser']}>
                <>
                  <Header 
                    section={INITIAL_SECTION} 
                    userName={currentUser.name}
                  />
                  <div className="flex-1 overflow-auto p-4 md:p-8">
                    <StudentManagementView
                      onEnrollStudent={enrollStudentOverall}
                      sections={sections} // Pass sections for potential future assignment features
                      schoolYears={['2025-2026', '2026-2027', '2027-2028']} // Example school years
                      students={students} // Pass students for the new management tab
                      onUpdateStudent={updateStudent} // Pass updateStudent for editing
                      onRemoveStudent={removeStudent} // Pass removeStudent for deleting
                    />
                  </div>
                </>
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
        )}
      </Suspense>
    </Router>
  );
}

function ShieldCheck({ size, className }) {
  return <ShieldAlert size={size} className={className} />;
}