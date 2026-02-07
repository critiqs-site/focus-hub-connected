import { useState, useEffect, useRef } from "react";
import { Download as DownloadIcon, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Download = () => {
  const [status, setStatus] = useState<"loading" | "ready" | "installed" | "unsupported">("loading");
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const prompted = useRef(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setStatus("installed");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setStatus("ready");

      // Auto-trigger on first visit
      if (!prompted.current) {
        prompted.current = true;
        setTimeout(() => triggerInstall(), 500);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If no event fires within 3s, mark unsupported
    const timeout = setTimeout(() => {
      if (!deferredPrompt.current) setStatus("unsupported");
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timeout);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") setStatus("installed");
    deferredPrompt.current = null;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 text-center space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Download CRITIQS</h1>

        {status === "loading" && (
          <p className="text-muted-foreground">Preparing download...</p>
        )}

        {status === "ready" && (
          <>
            <p className="text-muted-foreground">
              Download has started. Click the button below if not.
            </p>
            <Button onClick={triggerInstall} size="lg" className="gap-2">
              <DownloadIcon className="h-5 w-5" />
              Download CRITIQS
            </Button>
          </>
        )}

        {status === "installed" && (
          <div className="space-y-3">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="text-foreground font-medium">CRITIQS is already installed!</p>
            <p className="text-sm text-muted-foreground">Open it from your home screen or app launcher.</p>
          </div>
        )}

        {status === "unsupported" && (
          <div className="space-y-3">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <p className="text-foreground font-medium">Manual Install Required</p>
            <p className="text-sm text-muted-foreground">
              Use your browser's "Add to Home Screen" or "Install App" option from the menu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Download;
