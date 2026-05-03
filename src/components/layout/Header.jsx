import React from 'react';
import { theme } from '../../theme';

export function Header({ section, extraContent, userName }) {
  const initials = userName 
    ? userName.split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '??';

  return (
    <header className={`h-20 ${theme.styles.glass} border-b border-slate-200 flex items-center justify-between px-4 md:px-8 gap-4 z-10 shrink-0`}>
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <div className={`hidden sm:block px-3 py-1 bg-${theme.styles.primaryLight} text-${theme.styles.primary} rounded-full text-[10px] font-bold tracking-wide shrink-0`}>
          SY {section.schoolYear}
        </div>

        <h2 className={`text-slate-800 ${theme.styles.heading} text-xs md:text-sm lg:text-base leading-tight`}>
          {userName}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {extraContent}
        <div className={`size-8 rounded-full bg-${theme.styles.primaryLight} border-2 border-white flex items-center justify-center text-[10px] font-bold text-${theme.styles.primary} shrink-0 shadow-sm`}>
          {initials}
        </div>
      </div>
    </header>
  );
}