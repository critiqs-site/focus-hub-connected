import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Loader2, UserRound, Mail, Github } from "lucide-react";
import { z } from "zod";
import logoIcon from "@/assets/logo-icon.png";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[10%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" 
          style={{ background: 'radial-gradient(circle, hsla(24, 95%, 53%, 0.4), transparent 70%)' }} />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsla(240, 70%, 50%, 0.3), transparent 70%)' }} />
        <div className="absolute top-[40%] left-[5%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsla(280, 70%, 50%, 0.25), transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6 animate-scale-in">
          <img src={logoIcon} alt="CRITIQS logo" className="w-24 h-24 object-contain drop-shadow-2xl" style={{ mixBlendMode: 'screen' }} />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome Back!" : "Register!"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isLogin ? "Great to see you again" : "One step away from being the beast!"}
          </p>
        </div>

        {/* Premium glassmorphism card */}
        <div className="p-8 rounded-3xl animate-slide-up relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsla(240, 10%, 12%, 0.4), hsla(240, 8%, 8%, 0.6))',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid hsla(0, 0%, 100%, 0.18)',
            boxShadow: 'inset 0 1px 2px hsla(0, 0%, 100%, 0.15), 0 20px 60px -10px hsla(0, 0%, 0%, 0.5), 0 0 0 1px hsla(240, 8%, 15%, 0.2)'
          }}>
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
              className="w-full h-14 rounded-2xl font-medium gap-3 transition-all"
              style={{
                background: 'hsla(240, 10%, 10%, 0.3)',
                border: '1px solid hsla(0, 0%, 100%, 0.12)',
                backdropFilter: 'blur(10px)'
              }}
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
              className="w-full h-14 rounded-2xl font-medium gap-3 transition-all"
              style={{
                background: 'hsla(240, 10%, 10%, 0.3)',
                border: '1px solid hsla(0, 0%, 100%, 0.12)',
                backdropFilter: 'blur(10px)'
              }}
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
                className="h-14 rounded-2xl text-base transition-all"
                style={{
                  background: 'hsla(240, 10%, 10%, 0.5)',
                  border: '1px solid hsla(0, 0%, 100%, 0.15)',
                  backdropFilter: 'blur(10px)'
                }}
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
                  className="h-14 pr-12 rounded-2xl text-base transition-all"
                  style={{
                    background: 'hsla(240, 10%, 10%, 0.5)',
                    border: '1px solid hsla(0, 0%, 100%, 0.15)',
                    backdropFilter: 'blur(10px)'
                  }}
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
              className="w-full h-14 font-bold text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-95 rounded-2xl group"
              style={{
                background: 'linear-gradient(135deg, hsl(24, 95%, 53%), hsl(24, 95%, 48%))',
                boxShadow: '0 0 40px hsla(24, 95%, 53%, 0.4), inset 0 1px 2px hsla(0, 0%, 100%, 0.2)'
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
          className="w-full mt-6 py-4 text-sm text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2 rounded-2xl"
          style={{
            background: 'hsla(240, 10%, 10%, 0.3)',
            border: '1px solid hsla(0, 0%, 100%, 0.1)',
            backdropFilter: 'blur(20px)'
          }}
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
