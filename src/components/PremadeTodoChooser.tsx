import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { getIconComponent } from "@/lib/icons";
import logoIcon from "@/assets/logo-icon.png";

interface HabitOption {
  text: string;
  icon: string;
}

const PREMADE_HABITS: HabitOption[] = [
  { text: "Meditate for 5 minutes", icon: "Brain" },
  { text: "Exercise for 10 minutes", icon: "Dumbbell" },
  { text: "Call my parents at night", icon: "Phone" },
  { text: "Drink 2L of water", icon: "Droplets" },
  { text: "Read for 15 minutes", icon: "BookOpen" },
  { text: "Sleep before midnight", icon: "Moon" },
  { text: "No junk food today", icon: "Apple" },
  { text: "Write in my journal", icon: "Pencil" },
  { text: "Walk 10,000 steps", icon: "Footprints" },
  { text: "Practice gratitude", icon: "Smile" },
];

interface PremadeTodoChooserProps {
  onComplete: (name: string, habits: HabitOption[]) => void;
}

const PremadeTodoChooser = ({ onComplete }: PremadeTodoChooserProps) => {
  const [step, setStep] = useState<"name" | "habits">("name");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const toggleHabit = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handleContinue = () => {
    if (step === "name") {
      if (!name.trim()) return;
      setStep("habits");
      return;
    }
    setIsLoading(true);
    const habits = PREMADE_HABITS.filter((_, i) => selected.has(i));
    onComplete(name.trim(), habits);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[10%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <img src={logoIcon} alt="CRITIQS" className="w-16 h-16 object-contain animate-pulse-logo" />
        </div>

        {step === "name" ? (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Welcome to CRITIQS</h1>
              <p className="text-sm text-muted-foreground">What should we call you?</p>
            </div>
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 text-lg bg-secondary/50 border-primary/20 focus:border-primary text-center"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) setStep("habits"); }}
            />
            <Button
              onClick={handleContinue}
              disabled={!name.trim()}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg group"
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-1">Pick your habits, {name}</h1>
              <p className="text-sm text-muted-foreground">Select at least 1. You can always add more later.</p>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-hide pr-1">
              {PREMADE_HABITS.map((habit, i) => {
                const isSelected = selected.has(i);
                const Icon = getIconComponent(habit.icon);
                return (
                  <button
                    key={i}
                    onClick={() => toggleHabit(i)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200 ${
                      isSelected
                        ? "bg-primary/15 border border-primary/40"
                        : "bg-secondary/30 border border-transparent hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-secondary/50'}`}>
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`flex-1 font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {habit.text}
                    </span>
                    {isSelected && <Check className="h-5 w-5 text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleContinue}
                disabled={selected.size === 0 || isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg group"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Get Started ({selected.size})<ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
              <button
                onClick={() => onComplete(name.trim(), [])}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Skip — I'll add my own
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremadeTodoChooser;
