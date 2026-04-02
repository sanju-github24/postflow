import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Zap, ArrowRight, ArrowLeft, Check, Eye, EyeOff,
  User, Mail, Lock, Loader2
} from "lucide-react";

const PLATFORMS = [
  { id: "facebook",  label: "Facebook",    logo: "/facebook-logo.png" },
  { id: "instagram", label: "Instagram",   logo: "/instagram-logo.png" },
  { id: "twitter",   label: "Twitter / X", logo: "/twitter-logo.png" },
  { id: "linkedin",  label: "LinkedIn",    logo: "/linkedin-logo.png" },
];

const BG_DOTS = Array.from({ length: 18 }, (_, i) => i);

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, loading, error } = useAuth();

  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<string[]>([]);
  const [localError, setLocalError] = React.useState("");

  const next = () => {
    setLocalError("");
    if (step === 1) {
      if (!name.trim()) return setLocalError("Enter your name");
      if (!email.includes("@")) return setLocalError("Enter a valid email");
    }
    if (step === 2) {
      if (password.length < 6) return setLocalError("Password must be 6+ characters");
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const back = () => { setLocalError(""); setStep((s) => Math.max(s - 1, 1)); };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    try {
      await signup(name, email, password);
      navigate("/dashboard");
    } catch (_) {}
  };

  const steps = ["Your info", "Password", "Platforms"];

  return (
    <div className="min-h-screen flex font-body">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-[45%] bg-[#0b0e1a] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {BG_DOTS.map((i) => (
            <div key={i} className="absolute rounded-full opacity-20 animate-float"
              style={{
                width: `${6 + (i % 4) * 6}px`,
                height: `${6 + (i % 4) * 6}px`,
                background: i % 3 === 0 ? "#6366f1" : i % 3 === 1 ? "#a855f7" : "#3b82f6",
                left: `${(i * 137) % 100}%`,
                top: `${(i * 97) % 100}%`,
                animationDelay: `${(i * 0.4) % 3}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-white text-xl font-semibold tracking-tight">PostFlow</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-5xl font-bold text-white leading-tight">
            One post.<br />
            <span className="text-gradient">Every platform.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Write once, let AI transform your content for Instagram, Twitter, Facebook and LinkedIn automatically.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            {[
              "AI adapts tone per platform",
              "Schedule across all accounts",
              "Secure OAuth — no passwords stored",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-indigo-400" />
                </div>
                <span className="text-slate-300 text-sm">{f}</span>
              </div>
            ))}
          </div>

          {/* ✅ Platform logos row */}
          <div className="flex items-center gap-3 pt-2">
            {PLATFORMS.map((p) => (
              <div key={p.id}
                className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                <img src={p.logo} alt={p.label} style={{ width: 20, height: 20 }} className="object-contain" />
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs relative z-10">© 2026 PostFlow AI</p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md animate-fade-up">

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold">PostFlow</span>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {steps.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                      step > i + 1 ? "bg-indigo-500 text-white" :
                      step === i + 1 ? "bg-indigo-500 text-white ring-4 ring-indigo-500/20" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {step > i + 1 ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span className={cn(
                      "text-xs font-medium hidden sm:block",
                      step === i + 1 ? "text-foreground" : "text-muted-foreground"
                    )}>{s}</span>
                  </div>
                  {i < 2 && (
                    <div className={cn(
                      "flex-1 h-px transition-all duration-500",
                      step > i + 1 ? "bg-indigo-500" : "bg-border"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl shadow-sm p-8">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-up">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">Create account</h2>
                  <p className="text-muted-foreground text-sm mt-1">Start scheduling smarter</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="name" placeholder="Alex Johnson" value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9" onKeyDown={(e) => e.key === "Enter" && next()} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="alex@example.com" value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9" onKeyDown={(e) => e.key === "Enter" && next()} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-up">
                <div>
                  <h2 className="font-display text-2xl font-semibold">Secure your account</h2>
                  <p className="text-muted-foreground text-sm mt-1">Choose a strong password</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type={showPw ? "text" : "password"}
                      placeholder="Min. 6 characters" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10" onKeyDown={(e) => e.key === "Enter" && next()} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div key={lvl} className={cn(
                        "flex-1 h-1 rounded-full transition-all duration-300",
                        password.length >= lvl * 2
                          ? lvl <= 2 ? "bg-amber-400" : lvl === 3 ? "bg-indigo-400" : "bg-emerald-400"
                          : "bg-border"
                      )} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {password.length === 0 ? "Enter a password" :
                      password.length < 4 ? "Too short" :
                      password.length < 6 ? "Getting there" :
                      password.length < 8 ? "Good" : "Strong!"}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-up">
                <div>
                  <h2 className="font-display text-2xl font-semibold">Pick your platforms</h2>
                  <p className="text-muted-foreground text-sm mt-1">Connect accounts after signup in your dashboard</p>
                </div>
                <div className="space-y-2">
                  {PLATFORMS.map((p) => (
                    <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200",
                        selectedPlatforms.includes(p.id)
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-border bg-background hover:border-indigo-300 hover:bg-indigo-50/50"
                      )}>
                      {/* ✅ PNG logo */}
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                        <img src={p.logo} alt={p.label} style={{ width: 18, height: 18 }} className="object-contain" />
                      </div>
                      <span className="text-sm font-medium flex-1">{p.label}</span>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedPlatforms.includes(p.id) ? "border-indigo-500 bg-indigo-500" : "border-border"
                      )}>
                        {selectedPlatforms.includes(p.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">You can always add or remove platforms later.</p>
              </div>
            )}

            {(localError || error) && (
              <p className="mt-4 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {localError || error}
              </p>
            )}

            <div className={cn("mt-6 flex gap-3", step > 1 ? "justify-between" : "justify-end")}>
              {step > 1 && (
                <Button variant="outline" onClick={back} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={next} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                    : <>Create account <Check className="w-4 h-4" /></>}
                </Button>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}