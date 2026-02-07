import { Laugh, Smile, Meh, Frown, CloudRain } from "lucide-react";
import type { MoodType } from "@/types/todo";

interface MoodOption {
  type: MoodType;
  icon: React.ReactNode;
  label: string;
  suggestion: string;
}

const moodOptions: MoodOption[] = [
  { type: "super_happy", icon: <Laugh className="h-6 w-6" />, label: "Super Happy", suggestion: "I feel amazing because" },
  { type: "happy", icon: <Smile className="h-6 w-6" />, label: "Happy", suggestion: "I feel happy because" },
  { type: "neutral", icon: <Meh className="h-6 w-6" />, label: "Neutral", suggestion: "I feel okay because" },
  { type: "sad", icon: <Frown className="h-6 w-6" />, label: "Sad", suggestion: "I feel sad because" },
  { type: "depressed", icon: <CloudRain className="h-6 w-6" />, label: "Depressed", suggestion: "I feel down because" },
];

interface MoodSelectorProps {
  selectedMood: MoodType | null;
  onSelect: (mood: MoodType) => void;
}

const MoodSelector = ({ selectedMood, onSelect }: MoodSelectorProps) => {
  return (
    <div className="flex items-center justify-center gap-3">
      {moodOptions.map((mood) => (
        <button
          key={mood.type}
          onClick={() => onSelect(mood.type)}
          className={`
            relative p-3 rounded-xl transition-all duration-300
            ${selectedMood === mood.type
              ? "bg-primary/20 scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background text-primary"
              : "bg-secondary/50 hover:bg-secondary hover:scale-105 text-muted-foreground hover:text-foreground"
            }
          `}
          title={mood.label}
        >
          {mood.icon}
        </button>
      ))}
    </div>
  );
};

export const getMoodIcon = (mood: MoodType): React.ReactNode => {
  const option = moodOptions.find(m => m.type === mood);
  return option?.icon || <Meh className="h-6 w-6" />;
};

export const getMoodLabel = (mood: MoodType): string => {
  const option = moodOptions.find(m => m.type === mood);
  return option?.label || "Neutral";
};

export const getMoodSuggestion = (mood: MoodType): string => {
  const option = moodOptions.find(m => m.type === mood);
  return option?.suggestion || "I feel this way because";
};

export default MoodSelector;
