import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import mascot from "@/assets/mascot-character.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      {/* Orange gradient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/15 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[200px] h-[200px] rounded-full bg-primary/10 blur-[80px] pointer-events-none" />

      <div className="relative z-10 text-center px-6 animate-fade-in">
        {/* Mascot */}
        <div className="flex justify-center mb-6">
          <img
            src={mascot}
            alt="CRITIQS mascot looking confused"
            className="w-28 h-28 animate-bounce-gentle opacity-90"
          />
        </div>

        {/* 404 number */}
        <h1 className="text-8xl md:text-9xl font-bold text-primary/80 tracking-tighter leading-none mb-2">
          404
        </h1>

        {/* Message */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-primary" />
          <p className="text-lg font-medium text-foreground">Page not found</p>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Looks like this page doesn't exist. Maybe it was moved, or you typed the wrong URL.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate("/")} className="gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        {/* Route info */}
        <p className="mt-8 text-xs text-muted-foreground/60 font-mono">
          {location.pathname}
        </p>
      </div>
    </div>
  );
};

export default NotFound;
