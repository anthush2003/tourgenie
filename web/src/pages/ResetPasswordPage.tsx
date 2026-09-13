import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Hash, ArrowLeft } from "lucide-react";
import { api } from "../services/api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateEmail = location.state?.email || "";

  const [email, setEmail] = useState(stateEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!stateEmail) {
      // Allow manual entry
    }
  }, [stateEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !otp || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password must contain letters, a number, and a special character (!@#$%^&*).");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(otp, { password });
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. OTP may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-sand-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-ink-900/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-sunset-400 to-leaf-600" />
        
        <Link to="/" className="inline-flex items-center text-sm font-semibold text-ink-800/60 hover:text-ink-900 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-leaf-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-leaf-700" />
            </div>
            <h2 className="font-serif text-3xl text-ink-900 mb-2">Password Reset!</h2>
            <p className="text-ink-800/70 mb-8">Your password has been successfully updated. You can now log in with your new password.</p>
            <p className="text-sm font-semibold text-leaf-700 animate-pulse">Redirecting to home...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl text-ink-900 mb-2">Reset Password</h2>
              <p className="text-ink-800/70 text-sm">Enter the 6-digit code sent to your email along with your new password.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs tracking-widest uppercase text-ink-800/60 font-semibold block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full px-4 py-3 rounded-2xl bg-sand-50 border border-sand-200 text-ink-900 text-sm focus:outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20 transition-all"
                />
              </div>

              <div>
                <label className="text-xs tracking-widest uppercase text-ink-800/60 font-semibold block mb-1.5">6-Digit Code</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-sand-50 border border-sand-200 text-ink-900 text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs tracking-widest uppercase text-ink-800/60 font-semibold block mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="��������"
                    className="w-full pl-11 pr-12 py-3 rounded-2xl bg-sand-50 border border-sand-200 text-ink-900 text-sm focus:outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-800/40 hover:text-ink-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs tracking-widest uppercase text-ink-800/60 font-semibold block mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="��������"
                    className="w-full pl-11 pr-12 py-3 rounded-2xl bg-sand-50 border border-sand-200 text-ink-900 text-sm focus:outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-ink-900 text-sand-50 font-semibold hover:bg-ink-800 transition-all shadow-lg shadow-ink-900/20 disabled:opacity-70 mt-4"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
