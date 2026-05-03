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
    radius: "rounded-3xl", // More modern, softer look
    radiusSm: "rounded-xl",
    shadow: "shadow-xl shadow-slate-200/50",
    glass: "backdrop-blur-md bg-white/90",
    
    // Common Components
    card: "bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300",
    input: "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all",
    button: "px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center justify-center gap-2",
    buttonPrimary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100",
    
    // Typography
    heading: "font-black uppercase italic tracking-tighter",
    subheading: "text-[10px] font-bold text-slate-400 uppercase tracking-widest",
  },
  // Status color mapping for dynamic logic
  status: {
    active: "bg-emerald-50 text-emerald-600 border-emerald-100",
  }
};