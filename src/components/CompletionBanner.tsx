import { useMemo, useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import type { Todo } from "@/types/todo";

import trophyCup from "@/assets/badges/trophy-cup.png";
import songwriter from "@/assets/badges/songwriter.png";
import crown from "@/assets/badges/crown.png";
import medal from "@/assets/badges/medal.png";
import shield from "@/assets/badges/shield.png";
import diamond from "@/assets/badges/diamond.png";
import wrench from "@/assets/badges/wrench.png";

const getBadge = (pct: number): { image: string; label: string; glow: string; glowIntensity: number } => {
  if (pct === 100) return { image: diamond, label: "Diamond", glow: "120, 180, 255", glowIntensity: 1 };
  if (pct >= 91) return { image: trophyCup, label: "Trophy", glow: "180, 130, 255", glowIntensity: 0.85 };
  if (pct >= 80) return { image: crown, label: "Crown", glow: "100, 140, 255", glowIntensity: 0.7 };
  if (pct >= 70) return { image: medal, label: "Medal", glow: "160, 180, 220", glowIntensity: 0.55 };
  if (pct >= 60) return { image: shield, label: "Shield", glow: "200, 170, 80", glowIntensity: 0.4 };
  if (pct >= 11) return { image: wrench, label: "Grinder", glow: "140, 200, 220", glowIntensity: 0.25 };
  return { image: songwriter, label: "Beginner", glow: "150, 150, 150", glowIntensity: 0.1 };
};

interface CompletionBannerProps {
  todos: Todo[];
}

const CompletionBanner = ({ todos }: CompletionBannerProps) => {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const { percentage, done, total } = useMemo(() => {
    if (todos.length === 0) return { percentage: 0, done: 0, total: 0 };
    const done = todos.filter((t) => t.completions.includes(todayStr)).length;
    return { percentage: Math.round((done / todos.length) * 100), done, total: todos.length };
  }, [todos, todayStr]);

  const badge = getBadge(percentage);
  const prevBadgeRef = useRef(badge.label);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (prevBadgeRef.current !== badge.label) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 600);
      prevBadgeRef.current = badge.label;
      return () => clearTimeout(timer);
    }
  }, [badge.label]);

  if (total === 0) return null;

  const glowSize = 20 + badge.glowIntensity * 60;
  const glowOpacity = 0.15 + badge.glowIntensity * 0.55;

  return (
    <div className="mb-5 flex flex-col items-center gap-3">
      {/* Big badge icon with glow */}
      <div className="relative flex items-center justify-center">
        {/* Glow layers */}
        <div
          className="absolute rounded-full blur-2xl transition-all duration-700"
          style={{
            width: `${glowSize * 2.5}px`,
            height: `${glowSize * 2.5}px`,
            background: `radial-gradient(circle, rgba(${badge.glow}, ${glowOpacity}) 0%, rgba(${badge.glow}, 0) 70%)`,
          }}
        />
        <div
          className="absolute rounded-full blur-xl transition-all duration-700"
          style={{
            width: `${glowSize * 1.6}px`,
            height: `${glowSize * 1.6}px`,
            background: `radial-gradient(circle, rgba(${badge.glow}, ${glowOpacity * 0.8}) 0%, rgba(${badge.glow}, 0) 60%)`,
          }}
        />

        {/* Badge container */}
        <div
          className={`relative z-10 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-500 ${
            animating ? "scale-110" : "scale-100"
          }`}
          style={{
            width: "120px",
            height: "120px",
            background: `linear-gradient(145deg, hsla(0, 0%, 100%, 0.08), hsla(0, 0%, 100%, 0.02))`,
            backdropFilter: "blur(20px)",
            border: `1px solid rgba(${badge.glow}, ${0.15 + badge.glowIntensity * 0.3})`,
            boxShadow: `
              0 0 ${glowSize}px rgba(${badge.glow}, ${glowOpacity * 0.4}),
              inset 0 1px 0 hsla(0, 0%, 100%, 0.08)
            `,
          }}
        >
          <img
            src={badge.image}
            alt={badge.label}
            className={`w-14 h-14 object-contain drop-shadow-lg transition-all duration-500 ${
              animating ? "animate-[spin_0.5s_ease-out]" : ""
            }`}
          />
          <span
            className="text-2xl font-black tracking-tight text-foreground"
            style={{
              textShadow: `0 0 ${10 + badge.glowIntensity * 20}px rgba(${badge.glow}, ${glowOpacity * 0.6})`,
            }}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {/* Label and progress */}
      <div className="w-full max-w-sm text-center space-y-2">
        <p
          className="text-sm font-bold tracking-wide uppercase transition-all duration-500"
          style={{
            color: `rgba(${badge.glow}, ${0.6 + badge.glowIntensity * 0.4})`,
            textShadow: `0 0 12px rgba(${badge.glow}, ${glowOpacity * 0.3})`,
          }}
        >
          {badge.label}
        </p>
        <Progress value={percentage} className="h-2 bg-secondary/40" />
        <p className="text-xs text-muted-foreground">
          {done}/{total} habits completed today
        </p>
      </div>
    </div>
  );
};

export default CompletionBanner;
