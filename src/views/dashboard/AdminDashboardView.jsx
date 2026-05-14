import React from 'react';
import { Users, ClipboardCheck, BookOpen, Shield } from 'lucide-react';
import { theme } from '../../theme';

export function AdminDashboardView({ users, allSections, subjects }) {
  const teachers = users.filter(u => u.role === 'teacher' || u.role === 'adviser');

  const groupedSectionsByGrade = React.useMemo(() => {
    return allSections.reduce((acc, s) => {
      if (!acc[s.gradeLevel]) acc[s.gradeLevel] = [];
      acc[s.gradeLevel].push(s);
      return acc;
    }, {});
  }, [allSections]);

  const sortedGradeLevels = React.useMemo(() => 
    Object.keys(groupedSectionsByGrade).sort((a, b) => parseInt(a) - parseInt(b)), 
    [groupedSectionsByGrade]
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="Total Teachers" value={teachers.length.toString()} icon={<Users className={`text-${theme.styles.primary}`} />} />
        <StatCard label="Total Sections" value={allSections.length.toString()} icon={<ClipboardCheck className="text-orange-500" />} />
        <StatCard label="Total Subjects" value={subjects.length.toString()} icon={<BookOpen className={`text-${theme.styles.accent}`} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className={theme.styles.card + " p-8"}>
          <h3 className={`text-lg ${theme.styles.heading} text-slate-800 mb-6 flex items-center gap-3`}>
            <div className={`size-2 bg-${theme.styles.primary} rounded-full`}></div>
            Teacher Overview
          </h3>
          <div className="space-y-4">
            {teachers.map(teacher => {
              const teacherSubjects = subjects.filter(s => s.teacherId === teacher.id);
              const assignedSection = allSections.find(s => s.adviserId === teacher.id);
              
              return (
                <div key={teacher.id} className={`p-4 ${theme.styles.radiusSm} bg-white/50 border border-white/60 space-y-3 hover:bg-white/70 transition-all`}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 uppercase text-sm">{teacher.name}</p>
                    <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-1 bg-white rounded-full border border-slate-200 text-slate-400">
                      {teacher.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {assignedSection && (
                       <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                         <Shield size={10} /> Adviser: {assignedSection.name} (G{assignedSection.gradeLevel})
                       </div>
                     )}
                     {teacherSubjects.map(sub => (
                       <div key={sub.id} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                         {sub.name}
                       </div>
                     ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={theme.styles.card + " p-8"}>
          <h3 className={`text-lg ${theme.styles.heading} text-slate-800 mb-6 flex items-center gap-3`}>
            <div className="size-2 bg-orange-600 rounded-full"></div>
            Section & Subject Matrix
          </h3>
          <div className="space-y-8">
            {sortedGradeLevels.map(grade => (
              <div key={grade} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest px-2 py-1 bg-orange-50 rounded-md">Grade {grade}</span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <div className="space-y-6 px-1">
                  {groupedSectionsByGrade[grade].map(s => (
                    <div key={s.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-black text-slate-800 uppercase italic text-xs">Section {s.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {s.adviserId ? teachers.find(t => t.id === s.adviserId)?.name : 'No Adviser'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {subjects.filter(sub => sub.sectionId === s.id).map(sub => (
                          <div key={sub.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 uppercase flex items-center justify-between">
                            <span className="truncate mr-1">{sub.name}</span>
                            <span className="text-[8px] text-slate-400 italic whitespace-nowrap">{sub.teacherName.split(' ').pop()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className={`${theme.styles.card} p-8 flex items-center justify-between group border-b-4 border-b-transparent hover:border-b-indigo-500`}>
      <div className="overflow-hidden">
        <p className={theme.styles.subheading + " mb-2 truncate"}>{label}</p>
        <h4 className="text-4xl font-black text-slate-800 tracking-tight truncate uppercase italic">{value}</h4>
      </div>
      <div className={`size-16 rounded-2xl bg-slate-50 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:bg-white border border-transparent group-hover:border-slate-100 shrink-0`}>
        {icon}
      </div>
    </div>
  );
}