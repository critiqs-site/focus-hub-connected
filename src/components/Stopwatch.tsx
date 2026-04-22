import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Flag, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const Stopwatch = () => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [muted, setMuted] = useState(() => localStorage.getItem("stopwatch_muted") === "true");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClick = useCallback((freq = 1000, duration = 0.06) => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.02);
    } catch {}
  }, [muted]);

  const toggleMute = () => {
    setMuted(m => {
      localStorage.setItem("stopwatch_muted", (!m).toString());
      return !m;
    });
  };

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isRunning) { clearTimer(); return; }
    startTimeRef.current = Date.now() - elapsed;
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 10);
    return clearTimer;
  }, [isRunning, clearTimer]);

  const reset = () => {
    clearTimer();
    setIsRunning(false);
    setElapsed(0);
    setLaps([]);
    playClick(600, 0.08);
  };

  const addLap = () => {
    setLaps(prev => [elapsed, ...prev]);
    playClick(1200, 0.05);
    setTimeout(() => playClick(1200, 0.05), 80);
  };

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-5">
      {/* Time display */}
      <div className="flex justify-center py-4">
        <span className="text-4xl font-bold text-foreground tabular-nums tracking-tight">
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button onClick={() => { playClick(1000, 0.05); setIsRunning(!isRunning); }} size="icon" className={isRunning ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}>
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        {isRunning && (
          <Button onClick={addLap} variant="outline" size="icon"><Flag className="w-4 h-4" /></Button>
        )}
        <Button onClick={reset} variant="outline" size="icon"><RotateCcw className="w-4 h-4" /></Button>
        <Button onClick={toggleMute} variant="outline" size="icon" title={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-hide">
          {laps.map((lap, i) => (
            <div key={i} className="flex justify-between text-xs px-3 py-1.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Lap {laps.length - i}</span>
              <span className="text-foreground font-medium tabular-nums">{formatTime(lap)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stopwatch;
