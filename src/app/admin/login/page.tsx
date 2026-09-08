"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  Mail,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Forgot password flow state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setError(null);
    setSuccessNotice("Authorizing Portfolio Demo Sandbox session...");

    try {
      const res = await fetch("/api/admin/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "fila_demo_reviewer_2026" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to initialize demo sandbox session.");
        setIsDemoLoading(false);
        setSuccessNotice(null);
        return;
      }

      setSuccessNotice("Access granted! Redirecting to Operations Console...");
      router.push(from);
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setIsDemoLoading(false);
      setSuccessNotice(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your administrator password.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || undefined,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid administrative credentials. Please try again.");
        setIsLoading(false);
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Request password reset OTP
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes("@")) {
      setResetError("Please enter a valid administrative email address.");
      return;
    }

    setIsResetLoading(true);
    setResetError(null);

    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetError(data.message || "Unable to send reset code. Please try again.");
        setIsResetLoading(false);
        return;
      }

      setResetSuccess(data.message);
      setResetStep("verify");
      setIsResetLoading(false);
    } catch {
      setResetError("Network error occurred while requesting reset code.");
      setIsResetLoading(false);
    }
  };

  // Verify OTP and set new password
  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!resetOtp.trim() || resetOtp.trim().length !== 6) {
      setResetError("Please enter the 6-digit authorization code.");
      return;
    }

    if (newPassword.length < 8) {
      setResetError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsResetLoading(true);

    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetOtp.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetError(data.message || "Failed to reset password.");
        setIsResetLoading(false);
        return;
      }

      // Transition back to login with success notice
      setEmail(resetEmail);
      setPassword(newPassword);
      setIsResetMode(false);
      setResetStep("request");
      setResetOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessNotice("Password updated successfully! You can now log in.");
      setIsResetLoading(false);
    } catch {
      setResetError("Network error occurred while updating password.");
      setIsResetLoading(false);
    }
  };

  // RENDER: Forgot Password Mode
  if (isResetMode) {
    return (
      <div className="bg-[#000000]/90 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#FED501]" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              {resetStep === "request" ? "Reset Credentials" : "Enter Verification Code"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsResetMode(false);
              setResetStep("request");
              setResetError(null);
            }}
            className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
        </div>

        {resetError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{resetError}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {resetStep === "request" ? (
          <form onSubmit={handleRequestResetOtp} className="space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider"
              >
                Administrator Email
              </label>
              <div className="relative">
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@filayoruba.com"
                  required
                  autoComplete="email"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FED501] focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-white/30 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-white/40 mt-1.5">
                We will dispatch a secure 6-digit authorization code to your registered email.
              </p>
            </div>

            <button
              type="submit"
              disabled={isResetLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FED501] to-[#EAB308] text-[#000000] font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FED501]/20 disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              {isResetLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Authorization Code...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCompleteReset} className="space-y-4">
            <div>
              <label
                htmlFor="reset-otp"
                className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider"
              >
                6-Digit Verification Code
              </label>
              <input
                id="reset-otp"
                type="text"
                maxLength={6}
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#FED501] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider"
              >
                New Password (min. 8 characters)
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FED501] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type={showNewPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FED501] focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isResetLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FED501] to-[#EAB308] text-[#000000] font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FED501]/20 disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              {isResetLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password & Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    );
  }

  // RENDER: Standard Login Form
  return (
    <div className="bg-[#000000]/90 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

            {/* Portfolio Showcase / Reviewer Sandbox Helper */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-yellow-500/5 border border-amber-500/30 text-amber-200/95 space-y-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#FED501] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="text-white font-semibold block mb-0.5">Portfolio Showcase Sandbox</strong>
            Reviewing this architecture? Test live omnichannel orders, inventory reservations, real-time analytics, and operational workflows with 1-click sandbox access.
          </div>
        </div>
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isDemoLoading || isLoading}
          className="w-full py-2.5 px-3 rounded-xl bg-[#FED501] hover:bg-[#FED501]/90 disabled:opacity-50 text-black font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-[#FED501]/20 cursor-pointer active:scale-[0.99]"
        >
          {isDemoLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Authorizing Demo Sandbox...</span>
            </>
          ) : (
            <>
              <KeyRound className="w-3.5 h-3.5" />
              <span>Instant 1-Click Demo Login</span>
            </>
          )}
        </button>
        <div className="pt-1 flex items-center justify-between text-[11px] text-white/50 border-t border-white/5">
          <span>Sandbox ID: <code className="text-amber-300/90 font-mono">demo@filayoruba.com</code></span>
          <button
            type="button"
            onClick={() => {
              setEmail("demo@filayoruba.com");
              setPassword("fila_demo_reviewer_2026");
              setError(null);
            }}
            className="text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
          >
            Auto-Fill Form
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="admin-email"
            className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider"
          >
            Email Address
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@filayoruba.com"
            autoComplete="email"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FED501] focus:border-transparent transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-white/80 uppercase tracking-wider"
            >
              Administrator Password
            </label>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setResetEmail(email);
                setResetError(null);
                setResetSuccess(null);
                setIsResetMode(true);
              }}
              className="text-[11px] text-[#FED501]/80 hover:text-[#FED501] underline underline-offset-4 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FED501] focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FED501] to-[#EAB308] text-[#000000] font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FED501]/20 disabled:opacity-50 cursor-pointer min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <>
              <span>Access Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Dev-only Hint Box (Hidden completely in production) */}
      {process.env.NODE_ENV !== "production" && (
        <div className="pt-3.5 sm:pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-white/40">
            [Dev Only] Default Super Admin: <code className="text-[#FED501] font-mono bg-white/5 px-1.5 py-0.5 rounded break-all">admin@filayoruba.com</code>
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-center items-center p-3.5 sm:p-4 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FED501]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#1A1A1A]/40 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo & Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-4">
            <Link href="/" className="inline-block transition-transform duration-200 hover:scale-105" aria-label="Fìlà Yorùbá Home">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden isolate shrink-0">
                <img
                  src="/images/fallback%20logo/fallback%20logo.jpg"
                  alt="Fìlà Yorùbá"
                  className="w-full h-full object-cover rounded-full scale-[1.7]"
                  loading="eager"
                />
              </div>
            </Link>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#FED501] font-semibold flex items-center justify-center gap-1 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 inline" /> Artisan Ops Portal
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Authentication</h1>
          <p className="text-xs text-white/60 mt-1">
            Enter your secure access credentials to manage store operations.
          </p>
        </div>

        {/* Login Card inside Suspense boundary */}
        <Suspense
          fallback={
            <div className="bg-[#000000]/90 border border-white/10 rounded-2xl p-8 flex items-center justify-center min-h-[250px]">
              <Loader2 className="w-6 h-6 text-[#FED501] animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-white/50 hover:text-[#FED501] transition-colors"
          >
            ← Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
