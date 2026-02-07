import { Dumbbell } from "lucide-react";
import PhysiqueRater from "./PhysiqueRater";

const ToolsView = () => {
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
        <PhysiqueRater />
      </div>
    </div>
  );
};

export default ToolsView;
