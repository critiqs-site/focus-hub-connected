import { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { Divider } from "@/types/todo";
import { TODO_ICONS, getIconComponent } from "@/lib/icons";
import IconPickerGrid from "@/components/IconPickerGrid";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DESC_MAX = 60;

const KEYWORD_MAP: Record<string, string[]> = {
  PersonStanding: ["meditate", "meditation", "stand", "yoga", "stretch", "posture"],
  Dumbbell: ["exercise", "gym", "workout", "lift", "weights", "train", "muscle", "bulk"],
  Footprints: ["walk", "steps", "walking", "hike", "stroll", "10k"],
  Bike: ["cycle", "cycling", "bike", "biking", "ride"],
  Heart: ["cardio", "love", "health", "heart", "pulse"],
  Activity: ["workout", "active", "exercise", "fitness", "sport"],
  Mountain: ["hike", "hiking", "climb", "outdoor", "mountain", "trail"],
  Waves: ["swim", "swimming", "pool", "water sport", "ocean"],
  Wind: ["breathe", "breathing", "breath", "air", "pranayama"],
  Shield: ["strength", "protect", "defense", "strong", "immune"],
  Brain: ["learn", "study", "think", "mental", "brain", "mind", "focus"],
  BookOpen: ["read", "reading", "book", "study", "learn", "pages", "literature"],
  Lightbulb: ["idea", "creative", "think", "brainstorm", "innovate"],
  Pencil: ["write", "writing", "journal", "diary", "note", "essay"],
  Target: ["goal", "target", "aim", "focus", "objective"],
  Laptop: ["code", "coding", "program", "develop", "computer", "work"],
  Monitor: ["screen", "monitor", "desktop", "display"],
  Calculator: ["math", "calculate", "numbers", "budget", "finance"],
  Search: ["research", "search", "find", "explore", "investigate"],
  FileText: ["notes", "document", "file", "report", "text"],
  Utensils: ["eat", "meal", "food", "dinner", "lunch", "breakfast", "cook", "cooking"],
  Coffee: ["coffee", "tea", "caffeine", "morning", "drink", "brew"],
  Droplets: ["water", "hydrate", "drink", "hydration", "2l", "liquid"],
  Apple: ["fruit", "apple", "healthy", "snack", "vitamin"],
  Salad: ["salad", "vegetable", "vegan", "greens", "healthy"],
  Sandwich: ["meal", "sandwich", "lunch", "prep"],
  Pizza: ["cheat", "pizza", "junk", "fast food", "treat"],
  IceCreamCone: ["treat", "ice cream", "dessert", "sweet", "sugar"],
  Wine: ["alcohol", "wine", "no alcohol", "sober", "dry"],
  Beer: ["beer", "drink", "alcohol", "bar"],
  Bed: ["sleep", "bed", "rest", "nap", "recover"],
  Moon: ["night", "evening", "moon", "bedtime", "pm"],
  Sunrise: ["wake", "morning", "sunrise", "early", "am"],
  Sun: ["morning", "sun", "day", "sunshine", "outdoor"],
  CloudSun: ["afternoon", "midday", "cloudy", "weather"],
  Timer: ["focus", "timer", "pomodoro", "time", "session"],
  Clock: ["time", "clock", "schedule", "routine", "alarm"],
  Zap: ["energy", "power", "boost", "quick", "fast"],
  Flame: ["streak", "fire", "intense", "burn", "calories", "hot"],
  RefreshCw: ["repeat", "refresh", "again", "cycle", "habit"],
  Smile: ["happy", "smile", "mood", "positive", "grateful", "gratitude"],
  Music: ["music", "listen", "song", "play", "instrument", "guitar", "piano"],
  Headphones: ["podcast", "audio", "listen", "headphones", "audiobook"],
  Gamepad2: ["game", "gaming", "play", "video game"],
  Tv: ["watch", "tv", "show", "movie", "series", "netflix"],
  Camera: ["photo", "camera", "picture", "selfie", "photography"],
  Mic: ["speak", "record", "mic", "voice", "podcast", "talk"],
  TreePine: ["outdoor", "nature", "tree", "forest", "park", "outside"],
  Leaf: ["nature", "leaf", "plant", "green", "organic", "eco"],
  Flower2: ["garden", "flower", "plant", "grow", "water plant"],
  Pill: ["medicine", "pill", "vitamin", "supplement", "medication", "drug"],
  Stethoscope: ["doctor", "health", "checkup", "medical", "appointment"],
  Eye: ["eye", "vision", "eye care", "screen break", "look"],
  Star: ["priority", "star", "important", "favorite", "best"],
  Rocket: ["launch", "start", "rocket", "hustle", "grind", "ambitious"],
  Trophy: ["win", "trophy", "achieve", "competition", "reward"],
  Crown: ["best", "crown", "king", "queen", "top", "premium"],
  Gem: ["valuable", "gem", "precious", "quality", "diamond"],
  Sparkles: ["magic", "sparkle", "special", "amazing", "glow"],
  TrendingUp: ["growth", "improve", "progress", "trending", "better"],
  Home: ["home", "house", "clean", "chore", "domestic"],
  Briefcase: ["work", "office", "job", "career", "business", "meeting"],
  Palette: ["art", "paint", "draw", "creative", "design", "color"],
  Scissors: ["groom", "grooming", "haircut", "shave", "trim", "skincare"],
  Brush: ["clean", "brush", "teeth", "scrub", "tidy"],
  Wrench: ["fix", "repair", "tool", "maintain", "build"],
  Dog: ["dog", "pet", "walk dog", "puppy", "animal"],
  Cat: ["cat", "pet", "kitten", "animal"],
  Baby: ["family", "baby", "kid", "child", "parent"],
  Phone: ["call", "phone", "friend", "contact"],
  Mail: ["email", "mail", "message", "inbox", "letter"],
  Car: ["drive", "car", "commute", "road", "travel"],
  Plane: ["fly", "travel", "plane", "trip", "vacation", "airport"],
  Smartphone: ["phone", "screen time", "digital", "app", "social media"],
  Bell: ["reminder", "bell", "alarm", "notification", "alert"],
  Compass: ["explore", "adventure", "compass", "discover", "navigate"],
  Globe: ["travel", "world", "global", "language", "culture"],
  Flag: ["milestone", "flag", "goal", "checkpoint", "achievement"],
  Bookmark: ["save", "bookmark", "read later", "favorite"],
  Tag: ["label", "tag", "organize", "category"],
  Settings: ["settings", "routine", "configure", "setup"],
  Lock: ["privacy", "secure", "lock", "password", "protect"],
  Key: ["security", "key", "access", "unlock"],
  Battery: ["recharge", "battery", "energy", "rest", "recover"],
};

function getTopIcons(query: string, count = 3): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const words = q.split(/\s+/);
  const scores: { name: string; score: number }[] = TODO_ICONS.map((icon) => {
    let score = 0;
    const label = icon.label.toLowerCase();
    const name = icon.name.toLowerCase();
    const keywords = KEYWORD_MAP[icon.name] || [];
    if (q === label) score += 10;
    if (label.includes(q)) score += 5;
    if (q.includes(label)) score += 4;
    if (name.includes(q)) score += 3;
    for (const kw of keywords) {
      if (q.includes(kw)) score += 6;
      for (const w of words) {
        if (kw.includes(w) && w.length > 2) score += 3;
        if (w.includes(kw) && kw.length > 2) score += 2;
      }
    }
    for (const w of words) { if (w.length > 2 && label.includes(w)) score += 2; }
    return { name: icon.name, score };
  });
  return scores.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, count).map(s => s.name);
}

