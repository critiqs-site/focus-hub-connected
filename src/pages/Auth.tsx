import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";
import mascotCharacter from "@/assets/mascot-character.png";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const [step, setStep] = useState<"welcome" | "auth">("welcome");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setIsLoading(false);
      return;
    }
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message.includes("Invalid login credentials") ? "Invalid email or password" : error.message);
          return;
        }
        toast.success("Welcome back! 🎉");
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } });
        if (error) {
          toast.error(error.message.includes("already registered") ? "This email is already registered. Try logging in." : error.message);
          return;
        }
        toast.success("Account created! Check your email to verify.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/30 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/3 right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-primary/25 rounded-full blur-3xl animate-bounce-slow" />
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-accent/20 rounded-full blur-2xl animate-float" />
          <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-primary rounded-full animate-pulse" />
          <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-primary/80 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="relative mb-6 animate-scale-in">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-56 h-56 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 blur-xl animate-pulse" />
            </div>
            <div className="relative mx-auto w-52 h-52 rounded-full bg-gradient-to-br from-card to-secondary border-4 border-primary/40 shadow-2xl shadow-primary/20 flex items-center justify-center overflow-hidden">
              <img src={mascotCharacter} alt="Cute mascot" className="w-44 h-44 object-contain animate-bounce-gentle" />
            </div>
            <div className="absolute -top-2 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-br-sm shadow-lg animate-bounce-gentle z-10">
              <span className="font-bold text-sm">Let's Go! ✨</span>
            </div>
          </div>
          <div className="animate-slide-up mb-2" style={{ animationDelay: "0.2s" }}>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-1">
              Welcome! <span className="inline-block animate-wave">👋</span>
            </h1>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <p className="text-xl text-muted-foreground mb-1">Are you ready</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-8">to build some habits?</p>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <Button onClick={() => setStep("auth")} className="w-full max-w-xs h-16 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold text-xl rounded-2xl shadow-xl shadow-primary/40 transition-all hover:shadow-2xl hover:shadow-primary/50 hover:scale-105 active:scale-95 group border-2 border-primary/50">
              Continue <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>
          <div className="flex justify-center gap-3 mt-8 animate-fade-in" style={{ animationDelay: "0.7s" }}>
            <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-primary/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <button onClick={() => setStep("welcome")} className="mb-4 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 animate-fade-in group">
          <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> Back
        </button>
        <div className="flex justify-center mb-4 animate-scale-in">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-card to-secondary border-4 border-primary/40 shadow-xl shadow-primary/20 flex items-center justify-center overflow-hidden">
              <img src={mascotCharacter} alt="Cute mascot" className="w-24 h-24 object-contain" />
            </div>
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-md -z-10 animate-pulse" />
          </div>
        </div>
        <div className="text-center mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-3xl font-bold text-foreground mb-1">{isLogin ? "Welcome Back!" : "Join Us!"}</h1>
          <p className="text-muted-foreground">{isLogin ? "Great to see you again ✨" : "Start your habit journey today 🚀"}</p>
        </div>
        <div className="bg-card/80 backdrop-blur-xl border-2 border-primary/30 p-8 rounded-3xl shadow-2xl shadow-primary/10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-semibold text-sm">📧 Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 bg-secondary/60 border-2 border-primary/20 focus:border-primary transition-all rounded-2xl text-base placeholder:text-muted-foreground/60" disabled={isLoading} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-semibold text-sm">🔑 Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 bg-secondary/60 border-2 border-primary/20 focus:border-primary transition-all pr-14 rounded-2xl text-base" disabled={isLoading} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-14 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 rounded-2xl group mt-2 border-2 border-primary/50" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{isLogin ? "Sign In" : "Create Account"}<ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-muted-foreground hover:text-foreground transition-colors text-sm" disabled={isLoading}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="font-bold text-primary hover:underline">{isLogin ? "Sign up" : "Sign in"}</span>
            </button>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6 animate-fade-in flex items-center justify-center gap-2" style={{ animationDelay: "0.3s" }}>
          <span className="text-lg">🔒</span> Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
};

export default Auth;
