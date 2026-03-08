import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Loader2, UserRound, Mail, Github } from "lucide-react";
import { z } from "zod";
import mascotCharacter from "@/assets/mascot-character.png";
import logoFavicon from "@/assets/logo-icon.png";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const [step, setStep] = useState<"welcome" | "auth">("welcome");
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleOAuth = async (provider: "google" | "github") => {
    setFormMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setFormMessage({ type: "error", text: error.message });
    }
  };

  const handleGuestMode = () => {
    localStorage.setItem("guestMode", "true");
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormMessage(null);
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      setFormMessage({ type: "error", text: validation.error.errors[0].message });
      setIsLoading(false);
      return;
    }
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setFormMessage({
            type: "error",
            text: error.message.includes("Invalid login credentials")
              ? "Invalid email or password"
              : error.message.includes("Email not confirmed")
                ? "Please verify your email before signing in"
                : error.message,
          });
          return;
        }
        setFormMessage({ type: "success", text: "Welcome back!" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) {
          setFormMessage({
            type: "error",
            text: error.message.includes("already registered")
              ? "This email is already registered. Try logging in."
              : error.message,
          });
          return;
        }
        setFormMessage({ type: "success", text: "Account created! Check your email to verify." });
      }
    } catch {
      setFormMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="relative mb-6 animate-scale-in">
            <img src={logoFavicon} alt="CRITIQS logo" className="mx-auto w-40 h-40 object-contain drop-shadow-2xl mix-blend-lighten" />
          </div>
          <div className="animate-slide-up mb-2" style={{ animationDelay: "0.2s" }}>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-1">
              Welcome! 👋
            </h1>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <p className="text-xl text-muted-foreground mb-1">Are you ready</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-8">
              to build some habits?
            </p>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <Button
              onClick={() => setStep("auth")}
              className="w-full max-w-xs h-16 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold text-xl rounded-2xl shadow-xl shadow-primary/40 transition-all hover:shadow-2xl hover:shadow-primary/50 hover:scale-105 active:scale-95 group"
            >
              Continue <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => setStep("welcome")}
          className="mb-4 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
        >
          <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="flex justify-center mb-4 animate-scale-in">
          <img src={logoFavicon} alt="CRITIQS logo" className="w-24 h-24 object-contain drop-shadow-xl" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            {isLogin ? "Welcome Back!" : "Register!"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Great to see you again" : "One step away from being the beast!"}
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border-2 border-primary/30 p-8 rounded-3xl shadow-2xl shadow-primary/10">
          {/* Inline form message */}
          {formMessage && (
            <div
              className={`mb-4 p-3 rounded-xl text-center text-sm font-medium ${
                formMessage.type === "error"
                  ? "bg-destructive/20 text-destructive border border-destructive/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {formMessage.text}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-2xl border-2 border-border hover:border-primary/40 font-medium gap-3"
              onClick={() => handleOAuth("google")}
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-2xl border-2 border-border hover:border-primary/40 font-medium gap-3"
              onClick={() => handleOAuth("github")}
              disabled={isLoading}
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-semibold text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-secondary/60 border-2 border-primary/20 focus:border-primary transition-all rounded-xl text-sm"
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-semibold text-sm flex items-center gap-2">
                🔑 Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-secondary/60 border-2 border-primary/20 focus:border-primary transition-all pr-12 rounded-xl text-sm"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 rounded-xl group"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setFormMessage(null); }}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="font-bold text-primary hover:underline">{isLogin ? "Register" : "Sign in"}</span>
            </button>
          </div>
        </div>

        {/* Guest Mode */}
        <button
          onClick={handleGuestMode}
          className="w-full mt-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 border border-border/50 rounded-xl hover:border-primary/30 hover:bg-card/50"
        >
          <UserRound className="w-4 h-4" />
          Continue as Guest
        </button>

        <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
          🔒 Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
};

export default Auth;
