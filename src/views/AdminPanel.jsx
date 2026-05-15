
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Shield, 
  User, 
  GraduationCap, 
  Plus,
  History, 
  Check, 
  X,
  Eye,
  Search,
  Layers, Pencil,
  Settings,
  School,
  BookOpen, 
  Mail,
  Clock,
  Users,
  Trash2,
  Loader2
} from 'lucide-react';
import { theme } from '../theme';
import authService from '../services/authService';
import schoolService from '../services/schoolService';
import { ApiConnectionErrorDisplay } from '../components/ApiConnectionErrorDisplay';
import { SectionCard } from './admin/components/SectionCard';
import { RegistrationCard } from './admin/components/RegistrationCard';

export function AdminPanel({ 
  sections, 
  users, 
  registrations, 
  onAssignAdviser, 
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
  onApproveRegistration,
  onRejectRegistration,
  baseSubjects = [],
  subjects = [], // Added subjects prop
  onCreateBaseSubject,
  onUpdateBaseSubject,
  onDeleteBaseSubject,
  onUpdateUser,
  onDeleteUser,
  currentUser,
  syncError,
  syncAuthData, // Function to sync auth data
  syncSections, // Function to sync sections data
  syncSubjects, // Function to sync subjects/templates
  authLoading, // Loading state from auth hook
  sectionsLoading, 
  subjectsLoading,
  maxQuarters,
  onMaxQuartersChange
}) {
  // HOOKS MUST BE CALLED AT THE TOP LEVEL
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('sections'); // 'sections' | 'templates' | 'users' | 'registrations'
  const [isCreating, setIsCreating] = React.useState(false);
  const [isSectionCreatingOrUpdating, setIsSectionCreatingOrUpdating] = React.useState(false); 
  const [isBaseSubjectCreatingOrUpdating, setIsBaseSubjectCreatingOrUpdating] = React.useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = React.useState(false);
  const [editingSectionId, setEditingSectionId] = React.useState(null);
  const [editingBaseSubjectId, setEditingBaseSubjectId] = React.useState(null);
  const [baseEditFormData, setBaseEditFormData] = React.useState({ name: '', code: '', gradeLevel: '7', schoolId: '' });
  const [userSearchQuery, setUserSearchQuery] = React.useState('');

  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role?.toLowerCase();
  const currentUserSchoolId = currentUser?.schoolId;

  // State for user editing
  const [editingUserId, setEditingUserId] = React.useState(null);
  const [editUserFormData, setEditUserFormData] = React.useState({
    name: '',
    username: '',
    role: '',
    assignedSectionId: '',
    assignedSubjectIds: [],
    status: '',
    schoolId: ''
  });
  const [approvalForms, setApprovalForms] = React.useState({});
  const [baseSubjectForm, setBaseSubjectForm] = React.useState({ 
    name: '', 
    code: '', 
    gradeLevel: '7',
    schoolId: ''
  });

  const [schools, setSchools] = React.useState([]);

  React.useEffect(() => {
    if (currentUserRole === 'superadmin') {
      schoolService.getSchools()
        .then(setSchools)
        .catch(err => console.error("Failed to fetch schools list:", err));
    }
  }, [currentUserRole]);

  // Initialize baseSubjectForm schoolId when role is known
  React.useEffect(() => {
    if (currentUserRole === 'admin' && currentUserSchoolId) {
        setBaseSubjectForm(prev => ({ ...prev, schoolId: currentUserSchoolId }));
    }
  }, [currentUserRole, currentUserSchoolId]);

  const [isCreatingBaseSubject, setIsCreatingBaseSubject] = React.useState(false);
  const [isUpdatingBaseSubject, setIsUpdatingBaseSubject] = React.useState(false);
  const [deletingBaseSubjectId, setDeletingBaseSubjectId] = React.useState(null);
  
  const [formData, setFormData] = React.useState({
    name: '',
    gradeLevel: '7',
    schoolYear: '2025-2026',
    schoolId: currentUserSchoolId || '', // Default to current user's schoolId
    schoolName: currentUser?.schoolName || '', // Default to current user's schoolName
    region: 'REGION II',
    division: 'CAGAYAN VALLEY'
  });

  // Sync form with currentUser context when it becomes available or changes
  React.useEffect(() => {
    if (currentUserRole === 'admin' && currentUserSchoolId) {
      setFormData(prev => ({
        ...prev,
        schoolId: currentUserSchoolId,
        schoolName: currentUser?.schoolName || prev.schoolName,
      }));
    }
  }, [currentUserSchoolId, currentUser?.schoolName, currentUserRole]);
  
  // EARLY RETURNS MUST HAPPEN AFTER ALL HOOKS ARE DEFINED
  if (syncError) return <ApiConnectionErrorDisplay />;

  // NEW: Filter sections by school for Admins
  const filteredSections = React.useMemo(() => {
    if (currentUserRole === 'superadmin') return sections;
    return sections.filter(s => String(s.schoolId) === String(currentUserSchoolId));
  }, [sections, currentUserRole, currentUserSchoolId]);

  // NEW: Filter users by school for Admins
  const filteredUsers = React.useMemo(() => {
    if (currentUserRole === 'superadmin') return users;
    return users.filter(u => String(u.schoolId) === String(currentUserSchoolId));
  }, [users, currentUserRole, currentUserSchoolId]);

  // NEW: Filter users by search query for display in the Users tab
  const searchedUsers = React.useMemo(() => {
    if (!userSearchQuery.trim()) return filteredUsers;
    const q = userSearchQuery.toLowerCase();
    return filteredUsers.filter(u => 
      (u.name || "").toLowerCase().includes(q) || 
      (u.username || "").toLowerCase().includes(q)
    );
  }, [filteredUsers, userSearchQuery]);

  const teachers = filteredUsers.filter(u => u.role === 'teacher' || u.role === 'adviser');
  // Filter out the current user from the list of assignable advisers for sections
  const assignableAdvisers = filteredUsers.filter(u => u.role === 'adviser' && u.id !== currentUserId);

  // NEW: Hierarchical Registration filtering
  const pendingRegistrations = React.useMemo(() => {
    const pending = registrations.filter(r => r.status === 'pending');
    if (currentUserRole === 'superadmin') {
      // Superadmins only see/approve other admin accounts
      return pending.filter(r => (r.requestedRole || r.requested_role) === 'admin');
    }
    if (currentUserRole === 'admin') {
      // Admins see/approve faculty for their specific school
      return pending.filter(r => 
        (r.requestedRole || r.requested_role) !== 'admin' && 
        String(r.schoolId) === String(currentUserSchoolId)
      );
    }
    return [];
  }, [registrations, currentUserRole, currentUserSchoolId]);

  // NEW: Filter baseSubjects by school for Admins
  const filteredBaseSubjects = React.useMemo(() => {
    if (currentUserRole === 'superadmin') return baseSubjects;
    return baseSubjects.filter(b => String(b.schoolId) === String(currentUserSchoolId));
  }, [baseSubjects, currentUserRole, currentUserSchoolId]);

  // NEW: Filter subjects (for user teaching load assignment) by school for Admins
  const filteredSubjectsForSchool = React.useMemo(() => {
    if (currentUserRole === 'superadmin') return subjects;
    const schoolSectionIds = new Set(filteredSections.map(s => String(s.id)));
    return subjects.filter(sub => schoolSectionIds.has(String(sub.sectionId)));
  }, [subjects, filteredSections, currentUserRole]);

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUserFormData({
      name: user.name, // Ensure name is passed
      username: user.username,
      role: user.role,
      assignedSectionId: user.assignedSectionId ? String(user.assignedSectionId) : '',
      assignedSubjectIds: (user.assignedSubjectIds || []).map(String),
      status: user.status,
      schoolId: user.schoolId || (currentUserRole === 'admin' ? currentUserSchoolId : '')
    });
  };

  // Auto-populate school details when schoolId changes in the form
  React.useEffect(() => {
    const fetchSchoolDetails = async () => {
      if (!formData.schoolId) return;

      try {
        const school = await schoolService.getSchoolById(formData.schoolId);
        if (school) {
          // Update schoolName, region, and division based on fetched school details
          setFormData(prev => ({
            ...prev,
            schoolName: (school.name || school.Name || school.schoolName || '').toUpperCase(),
            region: (school.region || school.Region || prev.region).toUpperCase(),
            division: (school.division || school.Division || prev.division).toUpperCase()
          }));
        }
      } catch (error) {
        // Background lookup failed, typically because ID is being typed
        console.debug("Background school lookup failed for ID:", formData.schoolId);
      }
    };
    fetchSchoolDetails();
  }, [formData.schoolId]);

  const handleSaveUser = async (userId) => {
    setIsUpdatingUser(true);
    try {
      // Directly call the authService to ensure the PUT /api/profiles/{id} endpoint is hit
      await authService.updateProfile(userId, {
        Name: editUserFormData.name,
        Role: editUserFormData.role,
        SectionId: editUserFormData.assignedSectionId ? parseInt(editUserFormData.assignedSectionId, 10) : null,
        SubjectIds: editUserFormData.assignedSubjectIds.map(id => parseInt(id, 10)),
        Status: editUserFormData.status,
        SchoolId: currentUserRole === 'admin' ? currentUserSchoolId : editUserFormData.schoolId
      });
      alert('User updated successfully!');
      setEditingUserId(null); // Exit edit mode
      await syncAuthData(); // Re-sync auth data to ensure the list is fresh
    } catch (error) {
      alert(`Failed to update user: ${error.message || error}`);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleUpdateSection = (id) => {
    if (!formData.name || !formData.gradeLevel) return;
    setIsSectionCreatingOrUpdating(true);
    try {
      onUpdateSection(id, {
        name: formData.name.toUpperCase(),
        gradeLevel: formData.gradeLevel
      });
      setEditingSectionId(null);
    } finally {
      setIsSectionCreatingOrUpdating(false);
    }
    setFormData({ 
      name: '', 
      gradeLevel: '7',
      schoolYear: '2025-2026',
      schoolId: currentUserSchoolId || '', // Ensure schoolId is reset to current user's school
      schoolName: currentUser?.schoolName || '',
      region: 'REGION II',
      division: 'CAGAYAN VALLEY'
    });
  };

  const handleApprove = (regId) => {
    const reg = registrations.find(r => r.id === regId);
    // Pre-select the requested role from the registration
    const form = approvalForms[regId] || { role: reg?.requestedRole || 'teacher', sectionId: '', subjectIds: [] };
    // Assuming onApproveRegistration handles its own loading/error
    try {
      onApproveRegistration(regId, form.role, form.sectionId);
    } catch (error) {
      console.error("Error approving registration:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSectionCreatingOrUpdating(true);
    try {
      onCreateSection(formData);
      setIsCreating(false);
      setFormData({ ...formData, name: '' });
    } finally {
      setIsSectionCreatingOrUpdating(false);
    }
  };

  // Group sections by grade level
  const groupedSections = filteredSections.reduce((acc, section) => {
    const grade = section.gradeLevel;
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(section);
    return acc;
  }, {});

  // Sort grade levels
  const sortedGrades = Object.keys(groupedSections).sort((a, b) => parseInt(a) - parseInt(b));

  const groupedBaseSubjects = filteredBaseSubjects.reduce((acc, base) => {
    const grade = base.gradeLevel;
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(base);
    return acc;
  }, {});
  const sortedBaseGrades = Object.keys(groupedBaseSubjects).sort((a, b) => parseInt(a) - parseInt(b));

  const handleAddBaseSubject = async (e) => {
    e.preventDefault();
    setIsBaseSubjectCreatingOrUpdating(true);
    try {
      const data = {
        Name: baseSubjectForm.name.toUpperCase(),
        Code: baseSubjectForm.code,
        GradeLevel: baseSubjectForm.gradeLevel,
        SchoolId: baseSubjectForm.schoolId || currentUserSchoolId, 
        CategoriesJson: JSON.stringify([])
      };
      await onCreateBaseSubject(data);
      setBaseSubjectForm({ 
        name: '', 
        code: '', 
        gradeLevel: '7',
        schoolId: currentUserRole === 'admin' ? currentUserSchoolId : ''
      });
    } catch (error) {
      console.error('Failed to create base subject:', error);
      // Error will be caught by syncError, or specific error message can be displayed
    } finally {
      setIsBaseSubjectCreatingOrUpdating(false);
    }
  };

  const handleUpdateBaseSubject = async (id) => {
    if (!baseEditFormData.name || !baseEditFormData.code) return;
    setIsBaseSubjectCreatingOrUpdating(true);
    
    // Find the existing subject to preserve its categories
    const existing = baseSubjects.find(s => String(s.id) === String(id));
    
    try {
      const data = {
        Name: baseEditFormData.name.toUpperCase(),
        Code: baseEditFormData.code.toUpperCase(),
        SchoolId: baseEditFormData.schoolId || currentUserSchoolId, // Ensure schoolId is passed for updates
        GradeLevel: baseEditFormData.gradeLevel,
        CategoriesJson: JSON.stringify(existing?.categories || []), // Stringify categories for backend
        PushToInstances: false // TODO: Add UI option to push changes to instances
      };
      await onUpdateBaseSubject(id, data);
      setEditingBaseSubjectId(null);
    } catch (error) {
      console.error('Failed to update base subject:', error);
      // Error will be caught by syncError, or specific error message can be displayed
    } finally {
      setIsBaseSubjectCreatingOrUpdating(false);
    }
  };

  const handleDeleteBaseSubject = async (id) => {
    if (window.confirm('Are you sure you want to delete this base subject? This action cannot be undone.')) {
      setDeletingBaseSubjectId(id);
      try {
        await onDeleteBaseSubject(id);
      } catch (error) {
        console.error('Failed to delete base subject:', error);
        // Error will be caught by syncError, or specific error message can be displayed
      } finally {
        setDeletingBaseSubjectId(null);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-6 ${theme.styles.card}`}>
        <div className="flex items-center gap-4 min-w-0">
          <div className="size-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Shield size={24} />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Admin Control Center</h2>
            {currentUserSchoolId && (
              <span className="inline-block bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter mt-1 border border-indigo-200">
                School Scope: {currentUserSchoolId}
              </span>
            )}
            <p className="text-xs text-slate-600 font-medium mt-1">
              {activeTab === 'sections' && "Manage class sections and teacher assignments."}
              {activeTab === 'templates' && "Define global grading structures for subjects."}
              {activeTab === 'users' && "Manage system users and access levels."}
              {activeTab === 'registrations' && "Review and approve new faculty applications."}
            </p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full scrollbar-hide">
          <TabButton 
            active={activeTab === 'sections'} 
            onClick={() => setActiveTab('sections')}
            icon={<Layers size={14} />}
            label="Sections"
          />
          <TabButton 
            active={activeTab === 'templates'} 
            onClick={() => setActiveTab('templates')}
            icon={<BookOpen size={14} />}
            label="Templates"
          />
          <TabButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')}
            icon={<Users size={14} />}
            label="Users"
          />
          <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings size={14} />}
            label="Settings"
          />
          {pendingRegistrations.length > 0 && (
            <TabButton 
              active={activeTab === 'registrations'} 
              onClick={() => setActiveTab('registrations')}
              icon={<Mail size={14} />}
              label={`Approvals (${pendingRegistrations.length})`}
              isAlert
            />
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'sections' && (
          <motion.div
            key="sections"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-500">Class Section Management</h3>
              <button 
                onClick={() => setIsCreating(!isCreating)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                {isCreating ? 'Cancel' : <><Plus size={14} /> Create New Class</>}
              </button>
            </div>

            {(authLoading || sectionsLoading) && (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span className="text-sm font-medium">Loading sections...</span>
              </div>
            )}

            {isCreating && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleSubmit}
                className={`p-6 rounded-2xl border-2 border-indigo-100 shadow-xl space-y-4 ${theme.styles.card}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Grade Level</label>
                    <select 
                      value={formData.gradeLevel}
                      onChange={e => setFormData({...formData, gradeLevel: e.target.value})}
                      className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-4 py-2 font-bold text-slate-700`}
                    >
                      {['7', '8', '9', '10', '11', '12'].map(g => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Section Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. ST. AUGUSTINE"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                      className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-4 py-2 font-bold text-slate-700`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">School ID</label>
                    <input 
                      type="text"
                      placeholder="e.g. 123456"
                      value={formData.schoolId}
                      onChange={e => setFormData({...formData, schoolId: e.target.value})}
                      disabled={currentUserRole === 'admin'} // Use theme.styles.input
                      className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-4 py-2 font-bold text-slate-700 disabled:opacity-60`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">School Name</label>
                    <input 
                      readOnly
                      type="text"
                      placeholder="Auto-populated..."
                      value={formData.schoolName}
                      className={`${theme.styles.input} !bg-slate-100/50 !border-slate-200/50 !rounded-xl px-4 py-2 font-bold text-slate-500 cursor-not-allowed`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">School Year</label>
                    <input 
                      type="text"
                      value={formData.schoolYear}
                      onChange={e => setFormData({...formData, schoolYear: e.target.value})}
                      className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-4 py-2 font-bold text-slate-700`}
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isSectionCreatingOrUpdating}
                  className="w-full py-3 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Confirm & Save Section
                </button>
              </motion.form>
            )}

            <div className="space-y-10">
              {sortedGrades.map(grade => (
                <div key={grade} className="space-y-4">
                  <div className="flex items-center gap-4 px-2">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-500">Grade {grade} Sections</h3>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {groupedSections[grade].map(section => {
                      const currentAdviser = users.find(u => u.id === section.adviserId);
                      return (
                        <SectionCard 
                          key={section.id}
                          section={section}
                          formData={formData}
                          setFormData={setFormData}
                          editingSectionId={editingSectionId}
                          setEditingSectionId={setEditingSectionId}
                          handleUpdateSection={handleUpdateSection}
                          onDeleteSection={onDeleteSection}
                          onAssignAdviser={onAssignAdviser}
                          teachers={teachers}
                          currentAdviser={currentAdviser}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {authLoading && (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span className="text-sm font-medium">Loading users...</span>
              </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-500">System User Management</h3>
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="Search user name or username..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className={`${theme.styles.input} !py-2.5 !pl-12 !pr-4 text-sm`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchedUsers.map(user => (
                <div key={user.id} className={`${theme.styles.card} p-6 flex flex-col gap-5 group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10`}>
                  {/* Role Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${user.role === 'admin' || user.role === 'superadmin' ? 'bg-indigo-500' : user.role === 'adviser' ? 'bg-emerald-500' : 'bg-blue-400'}`} />

                  {editingUserId === user.id ? (
                    // Edit Form (using theme.styles.input for consistency)
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Name</label>
                        <input
                          type="text"
                          value={editUserFormData.name}
                          onChange={e => setEditUserFormData({ ...editUserFormData, name: e.target.value })}
                          className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-3 py-2 text-xs font-bold uppercase`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Username</label>
                        <input
                          type="text"
                          value={editUserFormData.username}
                          onChange={e => setEditUserFormData({ ...editUserFormData, username: e.target.value })}
                          className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-3 py-2 text-xs font-bold`}
                          disabled // Username usually not editable
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Access Level</label>
                        <select
                          value={editUserFormData.role}
                          onChange={e => setEditUserFormData({ ...editUserFormData, role: e.target.value })}
                          className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-3 py-2 text-[10px] font-bold uppercase`}
                          disabled={user.id === currentUserId}
                        >
                          {currentUserRole === 'superadmin' && <option value="admin">Admin</option>}
                          <option value="teacher">Teacher</option>
                          <option value="adviser">Adviser</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">School ID</label>
                        <input
                          type="text"
                          value={editUserFormData.schoolId}
                          onChange={e => setEditUserFormData({ ...editUserFormData, schoolId: e.target.value })}
                          className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-3 py-2 text-xs font-bold`}
                          disabled={currentUserRole === 'admin'}
                          placeholder={currentUserRole === 'admin' ? currentUserSchoolId : "Enter School ID"}
                        />
                      </div>

                      {editUserFormData.role === 'adviser' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Assigned Section (Adviser)</label>
                          <select
                            value={editUserFormData.assignedSectionId}
                            onChange={e => setEditUserFormData({ ...editUserFormData, assignedSectionId: e.target.value })}
                            className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-3 py-2 text-[10px] font-bold uppercase`}
                          >
                            <option value="">None</option>
                            {filteredSections.map(section => (
                              <option key={section.id} value={section.id}>
                                G{section.gradeLevel} - {section.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {(editUserFormData.role === 'teacher' || editUserFormData.role === 'adviser') && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Assigned Subjects (Teacher)</label>
                          <select
                            multiple
                            value={editUserFormData.assignedSubjectIds}
                            onChange={e => {
                              const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                              setEditUserFormData({ ...editUserFormData, assignedSubjectIds: selectedOptions });
                            }}
                            className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-3 py-2 text-[10px] font-bold uppercase h-24`}
                          >
                          {filteredSubjectsForSchool.map(subject => (
                              <option key={subject.id} value={subject.id}>
                                G{subject.gradeLevel} - {subject.name} ({filteredSections.find(s => String(s.id) === String(subject.sectionId))?.name || 'N/A'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Status</label>
                        <select
                          value={editUserFormData.status}
                          onChange={e => setEditUserFormData({ ...editUserFormData, status: e.target.value })}
                          className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-3 py-2 text-[10px] font-bold uppercase`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="px-3 py-1 bg-white/50 border border-white/60 text-slate-500 text-xs font-black uppercase rounded-lg hover:bg-white/70 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveUser(user.id)}
                          disabled={isUpdatingUser}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs font-black uppercase rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isUpdatingUser ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display View
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className={`size-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${user.role === 'admin' || user.role === 'superadmin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                            {user.role === 'admin' || user.role === 'superadmin' ? <Shield size={24} /> : <User size={24} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-slate-800 uppercase italic text-sm leading-tight truncate tracking-tight">{user.name}</h4>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] truncate">@{user.username}</p>
                          </div>
                        </div>
                        {user.id === currentUserId && (
                          <span className="text-[8px] font-black text-white bg-indigo-600 px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm shrink-0">You</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Level</label>
                          <div className="flex items-center gap-1.5">
                            <div className={`size-2 rounded-full ${user.role === 'admin' || user.role === 'superadmin' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                            <span className="text-[10px] font-black text-slate-700 uppercase">{user.role}</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                              {user.status === 'active' ? <Check size={8} /> : <X size={8} />}
                              {user.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 px-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">School ID</span>
                          <span className="font-black text-slate-700 font-mono">{user.schoolId || 'N/A'}</span>
                        </div>
                        {user.role === 'adviser' && user.assignedSectionId && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-500 uppercase tracking-wider">Advisory</span>
                            <span className="font-black text-indigo-600 truncate max-w-[140px] text-right">
                              {filteredSections.find(s => String(s.id) === String(user.assignedSectionId))?.name || 'Assigned'}
                            </span>
                          </div>
                        )}
                        {(user.role === 'teacher' || user.role === 'adviser') && user.assignedSubjectIds && user.assignedSubjectIds.length > 0 && (
                          <div className="flex justify-between items-start text-[10px] gap-2">
                            <span className="font-bold text-slate-500 uppercase tracking-wider shrink-0">Teaching</span>
                            <span className="font-black text-slate-600 text-right line-clamp-1 leading-tight">
                              {user.assignedSubjectIds.length} Active Subjects
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-end gap-1">
                        <button
                          onClick={() => handleEditUser(user)}
                          disabled={user.id === currentUserId} // Prevent editing self for now, or allow specific fields
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-0"
                          title="Edit User"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          disabled={user.id === currentUserId}
                          onClick={() => onDeleteUser(user.id)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-0"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {(subjectsLoading || isBaseSubjectCreatingOrUpdating) && (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span className="text-sm font-medium">Processing subject templates...</span>
              </div>
            )}

            <div className={`${theme.styles.card} p-8`}>
              <div className="mb-10 border-b border-white/40 pb-6">
                <h3 className="text-xl font-black uppercase italic text-slate-800 flex items-center gap-3">
                  <BookOpen className="text-indigo-600" size={24} /> Global Subject Templates
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-tight">Define standard grading structures and categories for subjects.</p>
              </div>

              {/* Add Template Form Panel */}
              <div className="bg-slate-100/30 rounded-3xl p-6 border border-slate-200/50 mb-10 shadow-inner">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 ml-1">New Template Entry</p>
                <form onSubmit={handleAddBaseSubject} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-slate-700 items-end">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">System Code</label>
                    <input 
                      placeholder="AUTO" 
                      value={baseSubjectForm.code}
                      readOnly
                      className="w-full bg-slate-100/50 border border-slate-200/50 rounded-xl px-4 py-3 font-bold text-xs cursor-not-allowed opacity-70" 
                    />
                  </div>
                  <div className="space-y-1 lg:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Subject Name</label>
                    <input 
                      placeholder="e.g. SCIENCE" 
                      value={baseSubjectForm.name}
                      onChange={e => {
                        const newName = e.target.value.toUpperCase();
                        setBaseSubjectForm({
                          ...baseSubjectForm, 
                          name: newName,
                          code: `${baseSubjectForm.gradeLevel}${newName.replace(/\s+/g, '')}`
                        });
                      }}
                      className={`${theme.styles.input} !bg-white/80 !border-white/90 !rounded-xl px-4 py-3 font-bold text-xs`} 
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Grade Level</label>
                    <select 
                      value={baseSubjectForm.gradeLevel}
                      onChange={e => {
                        const newGrade = e.target.value;
                        setBaseSubjectForm({
                          ...baseSubjectForm, 
                          gradeLevel: newGrade,
                          code: `${newGrade}${baseSubjectForm.name.replace(/\s+/g, '')}`
                        });
                      }}
                      className={`${theme.styles.input} !bg-white/80 !border-white/90 !rounded-xl px-4 py-3 font-bold text-xs`}
                    >
                      {['7','8','9','10','11','12'].map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1 lg:col-span-2">
                    {currentUserRole === 'superadmin' ? (
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">School Scope</label>
                          <select 
                            value={baseSubjectForm.schoolId}
                            onChange={e => setBaseSubjectForm({...baseSubjectForm, schoolId: e.target.value})}
                            className={`${theme.styles.input} !bg-white/80 !border-white/90 !rounded-xl px-4 py-3 font-bold text-xs`}
                            required
                          >
                            <option value="" disabled>Select School</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <button 
                          type="submit" 
                          disabled={isBaseSubjectCreatingOrUpdating}
                          className="bg-indigo-600 text-white p-3 rounded-xl disabled:opacity-50 shadow-lg shadow-indigo-100"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="submit" 
                        disabled={isBaseSubjectCreatingOrUpdating}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl disabled:opacity-50 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                      >
                        <Plus size={16} /> Create Template
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="space-y-8">
                  {Object.keys(groupedBaseSubjects).sort((a, b) => parseInt(a) - parseInt(b)).map(grade => (
                  <div key={grade} className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <h4 className="text-xs font-black text-indigo-500 uppercase tracking-[0.25em] px-2 italic">Grade {grade} Curriculum</h4>
                      <div className="h-px flex-1 bg-slate-100"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredBaseSubjects.filter(b => b.gradeLevel === grade).sort((a, b) => a.name.localeCompare(b.name)).map(base => {
                          const isConfigured = base.categories && base.categories.length > 0;
                          const isComposite = base.categories?.some(c => c.isComponent);
                          return (
                        <div key={base.id} className="p-5 bg-white rounded-3xl border border-slate-100 flex justify-between items-center group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden">
                          {/* Configuration Status Accent */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isConfigured ? 'bg-indigo-500' : 'bg-rose-400 opacity-50'}`} />
                          
                          {editingBaseSubjectId === base.id ? (
                            <div className="flex-1 space-y-2 mr-4">
                              <input 
                                value={baseEditFormData.code}
                                onChange={e => setBaseEditFormData({ ...baseEditFormData, code: e.target.value.toUpperCase() })}
                                className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-lg px-2 py-1 text-[10px] font-black`}
                                placeholder="CODE"
                              />
                              <input 
                                value={baseEditFormData.name}
                                onChange={e => setBaseEditFormData({ ...baseEditFormData, name: e.target.value.toUpperCase() })}
                                className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-lg px-2 py-1 text-xs font-bold`}
                                placeholder="NAME"
                                autoFocus
                              />
                              {currentUserRole === 'superadmin' && (
                                <select 
                                  value={baseEditFormData.schoolId}
                                  onChange={e => setBaseEditFormData({...baseEditFormData, schoolId: e.target.value})}
                                  className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-lg px-2 py-1 text-[10px] font-bold`}
                                  required
                                >
                                  <option value="" disabled>Transfer to School...</option>
                                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                              )}
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleUpdateBaseSubject(base.id)}
                                  className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded hover:bg-indigo-700 transition-colors"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => setEditingBaseSubjectId(null)}
                                  className="px-2 py-1 bg-white/50 border border-white/60 text-slate-400 text-[10px] font-black uppercase rounded hover:bg-white/70 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="min-w-0 flex-1 pl-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50 uppercase tracking-wider">{base.code}</span>
                                {isConfigured ? (
                                   <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                     <Check size={8} /> CONFIGURED
                                   </span>
                                ) : (
                                   <span className="text-[10px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded border border-rose-100">
                                     NO TEMPLATE
                                   </span>
                                )}
                              </div>
                              <h4 className="font-black text-slate-800 text-base truncate uppercase tracking-tight">{base.name}</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                {isComposite ? 'Composite Component Structure' : 'Standard Subject Template'}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-1 ml-4">
                            {editingBaseSubjectId !== base.id && (
                              <button 
                                onClick={() => {
                                  setEditingBaseSubjectId(base.id);
                                  setBaseEditFormData({ 
                                    name: base.name, 
                                    code: base.code, 
                                    gradeLevel: base.gradeLevel,
                                    schoolId: base.schoolId || '' // Ensure schoolId is explicitly set from base object
                                  });
                                }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Edit Label"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => navigate('/templates', { state: { subjectId: base.id } })}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Configure Structure"
                            >
                              <Settings size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteBaseSubject(base.id)} 
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl"
          >
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-black uppercase italic text-slate-800 flex items-center gap-3">
                <Settings className="text-indigo-600" /> System Configuration
              </h3>
              
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Grading Periods (Quarters)</label>
                  <select 
                    value={maxQuarters}
                    onChange={(e) => onMaxQuartersChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} Quarters per Year</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-2 italic font-medium">Changing this will update all dropdowns and report cards across the system.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'registrations' && (
          <motion.div
            key="registrations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {authLoading && (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span className="text-sm font-medium">Loading registrations...</span>
              </div>
            )}
          <div className="flex items-center gap-3 text-slate-500 mb-6 pb-2 border-b border-slate-100 overflow-hidden">
            <div className="size-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
              {/* Icon */}
              <Mail size={16} />
            </div>
            {/* Title and Count */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
              <h3 className="text-sm font-black uppercase tracking-normal sm:tracking-widest truncate flex-1 min-w-0 text-slate-500">
                Pending Registrations
              </h3>
              <span className="w-fit bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black border border-amber-200/50 shrink-0 uppercase tracking-tighter">
                {pendingRegistrations.length} Applications
              </span>
            </div>
          </div>
            {/* Registration Cards Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {pendingRegistrations.map(reg => {
                const form = approvalForms[reg.id] || { role: reg.requestedRole || 'teacher', sectionId: '', subjectIds: [] };
                return (
                  <RegistrationCard 
                    key={reg.id}
                    reg={reg}
                    form={form}
                    setApprovalForms={setApprovalForms}
                    sections={filteredSections}
                    onRejectRegistration={onRejectRegistration}
                    handleApprove={handleApprove}
                    currentUserRole={currentUserRole}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function TabButton({ active, onClick, icon, label, isAlert }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 md:px-6 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all whitespace-nowrap shrink-0 ${active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'} ${isAlert && !active ? 'text-amber-500' : ''}`}
    >
      {icon}
      {label}
    </button>
  );
}