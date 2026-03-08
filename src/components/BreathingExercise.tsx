import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Phase = "inhale" | "hold" | "exhale" | "holdOut" | "idle";
type SessionState = "ready" | "active" | "paused" | "complete";

const PHASES: { phase: Phase; label: string; duration: number }[] = [
  { phase: "inhale", label: "Breathe In", duration: 4 },
  { phase: "hold", label: "Hold", duration: 4 },
  { phase: "exhale", label: "Breathe Out", duration: 4 },
  { phase: "holdOut", label: "Hold", duration: 4 },
];

const TOTAL_ROUNDS = 4;

const BreathingExercise = () => {
  const [sessionState, setSessionState] = useState<SessionState>("ready");
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [countdown, setCountdown] = useState(PHASES[0].duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhase = PHASES[currentPhaseIndex];

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const play = () => {
    setSessionState("active");
  };

  const pause = () => {
    setSessionState("paused");
    clearTimer();
  };

  const reset = () => {
    clearTimer();
    setSessionState("ready");
    setCurrentPhaseIndex(0);
    setCurrentRound(1);
    setCountdown(PHASES[0].duration);
  };

  useEffect(() => {
    if (sessionState !== "active") return;

    clearTimer();
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCurrentPhaseIndex((pi) => {
            const nextPi = pi + 1;
            if (nextPi >= PHASES.length) {
              setCurrentRound((r) => {
                if (r >= TOTAL_ROUNDS) {
                  setSessionState("complete");
                  clearTimer();
                  return r;
                }
                return r + 1;
              });
              return 0;
            }
            return nextPi;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [sessionState, clearTimer]);

  useEffect(() => {
    if (sessionState === "active") {
      const phase = PHASES[currentPhaseIndex];
      if (phase) setCountdown(phase.duration);
    }
  }, [currentPhaseIndex, currentRound]);

  useEffect(() => {
    if (sessionState === "active" && countdown === 0 && currentPhaseIndex === 0) {
      setCountdown(PHASES[0].duration);
    }
  }, [sessionState]);

  const getCircleScale = () => {
    if (sessionState !== "active") return 1;
    if (currentPhase.phase === "inhale") return 1.45;
    if (currentPhase.phase === "exhale") return 0.65;
    return currentPhase.phase === "hold" ? 1.45 : 0.65;
  };

  const getPhaseColor = () => {
    if (sessionState !== "active") return "border-primary/30 bg-primary/5";
    if (currentPhase.phase === "inhale") return "border-blue-400/50 bg-blue-400/10";
    if (currentPhase.phase === "exhale") return "border-orange-400/50 bg-orange-400/10";
    return "border-primary/40 bg-primary/8";
  };

  return (
    <div className="space-y-5">
      {/* Breathing circle */}
      <div className="flex justify-center py-4">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-36 h-36 rounded-full border-[3px] ${getPhaseColor()} flex items-center justify-center`}
            style={{
              transform: `scale(${getCircleScale()})`,
              transition: `transform ${currentPhase.duration}s ease-in-out`,
            }}
          >
            <div className="text-center">
              {sessionState === "complete" ? (
                <p className="text-base font-semibold text-primary">Done 🎉</p>
              ) : sessionState === "ready" ? (
                <p className="text-sm text-muted-foreground">Press Play</p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{countdown}</p>
                  <p className="text-sm font-medium text-primary">{currentPhase.label}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Round indicator */}
      {sessionState !== "complete" && sessionState !== "ready" && (
        <p className="text-center text-xs text-muted-foreground">
          Round {currentRound} of {TOTAL_ROUNDS}
        </p>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {sessionState === "complete" ? (
          <Button onClick={reset} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" /> Again
          </Button>
        ) : (
          <>
            {sessionState === "active" ? (
              <Button onClick={pause} variant="outline" size="icon">
                <Pause className="w-5 h-5" />
              </Button>
            ) : (
              <Button onClick={play} size="icon" className="bg-primary text-primary-foreground">
                <Play className="w-5 h-5" />
              </Button>
            )}
            <Button onClick={reset} variant="outline" size="icon">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BreathingExercise;
