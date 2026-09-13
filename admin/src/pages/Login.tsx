import { motion } from "framer-motion";
import { AlertTriangle, Eye, EyeOff, RefreshCw, Shield } from "lucide-react";
import { useState } from "react";
import { Inp } from "../components/ui";
import { API } from "../utils/helpers";

export default function Login({ onLogin }: { onLogin: (t: string, u: { id: string; name: string; role: string }) => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const submit = async (e: React.FormEvent) => {
            e.preventDefault(); setErr(""); setLoading(true);
            try {
              const r = await fetch(`${API}/auth/login`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              });
              const d = await r.json();
              if (r.ok && (d.user?.role === "admin" || d.user?.role === "receptionist")) {
                localStorage.setItem("adminToken", d.token);
                localStorage.setItem("adminUser", JSON.stringify(d.user));
                onLogin(d.token, d.user);
              } else if (r.ok) {
                setErr("Access denied — admin or receptionist role required.");
              } else {
                setErr(d.message || "Login failed");
              }
            } catch { setErr("Cannot reach server. Is the backend running?"); }
            setLoading(false);
          };
    return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-br from-sunset-400 to-sunset-600 flex items-center justify-center mb-4 shadow-xl shadow-sunset-600/30">
            <Shield className="w-10 h-10 text-ink-900" />
          </div>
          <h1 className="font-serif text-4xl text-sand-50 mb-1">TourGenie Admin</h1>
          <p className="text-sand-50/50 text-sm">Platform management console</p>
        </div>
        <form onSubmit={submit} className="bg-sand-50 rounded-[28px] p-8 space-y-5 shadow-2xl">
          <Inp label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-1.5">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                pattern="^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$" title="Must be at least 8 characters long and contain letters, numbers, and special characters."
                className="w-full px-4 py-3 pr-12 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/15 text-sm transition-all" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-800/40 hover:text-ink-800 transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {err && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{err}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl bg-ink-900 text-sand-50 font-semibold hover:bg-leaf-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" />Signing in…</> : "Sign In to Admin Panel"}
          </button>
          { }
        </form>
      </motion.div>
    </div>
    );
}
