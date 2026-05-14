import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus,
  Mail,
  User,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  Send,
  Loader2,
  KeyRound,
  Timer,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import schoolService from "../services/schoolService";
import api from "../services/api";

function PasswordRule({ valid, text }) {
  return (
    <div
      className={`flex items-center gap-2 transition-colors ${
        valid ? "text-emerald-600" : "text-slate-400"
      }`}
    >
      <div
        className={`size-4 rounded-full flex items-center justify-center border ${
          valid
            ? "bg-emerald-100 border-emerald-300"
            : "bg-slate-100 border-slate-200"
        }`}
      >
        {valid ? (
          <span className="text-[8px] font-black">✓</span>
        ) : (
          <span className="text-[8px]">•</span>
        )}
      </div>

      <span className="text-[9px] font-bold">{text}</span>
    </div>
  );
}
export function RegistrationView({ onRegister, onBack, isLoading: parentLoading, error: parentError }) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    schoolId: "",
    requestedRole: "teacher", // NEW: Add requestedRole to form data, default to 'teacher'
  });
  const [step, setStep] = useState(1); // 1: Identity, 2: Professional, 3: Security, 4: OTP, 5: Success
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpMessage, setOtpMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [schools, setSchools] = useState([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await schoolService.getSchools();
        setSchools(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

  // Handle Resend Cooldown Timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);
  const passwordChecks = useMemo(() => {
    const password = formData.password;

    return {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };
  }, [formData.password]);

  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

  const passwordStrength = useMemo(() => {
    if (!formData.password) {
      return {
        label: "",
        color: "",
        width: "0%",
      };
    }

    if (passwordScore <= 2) {
      return {
        label: "Weak",
        color: "bg-rose-500",
        width: "33%",
      };
    }

    if (passwordScore <= 4) {
      return {
        label: "Medium",
        color: "bg-amber-500",
        width: "66%",
      };
    }

    return {
      label: "Strong",
      color: "bg-emerald-500",
      width: "100%",
    };
  }, [passwordScore, formData.password]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(formData.password)) {
        setError("Password is not strong enough.");
        return;
      }
      await handleRequestOTP();
    } else if (step === 4) {
      await handleVerifyOTP();
    }
  };

  const handleRequestOTP = async () => {
    setError('');
    setOtpMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/request-otp', { email: formData.email, isRegistration: true });
      const data = response.data;

      if (data.success) {
        setOtpMessage('OTP sent! Please check your email inbox.');
        setStep(4);
        setResendTimer(60); // 60 seconds cooldown for resend
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Connection error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', { email: formData.email, otpCode });
      const data = response.data;

      if (data.success) {
        // OTP verified, now proceed with actual registration
        const { confirmPassword, ...submissionData } = formData;
        await onRegister(submissionData); // Call the parent's registration handler
        setStep(5); // Transition to success step
      } else {
        setError(data.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 5) { // Submission Success
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_2px,transparent_1px)] [background-size:40px_40px] opacity-30"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ x: [0, 150, 0], y: [0, 100, 0], scale: [1, 1.3, 1] }} transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-[25%] -left-[15%] w-[75%] h-[75%] bg-indigo-600/20 rounded-full blur-[150px]" />
          <motion.div animate={{ x: [0, -120, 0], y: [0, 150, 0], scale: [1.2, 1, 1.2] }} transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] -right-[20%] w-[70%] h-[70%] bg-purple-600/20 rounded-full blur-[130px]" />
          <motion.div animate={{ x: [0, 100, 0], y: [0, -180, 0], scale: [1, 1.4, 1] }} transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-[20%] left-[10%] w-[65%] h-[65%] bg-blue-600/20 rounded-full blur-[140px]" />
          <motion.div animate={{ x: [0, -150, 0], y: [0, -80, 0], scale: [1.3, 1, 1.3] }} transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[10%] right-[10%] w-[80%] h-[80%] bg-sky-600/20 rounded-full blur-[160px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white shadow-2xl text-center space-y-6 relative z-10"
        >
          <div className="size-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
            <ShieldCheck size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">
              Registration Sent!
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Your application has been received. Please wait for an administrator
              to approve your account.
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            Return to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 40, 0], y: [0, 60, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[120px]" />
        <motion.div animate={{ x: [0, -60, 0], y: [0, 40, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] -right-[10%] w-[45%] h-[45%] bg-purple-500/15 rounded-full blur-[100px]" />
        <motion.div animate={{ x: [0, 30, 0], y: [0, -50, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-[10%] left-[10%] w-[40%] h-[40%] bg-blue-500/15 rounded-full blur-[110px]" />
        <motion.div animate={{ x: [0, -40, 0], y: [0, -30, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-sky-500/15 rounded-full blur-[130px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white shadow-2xl space-y-8 relative z-10"
      >
      <div className="flex items-center gap-4">
        <button
          onClick={step > 1 && step < 5 ? () => setStep(step - 1) : onBack}
          className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">
            New Registration
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Faculty Application
          </p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        {(error || parentError) && step < 5 && ( // Only show error if not in success step
            <motion.div
                key={error || String(parentError)}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 shadow-sm"
            >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="text-[10px] font-bold uppercase tracking-tight">{error || (parentError?.message || String(parentError))}</div>
            </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Full Name
          </label>
          <div className="relative group">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              required
              type="text"
              placeholder="e.g. MARIA SANTOS"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value.replace(/[0-9]/g, "").toUpperCase(),
                })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Desired Username
          </label>
          <div className="relative group">
            <UserPlus
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              required
              type="text"
              placeholder="e.g. msantos_teacher"
              value={formData.username}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  username: e.target.value.toLowerCase(),
                })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Email Address
          </label>
          <div className="relative group">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              required
              type="email"
              placeholder="name@school.edu"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value.toLowerCase() })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
              <button
                type="submit"
                className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
        {/* School ID Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Select School
          </label>
          <div className="relative group">
            <GraduationCap
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <select
              required
              value={formData.schoolId}
              onChange={(e) =>
                setFormData({ ...formData, schoolId: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="" disabled>
                {isLoadingSchools ? "Loading schools..." : "Choose your school"}
              </option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Requested Role Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Desired Role
          </label>
          <div className="relative group">
            <ShieldCheck
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <select
              required
              value={formData.requestedRole}
              onChange={(e) =>
                setFormData({ ...formData, requestedRole: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="adviser">Adviser</option>
            </select>
          </div>
        </div>
              <button
                type="submit"
                className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
              >
                Next Step <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Password
          </label>
          <div className="relative group">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="space-y-3 px-1">
            {/* Strength Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Password Strength
                </span>

                {formData.password && (
                  <span
                    className={`text-[9px] font-black uppercase ${
                      passwordScore <= 2
                        ? "text-rose-500"
                        : passwordScore <= 4
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                )}
              </div>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: passwordStrength.width }}
                  transition={{ duration: 0.25 }}
                  className={`h-full ${passwordStrength.color}`}
                />
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="grid grid-cols-1 gap-1 text-[9px] font-bold">
              <PasswordRule
                valid={passwordChecks.minLength}
                text="At least 8 characters"
              />

              <PasswordRule
                valid={passwordChecks.uppercase}
                text="One uppercase letter"
              />

              <PasswordRule
                valid={passwordChecks.lowercase}
                text="One lowercase letter"
              />

              <PasswordRule valid={passwordChecks.number} text="One number" />

              <PasswordRule
                valid={passwordChecks.special}
                text="One special character (@$!%*?&)"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Confirm Password
          </label>
          <div className="relative group">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          {formData.confirmPassword && (
            <div className="px-1">
              <PasswordRule 
                valid={formData.password === formData.confirmPassword} 
                text={formData.password === formData.confirmPassword ? "Passwords match" : "Passwords do not match"} 
              />
            </div>
          )}
        </div>

            <button
                type="submit"
                disabled={isLoading || parentLoading}
                className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
            >
                {(isLoading || parentLoading) ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Submit for Approval</>}
            </button>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 4 && (
            <motion.div
                key="otp-verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
            >
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enter 6-Digit Code</label>
                    <div className="relative group">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            required
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-white/50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-black text-xl tracking-[0.5em] text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-center"
                        />
                    </div>
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                            <Timer size={10} /> Expires in 10 mins
                        </span>
                        <button
                            type="button"
                            disabled={resendTimer > 0 || isLoading}
                            onClick={handleRequestOTP}
                            className="text-[9px] font-black text-indigo-600 uppercase hover:underline disabled:text-slate-300"
                        >
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                        </button>
                    </div>
                </div>
                {otpMessage && <p className="text-[9px] text-emerald-600 italic px-1">{otpMessage}</p>}
                <button
                    type="submit"
                    disabled={isLoading || parentLoading}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                >
                    {(isLoading || parentLoading) ? <Loader2 className="animate-spin" size={16} /> : <><ShieldCheck size={16} /> Verify & Proceed</>}
                </button>
            </motion.div>
        )}

      </form>
    </motion.div>
    </div>
  );
}
