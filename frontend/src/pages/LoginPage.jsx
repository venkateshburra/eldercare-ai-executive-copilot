// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiLock, FiMail, FiEye, FiEyeOff, FiCompass, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter work email and password");
      return;
    }

    setLoading(true);
    const success = await login(email.trim(), password);
    setLoading(false);

    if (success) {
      navigate("/");
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("Password@123");
  };

  const demoAccounts = [
    { role: "Executive", email: "executive@silvercare.org", desc: "Full Governance & Approvals" },
    { role: "Business Analyst", email: "analyst@silvercare.org", desc: "Scenarios & Reporting" },
    { role: "Data Steward", email: "steward@silvercare.org", desc: "RAG Knowledge & Audit" },
    { role: "Department Head", email: "depthead@silvercare.org", desc: "Staff & Clinical Leads" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      {/* Main card */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <FiCompass className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SilverCare Senior Living</h1>
          <p className="text-xs text-slate-500 mt-1">
            Executive Knowledge & Scenario Planning Copilot
          </p>
        </div>

        {/* Login Form Container */}
        <div className="card-panel p-6 sm:p-8 bg-white">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Sign In</h2>
          <p className="text-xs text-slate-500 mb-6">
            Enter your authorized credentials to access the workspace.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@silvercare.org"
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-blue-700 hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-600 w-3.5 h-3.5"
                />
                <span className="text-xs text-slate-600 select-none">Remember this browser</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? "Authenticating..." : "Sign In to Workspace"}
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 mb-3 text-slate-500">
              <FiShield className="w-3.5 h-3.5 text-blue-700" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                1-Click Demo Accounts
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleQuickLogin(demo.email)}
                  className="text-left p-2.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer group"
                >
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                    {demo.role}
                  </p>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {demo.desc}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Default password: <span className="font-mono text-slate-600">Password@123</span>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          HIPAA & GDPR Compliant • Strict Multi-Tenant Isolation Enforced
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
