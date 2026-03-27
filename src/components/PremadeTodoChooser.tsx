import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { getIconComponent } from "@/lib/icons";
import logoIcon from "@/assets/logo-icon.png";

interface HabitOption {
  text: string;
  icon: string;
  description?: string;
}

interface CategoryOption {
  name: string;
  icon: string;
  habits: HabitOption[];
}

const CATEGORIES: CategoryOption[] = [
  {
    name: "Morning Routine",
    icon: "Sun",
    habits: [
      { text: "Wake up early", icon: "Sunrise", description: "Before 7 AM" },
      { text: "Make your bed", icon: "Home", description: "Start clean" },
      { text: "Morning stretch", icon: "PersonStanding", description: "5 minutes" },
      { text: "Cold shower", icon: "Droplets", description: "Boost energy" },
    ],
  },
  {
    name: "Health & Fitness",
    icon: "Heart",
    habits: [
      { text: "Exercise 30 mins", icon: "Dumbbell", description: "Any workout" },
      { text: "Drink 2L water", icon: "Droplets", description: "Stay hydrated" },
      { text: "Eat healthy meal", icon: "Salad", description: "Whole foods" },
      { text: "Walk 10k steps", icon: "Footprints", description: "Stay active" },
      { text: "No junk food", icon: "Apple", description: "Clean eating" },
    ],
  },
  {
    name: "Productivity",
    icon: "Rocket",
    habits: [
      { text: "Deep work session", icon: "Timer", description: "2 hours focus" },
      { text: "Plan tomorrow", icon: "FileText", description: "Night planning" },
      { text: "No social media", icon: "Smartphone", description: "Digital detox" },
      { text: "Complete top 3 tasks", icon: "Target", description: "Prioritize" },
    ],
  },
  {
    name: "Mindfulness",
    icon: "Brain",
    habits: [
      { text: "Meditate 10 mins", icon: "Brain", description: "Morning calm" },
      { text: "Gratitude journal", icon: "Pencil", description: "3 things daily" },
      { text: "Breathing exercise", icon: "Wind", description: "Box breathing" },
      { text: "No phone before bed", icon: "Moon", description: "Better sleep" },
    ],
  },
  {
    name: "Learning",
    icon: "BookOpen",
    habits: [
      { text: "Read 20 pages", icon: "BookOpen", description: "Daily reading" },
      { text: "Learn new skill", icon: "Lightbulb", description: "Grow daily" },
      { text: "Listen to podcast", icon: "Headphones", description: "Learn on go" },
      { text: "Practice a language", icon: "Globe", description: "15 minutes" },
    ],
  },
  {
    name: "Self Care",
    icon: "Smile",
    habits: [
      { text: "Skincare routine", icon: "Scissors", description: "AM + PM" },
      { text: "Sleep 8 hours", icon: "Bed", description: "Rest well" },
      { text: "Take vitamins", icon: "Pill", description: "Daily supplements" },
      { text: "Screen break every hour", icon: "Eye", description: "Eye health" },
    ],
  },
];

interface PremadeTodoChooserProps {
  onComplete: (selections: { category: string; categoryIcon: string; habits: HabitOption[] }[]) => void;
}

const PremadeTodoChooser = ({ onComplete }: PremadeTodoChooserProps) => {
  const [selectedHabits, setSelectedHabits] = useState<Map<string, Set<number>>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const toggleHabit = (categoryName: string, habitIndex: number) => {
    setSelectedHabits(prev => {
      const next = new Map(prev);
      const set = new Set(next.get(categoryName) || []);
      if (set.has(habitIndex)) set.delete(habitIndex);
      else set.add(habitIndex);
      if (set.size === 0) next.delete(categoryName);
      else next.set(categoryName, set);
      return next;
    });
  };

  const toggleCategory = (category: CategoryOption) => {
    setSelectedHabits(prev => {
      const next = new Map(prev);
      const existing = next.get(category.name);
      if (existing && existing.size === category.habits.length) {
        next.delete(category.name);
      } else {
        next.set(category.name, new Set(category.habits.map((_, i) => i)));
      }
      return next;
    });
  };

  const totalSelected = Array.from(selectedHabits.values()).reduce((sum, set) => sum + set.size, 0);

  const handleContinue = () => {
    setIsLoading(true);
    const selections = CATEGORIES
      .filter(cat => selectedHabits.has(cat.name))
      .map(cat => ({
        category: cat.name,
        categoryIcon: cat.icon,
        habits: cat.habits.filter((_, i) => selectedHabits.get(cat.name)?.has(i)),
      }));
    onComplete(selections);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[10%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsla(0, 60%, 35%, 0.4), transparent 70%)' }} />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsla(240, 70%, 50%, 0.3), transparent 70%)' }} />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="flex justify-center mb-4">
          <img src={logoIcon} alt="CRITIQS" className="w-16 h-16 object-contain animate-pulse-logo" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-1">Choose Your Habits</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Pick the habits you want to build. You can always change later.</p>

        <div className="space-y-4 max-h-[55vh] overflow-y-auto scrollbar-hide pr-1">
          {CATEGORIES.map(category => {
            const catSelected = selectedHabits.get(category.name);
            const allSelected = catSelected?.size === category.habits.length;
            const CatIcon = getIconComponent(category.icon);

            return (
              <div key={category.name} className="rounded-2xl overflow-hidden" style={{
                background: 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.06) 0%, hsla(0, 0%, 100%, 0.02) 100%)',
                border: catSelected?.size ? '1px solid hsla(0, 60%, 35%, 0.3)' : '1px solid hsla(0, 0%, 100%, 0.08)',
                backdropFilter: 'blur(20px)',
              }}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className={`p-2 rounded-xl ${allSelected ? 'bg-primary/20' : 'bg-secondary/50'}`}>
                    <CatIcon className={`h-5 w-5 ${allSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="font-semibold text-foreground flex-1">{category.name}</span>
                  {allSelected && <Check className="h-5 w-5 text-primary" />}
                </button>
                <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                  {category.habits.map((habit, i) => {
                    const isSelected = catSelected?.has(i);
                    const HIcon = getIconComponent(habit.icon);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleHabit(category.name, i)}
                        className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all text-sm ${
                          isSelected
                            ? 'bg-primary/15 border border-primary/40'
                            : 'bg-secondary/30 border border-transparent hover:bg-secondary/50'
                        }`}
                      >
                        <HIcon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="min-w-0">
                          <p className={`font-medium truncate ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{habit.text}</p>
                          {habit.description && <p className="text-xs text-muted-foreground truncate">{habit.description}</p>}
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={handleContinue}
            disabled={totalSelected === 0 || isLoading}
            className="w-full h-14 font-bold text-lg rounded-2xl group"
            style={{
              background: 'linear-gradient(135deg, hsl(0, 60%, 35%), hsl(0, 60%, 30%))',
              boxShadow: totalSelected > 0 ? '0 0 40px hsla(0, 60%, 35%, 0.4)' : 'none',
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Get Started ({totalSelected} habits)
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
          <button
            onClick={() => onComplete([])}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Skip — I'll add my own
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremadeTodoChooser;
