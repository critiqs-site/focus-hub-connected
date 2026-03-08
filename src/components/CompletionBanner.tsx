import { useMemo } from "react";
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

const getBadge = (pct: number): { image: string; label: string } => {
  if (pct === 100) return { image: diamond, label: "Diamond" };
  if (pct >= 91) return { image: trophyCup, label: "Trophy" };
  if (pct >= 80) return { image: crown, label: "Crown" };
  if (pct >= 70) return { image: medal, label: "Medal" };
  if (pct >= 60) return { image: shield, label: "Shield" };
  if (pct >= 11) return { image: wrench, label: "Grinder" };
  return { image: songwriter, label: "Beginner" };
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

  if (total === 0) return null;

  return (
    <div className="glass-card p-4 mb-4 flex items-center gap-4">
      <img
        src={badge.image}
        alt={badge.label}
        className="w-12 h-12 object-contain flex-shrink-0 drop-shadow-lg"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-foreground">
            Today's Progress
          </span>
          <span className="text-sm font-bold text-primary">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2.5 bg-secondary/60" />
        <p className="text-xs text-muted-foreground mt-1.5">
          {done}/{total} habits done · <span className="text-primary font-medium">{badge.label}</span>
        </p>
      </div>
    </div>
  );
};

export default CompletionBanner;