const TODO_COLORS = [
  { label: "Theme", value: null, css: "hsl(var(--primary))" },
  { label: "Orange", value: "#E67E22", css: "#E67E22" },
  { label: "Maroon", value: "#8B1A1A", css: "#8B1A1A" },
  { label: "Blue", value: "#3498DB", css: "#3498DB" },
  { label: "Purple", value: "#9B59B6", css: "#9B59B6" },
];

interface AddTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (text: string, dividerId: string, icon: string, description?: string, goalDaysPerWeek?: number, targetAmount?: number, targetUnit?: string, color?: string) => void;
  dividers: Divider[];
  preselectedDividerId?: string | null;
  isGuest?: boolean;
}

const AddTodoDialog = ({ open, onOpenChange, onAdd, dividers, preselectedDividerId, isGuest }: AddTodoDialogProps) => {
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [dividerId, setDividerId] = useState(preselectedDividerId || dividers[0]?.id || "");
  const [selectedIcon, setSelectedIcon] = useState("PersonStanding");
  const [suggestedIcons, setSuggestedIcons] = useState<string[]>([]);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [goalDays, setGoalDays] = useState(7);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    if (open && preselectedDividerId) setDividerId(preselectedDividerId);
    else if (open && !preselectedDividerId && dividers[0]) setDividerId(dividers[0].id);
  }, [open, preselectedDividerId, dividers]);

  useEffect(() => { if (!open) { setSuggestedIcons([]); setGoalDays(7); setSelectedColor(null); } }, [open]);

  const handleAutoIcon = useCallback(async () => {
    if (isGuest) { toast.error("This feature is only available for registered users."); return; }
    setIsAutoDetecting(true);
    try {
      const availableIcons = TODO_ICONS.map(icon => icon.name);
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { type: "icon-suggest", todoText: text, availableIcons },
      });
      if (error) throw error;
      const suggestions = data?.suggestions || [];
      if (suggestions.length > 0) { setSuggestedIcons(suggestions); setSelectedIcon(suggestions[0]); }
      else toast.error("No icon suggestions found");
    } catch (error) {
      console.error("Icon detection error:", error);
      toast.error("Failed to detect icons");
    } finally { setIsAutoDetecting(false); }
  }, [text]);

  const handleSubmit = () => {
    if (text.trim() && dividerId) {
      onAdd(text.trim(), dividerId, selectedIcon, description.trim() || undefined, goalDays, undefined, undefined, selectedColor || undefined);
      setText(""); setDescription(""); setSelectedIcon("PersonStanding"); setSuggestedIcons([]);
      setGoalDays(7); setSelectedColor(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/20 bg-card/95 backdrop-blur-xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            Add New Habit
            {dividers.find(d => d.id === dividerId) && (
              <span className="text-sm font-normal text-muted-foreground">
                → {dividers.find(d => d.id === dividerId)?.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="What habit do you want to track?"
            value={text} onChange={(e) => setText(e.target.value)}
            className="bg-secondary/50 border-primary/30 focus:border-primary"
            autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          />

          <Input
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => { if (e.target.value.length <= DESC_MAX) setDescription(e.target.value); }}
            className="bg-secondary/50 border-primary/30 focus:border-primary text-sm"
          />

          {/* Goal days per week */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Goal</span>
              <span className="text-foreground font-medium">{goalDays === 7 ? "Every day" : `${goalDays} days/week`}</span>
            </div>
            <Slider value={[goalDays]} onValueChange={([v]) => setGoalDays(v)} min={1} max={7} step={1} />
          </div>

          {/* Color picker - 5 options */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Color</span>
            <div className="flex gap-3">
              {TODO_COLORS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setSelectedColor(c.value)}
                  className={`flex flex-col items-center gap-1 group`}
                  title={c.label}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                      selectedColor === c.value ? 'border-foreground scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ background: c.css }}
                  />
                  <span className="text-[10px] text-muted-foreground">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button type="button" variant="outline" onClick={handleAutoIcon} disabled={!text.trim() || isAutoDetecting}
            className="w-full border-primary/30 hover:bg-primary/20 hover:border-primary">
            {isAutoDetecting ? (
              <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> DETECTING...</span>
            ) : (
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AUTO DETECT ICON</span>
            )}
          </Button>

          {suggestedIcons.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Top picks:</span>
              {suggestedIcons.map((iconName) => {
                const IconComp = getIconComponent(iconName);
                return (
                  <button key={iconName} type="button" onClick={() => setSelectedIcon(iconName)}
                    className={`p-2 rounded-xl transition-all duration-200 ${selectedIcon === iconName ? "bg-primary/20 border-2 border-primary" : "bg-secondary/50 border-2 border-primary/40 hover:border-primary"}`}>
                    <IconComp className={`h-5 w-5 ${selectedIcon === iconName ? "text-primary" : "text-muted-foreground"}`} />
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Or choose manually</label>
            <div className="max-h-48 overflow-y-auto pr-1">
              <IconPickerGrid icons={TODO_ICONS} selectedIcon={selectedIcon} onSelect={setSelectedIcon} batchSize={15} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="glass-button">Cancel</Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">Add Habit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTodoDialog;
