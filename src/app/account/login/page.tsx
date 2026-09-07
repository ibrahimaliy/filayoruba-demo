"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  KeyRound,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { notifyAuthChange } from "@/lib/auth-events";

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/account";

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Step 1: Request OTP code
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to send verification code. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || "Verification code sent to your email.");
      setStep("otp");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter the 6-digit code sent to your email.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: otp.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid or expired sign-in code.");
        setIsLoading(false);
        return;
      }

      notifyAuthChange();
      router.push(from);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50">
      {/* Brand Header */}
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
        <h1 className="text-2xl font-bold text-[#000000]">
          {step === "email" ? "Customer Sign In" : "Enter Verification Code"}
        </h1>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          {step === "email"
            ? "Sign in with your email to view past orders, track live artisan progress, and save your measurements."
            : `We sent a 6-digit verification code to ${email}`}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && step === "otp" && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {step === "email" ? (
        /* Email Form */
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label
              htmlFor="customer-email"
              className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ade@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-[#000000] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent transition-all"
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-[#000000]/10 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Continue with Email</span>
                <ArrowRight className="w-4 h-4 text-[#FED501]" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* OTP Form */
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label
              htmlFor="otp-code"
              className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
            >
              Verification Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="otp-code"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-center font-mono text-xl font-bold tracking-[0.3em] text-[#000000] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent transition-all"
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full py-3.5 px-4 rounded-xl bg-[#FED501] hover:bg-[#EAB308] text-[#000000] font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#FED501]/20 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify & Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
              className="hover:text-[#000000] transition-colors cursor-pointer"
            >
              ← Change email
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isLoading}
              className="flex items-center gap-1 hover:text-[#000000] transition-colors cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Resend code
            </button>
          </div>
        </form>
      )}

      {/* Footer Assurance */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Passwordless authentication powered by Fìlà Yorùbá Secure Auth</span>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-[#FAF9F6]">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl border p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#000000] mx-auto" />
            <p className="text-xs text-slate-500 mt-4">Loading authentication...</p>
          </div>
        }
      >
        <CustomerLoginForm />
      </Suspense>
    </main>
  );
}
