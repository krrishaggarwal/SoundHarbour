import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";

// Login/Register are rendered OUTSIDE the Layout context tree,
// so we cannot use useContext(SongContext) here.
const API = import.meta.env.VITE_API_URL || "http://localhost:1337";

const Login = () => {
  const navigate = useNavigate();

  const [inputs,  setInputs]  = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleChange = (e) =>
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const res  = await fetch(`${API}/api/v1/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(inputs),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role",  data.role);
        if (data.fullName) localStorage.setItem("fullName", data.fullName);
        navigate("/");
      } else {
        setError(data.msg || "Login failed. Check your credentials.");
      }
    } catch {
      setError("Cannot connect to the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-1)" }}>
            SoundHarbour
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "28px" }}>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: "var(--text-3)" }}>Email</label>
            <div className="relative">
              <FiMail size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-3)" }} />
              <input
                type="email" name="email" required
                value={inputs.email} onChange={handleChange}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-raised)", color: "var(--text-1)", border: "1px solid var(--border)" }}
                onFocus={(e) => e.target.style.borderColor = "rgba(245,158,11,0.5)"}
                onBlur={(e)  => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: "var(--text-3)" }}>Password</label>
            <div className="relative">
              <FiLock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-3)" }} />
              <input
                type="password" name="password" required
                value={inputs.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-raised)", color: "var(--text-1)", border: "1px solid var(--border)" }}
                onFocus={(e) => e.target.style.borderColor = "rgba(245,158,11,0.5)"}
                onBlur={(e)  => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm mt-2 transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#0a0a0f" }}>
            <FiLogIn size={15} />
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: "var(--text-3)" }}>
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold hover:underline"
            style={{ color: "var(--accent)" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;