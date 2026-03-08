import { Dumbbell, Shirt, UtensilsCrossed, Wind } from "lucide-react";
import PhysiqueRater from "./PhysiqueRater";
import OutfitRater from "./OutfitRater";
import FoodScanner from "./FoodScanner";
import BreathingExercise from "./BreathingExercise";

interface ToolsViewProps {
  onAskAI?: (image: string, message: string) => void;
}

const ToolsView = ({ onAskAI }: ToolsViewProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Physique Rater</h2>
            <p className="text-xs text-muted-foreground">Upload a body photo and get an AI rating out of 10</p>
          </div>
        </div>
        <PhysiqueRater onAskAI={onAskAI} />
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shirt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Outfit Rater</h2>
            <p className="text-xs text-muted-foreground">Upload an outfit photo → AI rates fit, color coordination, style & suggestions</p>
          </div>
        </div>
        <OutfitRater onAskAI={onAskAI} />
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Food Scanner</h2>
            <p className="text-xs text-muted-foreground">Snap a meal photo → instant calorie & macro estimates (protein, carbs, fats)</p>
          </div>
        </div>
        <FoodScanner onAskAI={onAskAI} />
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wind className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Breathing Exercises</h2>
            <p className="text-xs text-muted-foreground">Science-backed guided sessions to reduce anxiety & boost presence</p>
          </div>
        </div>
        <BreathingExercise />
      </div>
    </div>
  );
};

export default ToolsView;
