import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Technique = "box" | "478" | "wimhof";
type Phase = "inhale" | "hold" | "exhale" | "holdOut" | "idle";
type SessionState = "selecting" | "ready" | "active" | "paused" | "complete";

interface TechniqueConfig {
  id: Technique;
  name: string;
  subtitle: string;
  description: string;
  benefits: string[];
  phases: { phase: Phase; label: string; duration: number }[];
  rounds: number;
}

const TECHNIQUES: TechniqueConfig[] = [
  {
    id: "box",
    name: "Box Breathing",
    subtitle: "Used by Navy SEALs",
    description: "Equal-timed breathing that activates your parasympathetic nervous system, reducing cortisol and stress hormones. Studies show it lowers heart rate within 90 seconds.",
    benefits: [
      "Reduces cortisol by up to 25% (Ma et al., 2017)",
      "Activates vagus nerve → calms fight-or-flight",
      "Improves focus and decision-making under pressure",
      "Lowers blood pressure within minutes",
    ],
    phases: [
      { phase: "inhale", label: "Inhale", duration: 4 },
      { phase: "hold", label: "Hold", duration: 4 },
      { phase: "exhale", label: "Exhale", duration: 4 },
      { phase: "holdOut", label: "Hold", duration: 4 },
    ],
    rounds: 4,
  },
  {
    id: "478",
    name: "4-7-8 Breathing",
    subtitle: "Dr. Andrew Weil's Method",
    description: "Extended exhale technique that forces your nervous system into relaxation. The 7-second hold saturates blood with oxygen, and the long exhale expels CO₂, triggering deep calm.",
    benefits: [
      "Triggers parasympathetic response in under 60 seconds",
      "Proven to reduce anxiety and help with insomnia (Weil, 2015)",
      "Lowers resting heart rate with consistent practice",
      "Balances oxygen-CO₂ ratio for mental clarity",
    ],
    phases: [
      { phase: "inhale", label: "Inhale", duration: 4 },
      { phase: "hold", label: "Hold", duration: 7 },
      { phase: "exhale", label: "Exhale", duration: 8 },
    ],
    rounds: 4,
  },
  {
    id: "wimhof",
    name: "Wim Hof Method",
    subtitle: "The Iceman's Technique",
    description: "Controlled hyperventilation followed by breath retention. Research at Radboud University proved it voluntarily influences the autonomic nervous system and immune response.",
    benefits: [
      "Increases adrenaline and anti-inflammatory markers (Kox et al., 2014)",
      "Boosts immune system response measurably",
      "Increases cold tolerance and mental resilience",
      "Elevates energy, focus, and mood via controlled stress",
    ],
    phases: [
      { phase: "inhale", label: "Deep Breath In", duration: 2 },
      { phase: "exhale", label: "Let Go", duration: 2 },
    ],
    rounds: 30,
  },
];

const BreathingExercise = () => {
  const [technique, setTechnique] = useState<TechniqueConfig | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("selecting");
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhase = technique?.phases[currentPhaseIndex];

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startSession = (tech: TechniqueConfig) => {
    setTechnique(tech);
    setSessionState("ready");
    setCurrentPhaseIndex(0);
    setCurrentRound(1);
    setCountdown(tech.phases[0].duration);
    setTotalElapsed(0);
  };

  const play = () => {
    if (!technique) return;
    setSessionState("active");
  };

  const pause = () => {
    setSessionState("paused");
    clearTimer();
  };

  const resetSession = () => {
    clearTimer();
    setSessionState("selecting");
    setTechnique(null);
    setCurrentPhaseIndex(0);
    setCurrentRound(1);
    setCountdown(0);
    setTotalElapsed(0);
  };

  useEffect(() => {
    if (sessionState !== "active" || !technique) return;

    clearTimer();
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Move to next phase
          setCurrentPhaseIndex((pi) => {
            const nextPi = pi + 1;
            if (nextPi >= technique.phases.length) {
              // Finished a round
              setCurrentRound((r) => {
                if (r >= technique.rounds) {
                  // Done
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
          return 0; // will be set properly below
        }
        return prev - 1;
      });
      setTotalElapsed((t) => t + 1);
    }, 1000);

    return clearTimer;
  }, [sessionState, technique, clearTimer]);

  // Update countdown when phase changes
  useEffect(() => {
    if (technique && sessionState === "active") {
      const phase = technique.phases[currentPhaseIndex];
      if (phase) {
        setCountdown(phase.duration);
      }
    }
  }, [currentPhaseIndex, currentRound]);

  // Set initial countdown when starting
  useEffect(() => {
    if (sessionState === "active" && technique && countdown === 0 && currentPhaseIndex === 0) {
      setCountdown(technique.phases[0].duration);
    }
  }, [sessionState]);

  const getCircleScale = () => {
    if (!currentPhase || sessionState !== "active") return 1;
    if (currentPhase.phase === "inhale") return 1.4;
    if (currentPhase.phase === "exhale") return 0.7;
    return 1.1; // hold
  };

  const getCircleColor = () => {
    if (!currentPhase || sessionState !== "active") return "border-primary/30";
    if (currentPhase.phase === "inhale") return "border-blue-400/60";
    if (currentPhase.phase === "exhale") return "border-orange-400/60";
    return "border-primary/50";
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Technique selection
  if (sessionState === "selecting") {
    return (
      <div className="space-y-4">
        {TECHNIQUES.map((tech) => (
          <button
            key={tech.id}
            onClick={() => startSession(tech)}
            className="w-full text-left glass-card p-5 hover:bg-primary/5 transition-all duration-300 hover:border-primary/30 border border-transparent"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-foreground">{tech.name}</h3>
              <span className="text-xs text-primary font-medium">{tech.subtitle}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{tech.description}</p>
            <div className="space-y-1">
              {tech.benefits.map((b, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>{b}</span>
                </p>
              ))}
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Active / Ready / Paused / Complete
  return (
    <div className="space-y-6">
      {/* Technique header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">{technique?.name}</h3>
        <p className="text-xs text-muted-foreground">{technique?.subtitle}</p>
      </div>

      {/* Breathing circle */}
      <div className="flex justify-center py-6">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-40 h-40 rounded-full border-4 ${getCircleColor()} flex items-center justify-center transition-transform bg-primary/5`}
            style={{
              transform: `scale(${getCircleScale()})`,
              transitionDuration: currentPhase ? `${currentPhase.duration}s` : "0.5s",
              transitionTimingFunction: "ease-in-out",
            }}
          >
            <div className="text-center">
              {sessionState === "complete" ? (
                <p className="text-lg font-semibold text-primary">Done! 🎉</p>
              ) : sessionState === "ready" ? (
                <p className="text-sm text-muted-foreground">Press Play</p>
              ) : (
                <>
                  <p className="text-xl font-bold text-foreground">{countdown}</p>
                  <p className="text-sm text-primary font-medium">{currentPhase?.label}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Round counter & timer */}
      {technique && sessionState !== "complete" && (
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <span>Round {currentRound}/{technique.rounds}</span>
          <span>{formatTime(totalElapsed)}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {sessionState === "complete" ? (
          <Button onClick={resetSession} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" /> Try Another
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
            <Button onClick={resetSession} variant="outline" size="icon">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BreathingExercise;
