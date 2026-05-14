import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  UserPlus,
  Mail,
  User,
  ShieldCheck,
  ArrowLeft,
  Send,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import schoolService from "../services/schoolService";
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
export function RegistrationView({ onRegister, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    schoolId: "",
    requestedRole: "teacher", // NEW: Add requestedRole to form data, default to 'teacher'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [schools, setSchools] = useState([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);

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

  const passwordChecks = React.useMemo(() => {
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

  const passwordStrength = React.useMemo(() => {
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please verify your entry.");
      return;
    }

    // Strong password validation: 8+ chars, upper, lower, digit, special character
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      setError(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
      );
      return;
    }

    setError("");
    const { confirmPassword, ...submissionData } = formData;
    onRegister(submissionData);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl text-center space-y-6"
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
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-md bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-8"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-[10px] font-bold uppercase tracking-tight"
          >
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}

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
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* NEW: School ID Input */}
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

        {/* NEW: Requested Role Input */}
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
        </div>

        <button
          type="submit"
          className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          Submit for Approval
        </button>
      </form>
    </motion.div>
  );
}
