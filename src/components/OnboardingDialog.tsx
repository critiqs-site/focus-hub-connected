import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, ArrowRight, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getIconComponent } from "@/lib/icons";

const PREMADE_HABITS = [
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

interface OnboardingDialogProps {
  open: boolean;
  userId: string;
  onComplete: () => void;
}

const OnboardingDialog = ({ open, userId, onComplete }: OnboardingDialogProps) => {
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

  const handleSubmit = async () => {
    if (step === "name") {
      if (!name.trim()) { toast.error("Please enter your name"); return; }
      setStep("habits");
      return;
    }
    if (selected.size === 0) { toast.error("Please select at least one habit"); return; }

    setIsLoading(true);

    const { error } = await supabase.from("profiles").upsert({
      user_id: userId,
      name: name.trim(),
      interests: [],
      onboarding_complete: true,
    });

    if (error) {
      console.error("Profile error:", error);
      toast.error("Failed to save profile");
      setIsLoading(false);
      return;
    }

    // Create single divider + selected habits
    const { data: dividerData, error: dividerError } = await supabase
      .from("dividers")
      .insert([{ user_id: userId, name: "My Habits", icon: "Star" }])
      .select();

    if (dividerError) {
      console.error("Divider error:", dividerError);
    } else if (dividerData && dividerData[0]) {
      const dividerId = dividerData[0].id;
      const habits = PREMADE_HABITS.filter((_, i) => selected.has(i));
      const todosToInsert = habits.map((h, idx) => ({
        user_id: userId,
        divider_id: dividerId,
        text: h.text,
        icon: h.icon,
        order: idx,
      }));
      await supabase.from("todos").insert(todosToInsert);
    }

    toast.success(`Welcome, ${name}! 🎉`);
    setIsLoading(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg bg-background border-primary/20 [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            {step === "name" ? "What's your name?" : `Pick your habits, ${name}`}
          </DialogTitle>
          <p className="text-muted-foreground text-center text-sm">
            {step === "name" ? "Let's personalize your experience" : "Select at least 1 habit to get started"}
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {step === "name" ? (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-medium">Your name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 bg-secondary/50 border-primary/20 focus:border-primary"
                disabled={isLoading}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) setStep("habits"); }}
              />
            </div>
          ) : (
            <div className="space-y-2 max-h-[45vh] overflow-y-auto scrollbar-hide pr-1">
              {PREMADE_HABITS.map((habit, i) => {
                const isSelected = selected.has(i);
                const Icon = getIconComponent(habit.icon);
                return (
                  <button
                    key={i}
                    onClick={() => toggleHabit(i)}
                    disabled={isLoading}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-primary/15 border border-primary/40"
                        : "bg-secondary/30 border border-transparent hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-secondary/50'}`}>
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {habit.text}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading || (step === "habits" && selected.size === 0)}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {step === "name" ? "Next" : `Get Started (${selected.size})`}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
