
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, UserCircle, GraduationCap, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { RegistrationView } from './RegistrationView';
// UPDATED: Use the new authService
import authService from '../services/authService';

export function Login({ onLogin, onRegister }) {
  const navigate = useNavigate(); // The onRegister prop is no longer needed here
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => { // UPDATED: Async login flow
    // ... existing login logic ...

    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const profile = await authService.login(username, password);
      onLogin(profile);

      // Always navigate to Dashboard on login
      navigate('/');
    } catch (err) {
      setError(err); // UPDATED: Catch service error message
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: State for registration process
  const [registrationError, setRegistrationError] = useState('');
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);

  // NEW: Function to handle registration submission from RegistrationView
  const handleRegistrationSubmit = async (registrationData) => {
    setRegistrationError('');
    setIsRegisteringUser(true);
    try {
      await authService.register(registrationData);
      alert('Registration successful! Please wait for admin approval.');
      setIsRegistering(false); // Go back to login form after successful registration
    } catch (err) {
      setRegistrationError(err);
    } finally {
      setIsRegisteringUser(false);
    }
  };

  if (isRegistering) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <RegistrationView 
          onBack={() => setIsRegistering(false)} 
          onRegister={handleRegistrationSubmit} // Pass the new handler
          isLoading={isRegisteringUser} // Pass loading state to RegistrationView
          error={registrationError} // Pass error state to RegistrationView
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 backdrop-blur-sm bg-white/90 relative z-10"
      >
        <div className="text-center mb-10">
           <div className="size-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
             <GraduationCap className="text-white size-10" />
           </div>
           <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">DepEd GradeMaster</h1>
           <p className="text-slate-400 text-sm font-medium mt-1">Learner Information System Integration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
           {error && (
             <motion.div 
               initial={{ opacity: 0, x: -10 }} 
               animate={{ opacity: 1, x: 0 }}
               className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold"
             >
               <AlertCircle size={16} /> {error}
             </motion.div>
           )}

           <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Username</label>
             <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors">
                 <UserIcon size={18} />
               </div>
               <input 
                 type="text"
                 value={username}
                 onChange={(e) => setUsername(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                 placeholder="Enter username"
                 required
               />
             </div>
           </div>

           <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
             <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors">
                 <Lock size={18} />
               </div>
               <input 
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                 placeholder="••••••••"
                 required
               />
             </div>
           </div>

           <button 
             type="submit"
             disabled={isLoading}
             className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-slate-200 mt-2"
           >
             {isLoading ? (
               <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               <>
                 <LogIn size={18} />
                 Sign In
               </>
             )}
           </button>

           <div className="pt-4 text-center">
             <button 
               type="button"
               onClick={() => setIsRegistering(true)}
               className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
             >
               Don't have an account? <span className="text-blue-600">Register Faculty</span>
             </button>
           </div>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-100">
           <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-loose text-center">
             Test Accs: admin, teacher1, teacher2, teacher3<br/>
             Default Pass: password123
           </p>
        </div>
      </motion.div>
    </div>
  );
}