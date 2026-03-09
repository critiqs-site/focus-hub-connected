import { useState, useEffect, useRef, useMemo } from "react";
import { Download as DownloadIcon, CheckCircle, Monitor, Smartphone, Bell, BellOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { requestNotificationPermission } from "@/lib/notifications";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type BrowserType = "chrome" | "edge" | "safari" | "firefox" | "other";

const detectBrowser = (): BrowserType => {
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return "edge";
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return "chrome";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "safari";
  if (/Firefox/i.test(ua)) return "firefox";
  return "other";
};

const browserInstructions: Record<BrowserType, { title: string; steps: string[] }> = {
  chrome: {
    title: "Install via Chrome",
    steps: [
      "Look for the install icon (⊕) in the address bar at the top right",
      "Click it and select \"Install\"",
      "The app will open as a standalone window",
    ],
  },
  edge: {
    title: "Install via Edge",
    steps: [
      "Click the three-dot menu (⋯) in the top right",
      "Select \"Apps\" → \"Install this site as an app\"",
      "Click \"Install\" to confirm",
    ],
  },
  safari: {
    title: "Install via Safari",
    steps: [
      "On macOS: Go to File → Add to Dock",
      "On iOS: Tap the Share button (↑) → \"Add to Home Screen\"",
      "The app will appear on your home screen or dock",
    ],
  },
  firefox: {
    title: "Firefox doesn't support PWA install",
    steps: [
      "Firefox does not support installing web apps directly",
      "Please open this page in Chrome or Edge to install",
      "Or on iOS, use Safari and tap Share → Add to Home Screen",
    ],
  },
  other: {
    title: "Install this app",
    steps: [
      "Look for an \"Install\" or \"Add to Home Screen\" option in your browser menu",
      "If unavailable, try opening this page in Chrome or Edge",
    ],
  },
};

const Download = () => {
  const [status, setStatus] = useState<"loading" | "ready" | "installed" | "unsupported">("loading");
  const [notifStatus, setNotifStatus] = useState<"default" | "granted" | "denied">("default");
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const prompted = useRef(false);
  const browser = useMemo(() => detectBrowser(), []);

  useEffect(() => {
    // Check notification permission
    if ("Notification" in window) {
      setNotifStatus(Notification.permission);
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setStatus("installed");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setStatus("ready");

      if (!prompted.current) {
        prompted.current = true;
        setTimeout(() => triggerInstall(), 500);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

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

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? "granted" : "denied");
  };

  const info = browserInstructions[browser];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 text-center space-y-6 animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to CRITIQS
        </Link>

        <h1 className="text-2xl font-bold text-foreground">Download CRITIQS</h1>
        <p className="text-sm text-muted-foreground">
          Install the app for the best experience with offline support and push notifications.
        </p>

        {status === "loading" && (
          <div className="py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-3">Preparing download...</p>
          </div>
        )}

        {status === "ready" && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Download has started. Click the button below if not.
            </p>
            <Button onClick={triggerInstall} size="lg" className="gap-2 w-full">
              <DownloadIcon className="h-5 w-5" />
              Download CRITIQS
            </Button>
          </div>
        )}

        {status === "installed" && (
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 text-primary mx-auto" />
            <p className="text-foreground font-medium">CRITIQS is already installed!</p>
            <p className="text-sm text-muted-foreground">Open it from your home screen or app launcher.</p>
          </div>
        )}

        {status === "unsupported" && (
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2 justify-center">
              <Monitor className="h-5 w-5 text-primary" />
              <Smartphone className="h-5 w-5 text-primary" />
              <p className="text-foreground font-medium">{info.title}</p>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              {info.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            {(browser === "firefox" || browser === "other") && (
              <p className="text-xs text-muted-foreground/70 text-center pt-2">
                Tip: Chrome and Edge offer the best PWA install experience.
              </p>
            )}
          </div>
        )}

        {/* Notification Section */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Push Notifications
          </h3>
          {notifStatus === "granted" ? (
            <div className="flex items-center justify-center gap-2 text-sm text-primary">
              <CheckCircle className="h-4 w-4" />
              Notifications enabled
            </div>
          ) : notifStatus === "denied" ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <BellOff className="h-4 w-4" />
              Notifications blocked. Enable in browser settings.
            </div>
          ) : (
            <Button onClick={handleEnableNotifications} variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" />
              Enable Notifications
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Get reminders 5 minutes before your scheduled events.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Download;