
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
  Layers,
  Settings,
  BookOpen, 
  Mail,
  Clock,
  Users,
  Trash2
} from 'lucide-react';
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
  onCreateBaseSubject,
  onUpdateBaseSubject,
  onDeleteBaseSubject,
  onUpdateUser,
  onDeleteUser,
  currentUserId
}) {
  const teachers = users.filter(u => u.role === 'teacher' || u.role === 'adviser');
  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const [isCreating, setIsCreating] = React.useState(false);
  const navigate = useNavigate();
  const [editingSectionId, setEditingSectionId] = React.useState(null);
  const [editingBaseSubjectId, setEditingBaseSubjectId] = React.useState(null);
  const [baseEditFormData, setBaseEditFormData] = React.useState({ name: '', code: '', gradeLevel: '7' });
  const [activeTab, setActiveTab] = React.useState('sections'); // 'sections' | 'templates' | 'users' | 'registrations'
  const [approvalForms, setApprovalForms] = React.useState({});

  const handleUpdateSection = (id) => {
    if (!formData.name || !formData.gradeLevel) return;
    onUpdateSection(id, {
      name: formData.name.toUpperCase(),
      gradeLevel: formData.gradeLevel
    });
    setEditingSectionId(null);
    setFormData({ 
      name: '', 
      gradeLevel: '7',
      schoolYear: '2025-2026',
      schoolId: '123456',
      schoolName: 'MABINI HIGH SCHOOL',
      region: 'REGION I',
      division: 'PANGASINAN II'
    });
  };

  const handleApprove = (regId) => {
    const reg = registrations.find(r => r.id === regId);
    // Default to 'teacher' and no section if the admin hasn't interacted with the form yet
    const form = approvalForms[regId] || { role: reg?.requestedRole || 'teacher', sectionId: '' };
    onApproveRegistration(regId, form.role, form.sectionId);
  };

  const [formData, setFormData] = React.useState({
    name: '',
    gradeLevel: '7',
    schoolYear: '2025-2026',
    schoolId: '123456',
    schoolName: 'MABINI HIGH SCHOOL',
    region: 'REGION I',
    division: 'PANGASINAN II'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateSection(formData);
    setIsCreating(false);
    setFormData({ ...formData, name: '' });
  };

  // Group sections by grade level
  const groupedSections = sections.reduce((acc, section) => {
    const grade = section.gradeLevel;
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(section);
    return acc;
  }, {});

  // Sort grade levels
  const sortedGrades = Object.keys(groupedSections).sort((a, b) => parseInt(a) - parseInt(b));

  const groupedBaseSubjects = baseSubjects.reduce((acc, base) => {
    const grade = base.gradeLevel;
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(base);
    return acc;
  }, {});
  const sortedBaseGrades = Object.keys(groupedBaseSubjects).sort((a, b) => parseInt(a) - parseInt(b));

  const [baseSubjectForm, setBaseSubjectForm] = React.useState({ name: '', code: '', gradeLevel: '7' });

  const handleAddBaseSubject = (e) => {
    e.preventDefault();
    onCreateBaseSubject(baseSubjectForm);
    setBaseSubjectForm({ name: '', code: '', gradeLevel: '7' });
  };

  const handleUpdateBaseSubject = (id) => {
    if (!baseEditFormData.name || !baseEditFormData.code) return;
    onUpdateBaseSubject(id, {
      name: baseEditFormData.name.toUpperCase(),
      code: baseEditFormData.code.toUpperCase(),
      gradeLevel: baseEditFormData.gradeLevel
    });
    setEditingBaseSubjectId(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Admin Control Center</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {activeTab === 'sections' && "Manage class sections and teacher assignments."}
              {activeTab === 'templates' && "Define global grading structures for subjects."}
              {activeTab === 'users' && "Manage system users and access levels."}
              {activeTab === 'registrations' && "Review and approve new faculty applications."}
            </p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
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
          {pendingRegistrations.length > 0 && (
            <TabButton 
              active={activeTab === 'registrations'} 
              onClick={() => setActiveTab('registrations')}
              icon={<Clock size={14} />}
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
              <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-400">Class Section Management</h3>
              <button 
                onClick={() => setIsCreating(!isCreating)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                {isCreating ? 'Cancel' : <><Plus size={14} /> Create New Class</>}
              </button>
            </div>

            {isCreating && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-xl space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Grade Level</label>
                    <select 
                      value={formData.gradeLevel}
                      onChange={e => setFormData({...formData, gradeLevel: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700"
                    >
                      {['7', '8', '9', '10', '11', '12'].map(g => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Section Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. ST. AUGUSTINE"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">School Name</label>
                    <input 
                      type="text"
                      value={formData.schoolName}
                      onChange={e => setFormData({...formData, schoolName: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">School Year</label>
                    <input 
                      type="text"
                      value={formData.schoolYear}
                      onChange={e => setFormData({...formData, schoolYear: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all">
                  Confirm & Save Section
                </button>
              </motion.form>
            )}

            <div className="space-y-10">
              {sortedGrades.map(grade => (
                <div key={grade} className="space-y-4">
                  <div className="flex items-center gap-4 px-2">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-400">Grade {grade} Sections</h3>
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

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h3 className="text-lg font-black uppercase italic text-slate-800 mb-6 flex items-center gap-3">
                <BookOpen className="text-indigo-600" /> Global Subject Templates
              </h3>
              <form onSubmit={handleAddBaseSubject} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <input 
                  placeholder="CODE (e.g. G7-MATH)" 
                  value={baseSubjectForm.code}
                  onChange={e => setBaseSubjectForm({...baseSubjectForm, code: e.target.value.toUpperCase()})}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-xs" required
                />
                <input 
                  placeholder="SUBJECT LABEL" 
                  value={baseSubjectForm.name}
                  onChange={e => setBaseSubjectForm({...baseSubjectForm, name: e.target.value.toUpperCase()})}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-xs md:col-span-2" required
                />
                <div className="flex gap-2">
                  <select 
                    value={baseSubjectForm.gradeLevel}
                    onChange={e => setBaseSubjectForm({...baseSubjectForm, gradeLevel: e.target.value})}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-xs"
                  >
                    {['7','8','9','10','11','12'].map(g => <option key={g} value={g}>G{g}</option>)}
                  </select>
                  <button type="submit" className="bg-indigo-600 text-white p-2 rounded-xl"><Plus size={20}/></button>
                </div>
              </form>
              <div className="space-y-6">
                {sortedBaseGrades.map(grade => (
                  <div key={grade} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade {grade}</h4>
                      <div className="h-px flex-1 bg-slate-100"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupedBaseSubjects[grade].map(base => (
                        <div key={base.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center group">
                    {editingBaseSubjectId === base.id ? (
                      <div className="flex-1 space-y-2 mr-4">
                        <input 
                          value={baseEditFormData.code}
                          onChange={e => setBaseEditFormData({...baseEditFormData, code: e.target.value.toUpperCase()})}
                          className="w-full bg-white border border-indigo-200 rounded-lg px-2 py-1 text-[10px] font-black outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="CODE"
                        />
                        <input 
                          value={baseEditFormData.name}
                          onChange={e => setBaseEditFormData({...baseEditFormData, name: e.target.value.toUpperCase()})}
                          className="w-full bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="NAME"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateBaseSubject(base.id)}
                            className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded hover:bg-indigo-700 transition-colors"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingBaseSubjectId(null)}
                            className="px-2 py-1 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase rounded hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black text-indigo-600 truncate">{base.code}</p>
                        <p className="font-bold text-slate-800 text-sm truncate">{base.name}</p>
                        {base.categories?.length === 0 ? (
                          <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100 mt-1 block w-fit">
                            TEMPLATE NOT SET
                          </span>
                        ) : (
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Template Configured</p>
                        )}
                      </div>
                    )}
                    
                          <div className="flex gap-1">
                      {editingBaseSubjectId !== base.id && (
                        <button 
                          onClick={() => {
                            setEditingBaseSubjectId(base.id);
                            setBaseEditFormData({ name: base.name, code: base.code, gradeLevel: base.gradeLevel });
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                          title="Edit Code/Name"
                        >
                          <History size={16} />
                        </button>
                      )}
                            <button 
                              onClick={() => navigate('/templates', { state: { subjectId: base.id } })}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                              title="Edit Template"
                            >
                              <Settings size={16} />
                            </button>
                            <button onClick={() => onDeleteBaseSubject(base.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
            <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-400">System User Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <div key={user.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="size-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                        <User size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-slate-800 uppercase italic text-xs leading-tight">{user.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user.username}</p>
                      </div>
                    </div>
                    {user.id === currentUserId && (
                      <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 uppercase shrink-0">You</span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Access Level</label>
                      <select 
                        value={user.role}
                        disabled={user.id === currentUserId}
                        onChange={(e) => onUpdateUser(user.id, { role: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="adviser">Adviser</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button 
                      disabled={user.id === currentUserId}
                      onClick={() => onDeleteUser(user.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 disabled:opacity-0 transition-all"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
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
            <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-400 flex items-center gap-2">
              <Clock size={14} /> Pending Registrations ({pendingRegistrations.length})
            </h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {pendingRegistrations.map(reg => {
                const form = approvalForms[reg.id] || { role: reg.requestedRole || 'teacher', sectionId: '', subjectIds: [] };
                return (
                  <RegistrationCard 
                    key={reg.id}
                    reg={reg}
                    form={form}
                    setApprovalForms={setApprovalForms}
                    sections={sections}
                    onRejectRegistration={onRejectRegistration}
                    handleApprove={handleApprove}
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
      className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'} ${isAlert && !active ? 'text-amber-500' : ''}`}
    >
      {icon}
      {label}
    </button>
  );
}