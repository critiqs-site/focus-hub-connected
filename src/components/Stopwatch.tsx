import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

const Stopwatch = () => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

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
  };

  const addLap = () => {
    setLaps(prev => [elapsed, ...prev]);
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
        <Button onClick={() => setIsRunning(!isRunning)} size="icon" className={isRunning ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}>
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        {isRunning && (
          <Button onClick={addLap} variant="outline" size="icon"><Flag className="w-4 h-4" /></Button>
        )}
        <Button onClick={reset} variant="outline" size="icon"><RotateCcw className="w-4 h-4" /></Button>
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
