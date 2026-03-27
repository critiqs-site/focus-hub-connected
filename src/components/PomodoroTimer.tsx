import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type Mode = "work" | "break" | "longBreak";

const PomodoroTimer = () => {
  const [workMins, setWorkMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [longBreakMins, setLongBreakMins] = useState(15);
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = mode === "work" ? workMins * 60 : mode === "break" ? breakMins * 60 : longBreakMins * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isRunning) { clearTimer(); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          if (mode === "work") {
            const newSessions = sessions + 1;
            setSessions(newSessions);
            if (newSessions % 4 === 0) {
              setMode("longBreak");
              return longBreakMins * 60;
            }
            setMode("break");
            return breakMins * 60;
          } else {
            setMode("work");
            return workMins * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [isRunning, mode, workMins, breakMins, longBreakMins, sessions, clearTimer]);

  const reset = () => {
    clearTimer();
    setIsRunning(false);
    setMode("work");
    setTimeLeft(workMins * 60);
    setSessions(0);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const circumference = 2 * Math.PI * 54;
  const strokeDash = circumference - (progress / 100) * circumference;

  const modeColors: Record<Mode, string> = {
    work: "hsl(var(--primary))",
    break: "hsl(142, 71%, 45%)",
    longBreak: "hsl(217, 91%, 60%)",
  };

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="flex gap-2 justify-center">
        {(["work", "break", "longBreak"] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setTimeLeft(m === "work" ? workMins * 60 : m === "break" ? breakMins * 60 : longBreakMins * 60); setIsRunning(false); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === m ? "bg-primary/20 text-primary border border-primary/40" : "text-muted-foreground hover:text-foreground"}`}
          >
            {m === "work" ? "Focus" : m === "break" ? "Break" : "Long Break"}
          </button>
        ))}
      </div>

      {/* Circular timer */}
      <div className="flex justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="hsla(0, 0%, 100%, 0.06)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={modeColors[mode]}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground tabular-nums">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{mode === "longBreak" ? "Long Break" : mode}</span>
          </div>
        </div>
      </div>

      {/* Session count */}
      <p className="text-center text-xs text-muted-foreground">
        Sessions: {sessions} · {mode === "work" ? "Focus time" : "Rest time"}
      </p>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button onClick={() => setIsRunning(!isRunning)} size="icon" className={isRunning ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}>
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        <Button onClick={reset} variant="outline" size="icon"><RotateCcw className="w-4 h-4" /></Button>
        <Button onClick={() => setShowSettings(!showSettings)} variant="outline" size="icon"><Settings className="w-4 h-4" /></Button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-white/5">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Focus</span><span>{workMins} min</span></div>
            <Slider value={[workMins]} onValueChange={([v]) => { setWorkMins(v); if (mode === "work" && !isRunning) setTimeLeft(v * 60); }} min={5} max={60} step={5} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Break</span><span>{breakMins} min</span></div>
            <Slider value={[breakMins]} onValueChange={([v]) => { setBreakMins(v); if (mode === "break" && !isRunning) setTimeLeft(v * 60); }} min={1} max={15} step={1} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Long Break</span><span>{longBreakMins} min</span></div>
            <Slider value={[longBreakMins]} onValueChange={([v]) => { setLongBreakMins(v); if (mode === "longBreak" && !isRunning) setTimeLeft(v * 60); }} min={5} max={30} step={5} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
