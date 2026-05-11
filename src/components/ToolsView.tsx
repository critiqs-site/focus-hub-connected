import physiqueIcon from "@/assets/tools/physique.png";
import foodIcon from "@/assets/tools/food.png";
import outfitIcon from "@/assets/tools/outfit.png";
import breathingIcon from "@/assets/tools/breathing.png";
import BreathingExercise from "./BreathingExercise";
import PomodoroTimer from "./PomodoroTimer";
import Stopwatch from "./Stopwatch";
import { Timer, Clock, Wrench, Bot, Construction } from "lucide-react";

interface ToolsViewProps {
  onAskAI?: (image: string, message: string) => void;
  isGuest?: boolean;
}

const ToolsView = ({ onAskAI, isGuest }: ToolsViewProps) => {
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

      {[
        { icon: physiqueIcon, name: "Physique Rater", desc: "Upload a body photo and get an AI rating out of 10" },
        { icon: outfitIcon, name: "Outfit Rater", desc: "Upload an outfit photo → AI rates fit, color coordination, style & suggestions" },
        { icon: foodIcon, name: "Food Scanner", desc: "Snap a meal photo → instant calorie & macro estimates" },
      ].map((tool) => (
        <div key={tool.name} className="glass-card p-5 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3 opacity-60">
            <div className="p-1.5 rounded-lg">
              <img src={tool.icon} alt={tool.name} className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{tool.name}</h2>
              <p className="text-xs text-muted-foreground">{tool.desc}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 py-6 rounded-xl border border-dashed border-primary/30 bg-primary/5">
            <Construction className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-primary tracking-wide uppercase">Under Construction</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToolsView;
