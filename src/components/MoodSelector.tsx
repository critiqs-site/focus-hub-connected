import type { MoodType } from "@/types/todo";

interface MoodOption {
  type: MoodType;
  emoji: string;
  label: string;
  suggestion: string;
}

const moodOptions: MoodOption[] = [
  { type: "super_happy", emoji: "😁", label: "Super Happy", suggestion: "I feel amazing because" },
  { type: "happy", emoji: "😊", label: "Happy", suggestion: "I feel happy because" },
  { type: "neutral", emoji: "😐", label: "Neutral", suggestion: "I feel okay because" },
  { type: "sad", emoji: "😢", label: "Sad", suggestion: "I feel sad because" },
  { type: "depressed", emoji: "😞", label: "Depressed", suggestion: "I feel down because" },
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
            relative p-3 rounded-xl transition-all duration-300 text-2xl
            ${selectedMood === mood.type
              ? "bg-primary/20 scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background"
              : "bg-secondary/50 hover:bg-secondary hover:scale-105"
            }
          `}
          title={mood.label}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  );
};

export const getMoodEmoji = (mood: MoodType): string => {
  const option = moodOptions.find(m => m.type === mood);
  return option?.emoji || "😐";
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
