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
    <div className="mb-3 lg:mb-5 flex flex-col items-center gap-2">
      {/* Compact badge icon with glow */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full blur-xl transition-all duration-700"
          style={{
            width: `${glowSize * 1.8}px`,
            height: `${glowSize * 1.8}px`,
            background: `radial-gradient(circle, rgba(${badge.glow}, ${glowOpacity * 0.6}) 0%, rgba(${badge.glow}, 0) 70%)`,
          }}
        />
        <div
          className={`relative z-10 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-500 w-[80px] h-[80px] lg:w-[100px] lg:h-[100px] ${
            animating ? "scale-110" : "scale-100"
          }`}
          style={{
            background: `linear-gradient(145deg, hsla(0, 0%, 100%, 0.08), hsla(0, 0%, 100%, 0.02))`,
            backdropFilter: "blur(20px)",
            border: `1px solid rgba(${badge.glow}, ${0.15 + badge.glowIntensity * 0.3})`,
            boxShadow: `0 0 ${glowSize}px rgba(${badge.glow}, ${glowOpacity * 0.4}), inset 0 1px 0 hsla(0, 0%, 100%, 0.08)`,
          }}
        >
          <img
            src={badge.image}
            alt={badge.label}
            className={`w-8 h-8 lg:w-12 lg:h-12 object-contain drop-shadow-lg transition-all duration-500 ${
              animating ? "animate-[spin_0.5s_ease-out]" : ""
            }`}
          />
          <span
            className="text-lg lg:text-2xl font-black tracking-tight text-foreground"
            style={{
              textShadow: `0 0 ${10 + badge.glowIntensity * 20}px rgba(${badge.glow}, ${glowOpacity * 0.6})`,
            }}
          >
            {percentage}%
          </span>
        </div>
      </div>

      <div className="w-full max-w-xs lg:max-w-sm text-center space-y-1">
        <p
          className="text-[10px] lg:text-xs font-bold tracking-wide uppercase transition-all duration-500"
          style={{
            color: `rgba(${badge.glow}, ${0.6 + badge.glowIntensity * 0.4})`,
          }}
        >
          {badge.label}
        </p>
        <Progress value={percentage} className="h-1.5 bg-secondary/40" />
        <p className="text-[10px] text-muted-foreground">
          {done}/{total} habits completed today
        </p>
      </div>
    </div>
  );
};

export default CompletionBanner;
