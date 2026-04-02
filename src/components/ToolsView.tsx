import physiqueIcon from "@/assets/tools/physique.png";
import foodIcon from "@/assets/tools/food.png";
import outfitIcon from "@/assets/tools/outfit.png";
import breathingIcon from "@/assets/tools/breathing.png";
import PhysiqueRater from "./PhysiqueRater";
import OutfitRater from "./OutfitRater";
import FoodScanner from "./FoodScanner";
import BreathingExercise from "./BreathingExercise";
import PomodoroTimer from "./PomodoroTimer";
import Stopwatch from "./Stopwatch";
import { Timer, Clock, Wrench, Bot, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ToolsViewProps {
  onAskAI?: (image: string, message: string) => void;
  isGuest?: boolean;
}

const ToolsView = ({ onAskAI, isGuest }: ToolsViewProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Manual Tools Section */}
      <div className="flex items-center gap-2 px-1">
        <Wrench className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Manual Tools</h2>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Timer className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Pomodoro Timer</h2>
            <p className="text-xs text-muted-foreground">Focus sessions with work/break cycles</p>
          </div>
        </div>
        <PomodoroTimer />
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Stopwatch</h2>
            <p className="text-xs text-muted-foreground">Track time with lap recording</p>
          </div>
        </div>
        <Stopwatch />
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-1.5 rounded-lg">
            <img src={breathingIcon} alt="Breathing Exercises" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Breathing Exercises</h2>
            <p className="text-xs text-muted-foreground">Science-backed guided sessions to reduce anxiety & boost presence</p>
          </div>
        </div>
        <BreathingExercise />
      </div>

      {/* AI Tools Section */}
      <div className="flex items-center gap-2 px-1 mt-8">
        <Bot className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">AI Tools</h2>
      </div>
      <p className="text-xs text-muted-foreground px-1 -mt-4">AI can make mistakes. Please double check.</p>

      {isGuest ? (
        <div className="glass-card p-8 flex flex-col items-center gap-4">
          <LogIn className="h-10 w-10 text-primary/40" />
          <p className="text-sm text-muted-foreground text-center">Sign in to use AI tools</p>
          <button
            onClick={() => navigate("/auth")}
            className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      ) : (
        <>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 rounded-lg">
                <img src={physiqueIcon} alt="Physique Rater" className="h-10 w-10 object-contain" />
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
              <div className="p-1.5 rounded-lg">
                <img src={outfitIcon} alt="Outfit Rater" className="h-10 w-10 object-contain" />
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
              <div className="p-1.5 rounded-lg">
                <img src={foodIcon} alt="Food Scanner" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Food Scanner</h2>
                <p className="text-xs text-muted-foreground">Snap a meal photo → instant calorie & macro estimates</p>
              </div>
            </div>
            <FoodScanner onAskAI={onAskAI} />
          </div>
        </>
      )}
    </div>
  );
};

export default ToolsView;
