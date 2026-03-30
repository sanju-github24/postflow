import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import {
  Zap, Eye, EyeOff, Mail, Lock, ArrowRight, Loader2
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [localError, setLocalError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!email.includes("@")) return setLocalError("Enter a valid email");
    if (!password) return setLocalError("Enter your password");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (_) {}
  };

  return (
    <div className="min-h-screen flex font-body">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-[45%] bg-[#0b0e1a] flex-col justify-between p-12 relative overflow-hidden">

        {/* Geometric background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Large grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-purple-600/15 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-white text-xl font-semibold tracking-tight">PostFlow</span>
        </div>

        {/* Center quote */}
        <div className="relative z-10 space-y-6">
          <div className="text-5xl text-indigo-400 font-display leading-none">"</div>
          <p className="font-display text-white text-2xl leading-snug font-medium">
            We went from posting manually every day to scheduling a whole week in 20 minutes.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
              SK
            </div>
            <div>
              <p className="text-white text-sm font-medium">Siddharth K.</p>
              <p className="text-slate-500 text-xs">Social Media Manager</p>
            </div>
          </div>
        </div>

        {/* Platform icons row */}
        <div className="relative z-10 flex items-center gap-4">
          {[
            { label: "IG", color: "#E1306C" },
            { label: "FB", color: "#1877F2" },
            { label: "X", color: "#1D9BF0" },
          ].map((p) => (
            <div key={p.label}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: p.color + "33", border: `1px solid ${p.color}44` }}>
              {p.label}
            </div>
          ))}
          <span className="text-slate-500 text-xs ml-1">Connected & scheduling</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md animate-fade-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold">PostFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          {/* Card */}
          <div className="bg-white border border-border rounded-2xl shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-xs text-indigo-600 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {(localError || error) && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  {localError || error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                  : <>Sign in <ArrowRight className="w-4 h-4" /></>
                }
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-xs text-muted-foreground">or continue with</span>
              </div>
            </div>

            {/* OAuth buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Facebook", color: "#1877F2", short: "FB" },
                { label: "Instagram", color: "#E1306C", short: "IG" },
                { label: "Twitter", color: "#1D9BF0", short: "X" },
              ].map((p) => (
                <button key={p.label}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setLocalError("OAuth login — connect after signup")}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: p.color }}>
                    {p.short}
                  </div>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium underline-offset-4 hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
