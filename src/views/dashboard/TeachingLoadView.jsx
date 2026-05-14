import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { theme } from '../../theme';

export function TeachingLoadView({ role, subjects, currentTeacherId, allSections, onSelectSubject }) {
  const navigate = useNavigate();
  const mySubjects = subjects.filter(s => s.teacherId === currentTeacherId);

  return (
    <div className="space-y-6">
      <div className={`${theme.styles.card} p-8 flex items-center gap-6`}>
        <div className={`size-14 bg-${theme.styles.accent} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100`}>
          <BookOpen size={24} />
        </div>
        <div>
          <h2 className={`text-3xl ${theme.styles.heading} text-slate-800`}>My Teaching Load</h2>
          <p className="text-xs text-slate-500 font-medium">Subjects assigned to you for this school year.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mySubjects.map(subject => {
          const subjectSection = allSections.find(s => s.id === subject.sectionId);
          return (
            <div key={subject.id} className={`${theme.styles.card} overflow-hidden group border-b-4 border-b-transparent hover:border-b-emerald-500 hover:shadow-emerald-100/30`}>
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="size-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 font-black shadow-sm">
                  {subject.name.charAt(0)}
                </div>
                <button 
                  onClick={() => {
                    onSelectSubject(subject.id);
                    navigate('/record');
                  }}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <BookOpen size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                   <h3 className={`text-lg ${theme.styles.heading} text-slate-800 line-clamp-1`}>{subject.name}</h3>
                   <p className={`${theme.styles.subheading} mt-1`}>
                     {subjectSection ? `Grade ${subjectSection.gradeLevel} - ${subjectSection.name}` : 'No Section Assigned'}
                   </p>
                 </div>
                 <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                   <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded">Active</span>
                   <button 
                      onClick={() => {
                        onSelectSubject(subject.id);
                        navigate('/record');
                      }}
                      className="text-xs font-black uppercase italic tracking-tighter text-slate-800 group-hover:text-emerald-600 transition-colors"
                   >
                     Open Gradebook →
                   </button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}