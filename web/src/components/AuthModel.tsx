import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Leaf, Eye, EyeOff } from "lucide-react";
import { useAppDispatch } from "../store";
import { loginSuccess } from "../store/slices/authSlice";
import { api } from '../services/api';
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  initialMode: "login" | "register";
  onClose: () => void;
  onSwitch?: () => void;
}

export default function AuthModal({ open, initialMode, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setErrors("");
      setMessage("");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
    }
  }, [open, initialMode]);

  const handleAuthSuccess = (data: any) => {
    localStorage.setItem('token', data.token);

    dispatch(
      loginSuccess({
        id: (data.user.id || data.user._id) as string,
        name: data.user.name as string,
        email: data.user.email as string,
        role: data.user.role as any,
        preferences: data.user.preferences as any || {
          interests: [],
          transportMode: 'driving',
          budget: 'medium',
        },
        savedPlaces: data.user.savedPlaces as any || { home: null, work: null },
        savedTours: data.user.savedTours || [],
        savedHotels: data.user.savedHotels || [],
        activityLog: data.user.activityLog as any || [],
      })
    );
    onClose();
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setErrors("");
      const data = await api.googleAuth({ token: credentialResponse.credential });
      handleAuthSuccess(data);
    } catch (err: any) {
      setErrors(err.message || 'Google Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors('');
    setMessage('');

    if (mode === 'forgot') {
      if (!form.email) {
        setErrors('Please enter your email');
        return;
      }
      setLoading(true);
      try {
        await api.forgotPassword({ email: form.email });
        onClose();
        navigate('/reset-password', { state: { email: form.email } });
      } catch (err: any) {
        setErrors(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      if (!form.name || !form.email || !form.password) {
        setErrors('Please fill in all fields');
        return;
      }
      if (form.password.length < 8) {
        setErrors('Password must be at least 8 characters');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setErrors('Passwords do not match');
        return;
      }
    } else {
      if (!form.email || !form.password) {
        setErrors('Please enter email and password');
        return;
      }
    }

    setLoading(true);
    try {
      const data = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.register({ name: form.name, email: form.email, password: form.password });
      
      handleAuthSuccess(data);
    } catch (err: any) {
      setErrors(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md bg-sand-50 rounded-4xl shadow-2xl shadow-ink-900/40 overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            { }
            <div className="relative h-32 bg-linear-to-br from-leaf-700 via-leaf-600 to-sunset-500 overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "url(/images/tea-hills.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
              />
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-ink-900/40" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-sand-50/20 backdrop-blur-md text-sand-50 flex items-center justify-center hover:bg-sand-50/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-5 left-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sand-50/20 backdrop-blur-md flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-sand-50" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-sand-50 leading-none">
                    {mode === "login" ? "Welcome Back" : mode === "register" ? "Join TourGenie" : "Reset Password"}
                  </h3>
                  <p className="text-xs text-sand-50/80 mt-1">
                    {mode === "login" ? "Your AI travel companion awaits" : mode === "register" ? "Begin discovering Sri Lanka" : "We'll send you a recovery link"}
                  </p>
                </div>
              </div>
            </div>

            { }
            <div className="px-6 pt-4 shrink-0">
              <div className="flex gap-2 p-1 bg-sand-100 rounded-full">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setErrors(""); setMessage(""); }}
                    className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${mode === m
                        ? "bg-ink-900 text-sand-50 shadow-md shadow-ink-900/20"
                        : "text-ink-800 hover:text-ink-900"
                      }`}
                  >
                    {m === "login" ? "Login" : "Sign Up"}
                  </button>
                ))}
              </div>
            </div>

            { }
            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              {mode === "register" && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-800/40" />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20 transition-all text-ink-900 placeholder:text-ink-800/40"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-800/40" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20 transition-all text-ink-900 placeholder:text-ink-800/40"
                />
              </div>
              
              {mode !== "forgot" && (
                <>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-800/40" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20 transition-all text-ink-900 placeholder:text-ink-800/40"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-800/40 hover:text-ink-800 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {mode === "register" && (
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-800/40" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirm password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20 transition-all text-ink-900 placeholder:text-ink-800/40"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-800/40 hover:text-ink-800 transition-colors">
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  )}
                  {mode === "login" && (
                    <div className="flex justify-end">
                      <button 
                        type="button" 
                        onClick={() => { setMode("forgot"); setErrors(""); setMessage(""); }}
                        className="text-xs text-leaf-700 font-semibold hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </>
              )}

              {errors && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  {errors}
                </div>
              )}

              {message && (
                <div className="text-sm text-leaf-700 bg-leaf-50 border border-leaf-200 rounded-xl px-4 py-2.5">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-linear-to-r from-leaf-700 to-leaf-600 hover:from-leaf-600 hover:to-leaf-700 text-sand-50 font-semibold transition-all shadow-lg shadow-leaf-700/30 disabled:opacity-60"
              >
                {loading ? 'Please wait...' : mode === 'login' ? 'Continue to TourGenie' : mode === 'register' ? 'Create my Account' : 'Send Recovery Link'}
              </button>
              
              {mode !== "forgot" && (
                <div className="pt-2 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 h-px bg-sand-200"></div>
                    <span className="text-xs text-ink-800/40 uppercase font-semibold">Or</span>
                    <div className="flex-1 h-px bg-sand-200"></div>
                  </div>
                  
                  <div className="w-full flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => {
                        setErrors('Google Authentication Failed');
                      }}
                      theme="outline"
                      size="large"
                      text={mode === "login" ? "signin_with" : "signup_with"}
                      width="350px"
                    />
                  </div>
                </div>
              )}

              <div className="text-xs text-ink-800/60 text-center leading-relaxed mt-2">
                By continuing, you agree to our Terms and Privacy Policy.
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



