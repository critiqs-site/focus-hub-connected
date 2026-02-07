import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const INTERESTS = [
  "Self Improvement",
  "Business",
  "Health & Fitness",
  "Mindfulness",
  "Productivity",
  "Learning",
  "Creativity",
  "Relationships",
  "Finance",
  "Mental Health",
];

interface OnboardingDialogProps {
  open: boolean;
  userId: string;
  onComplete: () => void;
}

const OnboardingDialog = ({ open, userId, onComplete }: OnboardingDialogProps) => {
  const [name, setName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (selectedInterests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from("profiles").upsert({
      user_id: userId,
      name: name.trim(),
      interests: selectedInterests,
      onboarding_complete: true,
    });

    if (error) {
      console.error("Profile error:", error);
      toast.error("Failed to save profile");
      setIsLoading(false);
      return;
    }

    // Create default sections and habits
    const { data: dividerData, error: dividerError } = await supabase
      .from("dividers")
      .insert([
        { user_id: userId, name: "Morning Routine", icon: "Sun" },
        { user_id: userId, name: "Health", icon: "Heart" },
        { user_id: userId, name: "Growth", icon: "TrendingUp" },
      ])
      .select();

    if (dividerError) {
      console.error("Divider error:", dividerError);
    } else if (dividerData) {
      const morningId = dividerData.find((d) => d.name === "Morning Routine")?.id;
      const healthId = dividerData.find((d) => d.name === "Health")?.id;
      const growthId = dividerData.find((d) => d.name === "Growth")?.id;

      const defaultTodos = [
        { user_id: userId, divider_id: morningId, text: "Wake up early", icon: "Sunrise" },
        { user_id: userId, divider_id: morningId, text: "Meditate 10 mins", icon: "Brain" },
        { user_id: userId, divider_id: healthId, text: "Exercise 30 mins", icon: "Dumbbell" },
        { user_id: userId, divider_id: healthId, text: "Drink 8 glasses of water", icon: "Droplet" },
        { user_id: userId, divider_id: growthId, text: "Read for 20 mins", icon: "BookOpen" },
        { user_id: userId, divider_id: growthId, text: "Learn something new", icon: "Lightbulb" },
      ].filter((t) => t.divider_id);

      await supabase.from("todos").insert(defaultTodos);
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
            Let's get to know you
          </DialogTitle>
          <p className="text-muted-foreground text-center text-sm">
            This helps your AI guide personalize your experience
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              What's your name?
            </Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 bg-secondary/50 border-primary/20 focus:border-primary"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-foreground font-medium">
              What are you interested in?
            </Label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedInterests.includes(interest)
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select multiple interests that resonate with you
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Get Started
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
