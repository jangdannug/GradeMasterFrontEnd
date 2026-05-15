/**
 * THEME CONFIGURATION
 * Centralized design tokens for the entire application.
 * Change these values to rebrand the app instantly.
 */
export const theme = {
  brand: {
    name: "DepEd GradeMaster",
    sub: "Learner Information System Integration",
    order: "DepEd Order 8, s. 2015",
  },
  // Tailwind class strings
  styles: {
    // Colors
    primary: "indigo-600",
    primaryLight: "indigo-50",
    primaryDark: "indigo-700",
    secondary: "slate-800",
    accent: "emerald-500",
    danger: "rose-500",
    warning: "amber-500",
    
    // Layout Defaults
    radius: "rounded-[3rem]", 
    radiusSm: "rounded-2xl",
    shadow: "shadow-[0_20px_50px_rgba(79,70,229,0.08)]",
    glass: "backdrop-blur-3xl bg-white/20 border border-white/30 shadow-2xl",
    
    // Common Components
    card: "backdrop-blur-3xl bg-white/30 rounded-[2.5rem] border border-white/50 shadow-2xl shadow-indigo-100/5 hover:shadow-indigo-200/20 transition-all duration-500 hover:-translate-y-1",
    input: "w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-inner",
    button: "px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:translate-y-0.5",
    buttonPrimary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-200/50",
    
    // Sidebar & Navigation Specifics
    sidebar: "backdrop-blur-[120px] bg-white/10 border-r border-white/20 shadow-2xl z-30",
    navItem: "flex items-center gap-3 px-6 py-4 rounded-3xl font-black uppercase tracking-widest text-[12px] transition-all hover:bg-white/50 text-slate-700 hover:text-indigo-700 group",
    navActive: "bg-indigo-600 text-white shadow-2xl shadow-indigo-200/60 hover:bg-indigo-700 hover:text-white scale-[1.02]",
    navLabel: "text-[12px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 px-8",

    // Typography
    heading: "font-black uppercase italic tracking-tighter",
    subheading: "text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]",
  },
  // Status color mapping for dynamic logic
  status: {
    active: "bg-emerald-50 text-emerald-600 border-emerald-100",
  }
};