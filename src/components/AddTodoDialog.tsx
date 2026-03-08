import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Divider } from "@/types/todo";
import { TODO_ICONS, getIconComponent } from "@/lib/icons";
import IconPickerGrid from "@/components/IconPickerGrid";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";

const DESC_MAX = 60;

interface AddTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (text: string, dividerId: string, icon: string, description?: string) => void;
  dividers: Divider[];
  preselectedDividerId?: string | null;
}

const AddTodoDialog = ({ open, onOpenChange, onAdd, dividers, preselectedDividerId }: AddTodoDialogProps) => {
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [dividerId, setDividerId] = useState(preselectedDividerId || dividers[0]?.id || "");
  const [selectedIcon, setSelectedIcon] = useState("PersonStanding");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (open && preselectedDividerId) {
      setDividerId(preselectedDividerId);
    } else if (open && !preselectedDividerId && dividers[0]) {
      setDividerId(dividers[0].id);
    }
    if (open) {
      setAiSuggestions([]);
    }
  }, [open, preselectedDividerId, dividers]);

  const selectedDivider = dividers.find((d) => d.id === dividerId);

  // Debounced AI icon suggestion
  const fetchAiIcons = useCallback(async (todoName: string) => {
    if (todoName.trim().length < 2) {
      setAiSuggestions([]);
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-icon", {
        body: { todoName: todoName.trim() },
      });
      if (!error && data?.icons?.length) {
        setAiSuggestions(data.icons);
        // Auto-select first AI suggestion
        setSelectedIcon(data.icons[0]);
      }
    } catch {
      // silently fail
    } finally {
      setAiLoading(false);
    }
  }, []);

  const handleAiSuggest = () => {
    if (text.trim().length >= 2) {
      fetchAiIcons(text);
    }
  };

  const handleSubmit = () => {
    if (text.trim() && dividerId) {
      onAdd(text.trim(), dividerId, selectedIcon, description.trim() || undefined);
      setText("");
      setDescription("");
      setSelectedIcon("PersonStanding");
      setAiSuggestions([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/20 bg-card/95 backdrop-blur-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            Add New Habit
            {selectedDivider && (
              <span className="text-sm font-normal text-muted-foreground">
                → {selectedDivider.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="What habit do you want to track?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="bg-secondary/50 border-primary/30 focus:border-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />

          {/* Short description */}
          <div className="space-y-1">
            <Input
              placeholder="Short description (optional, desktop only)"
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= DESC_MAX) setDescription(e.target.value);
              }}
              className="bg-secondary/50 border-primary/30 focus:border-primary text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/{DESC_MAX}
            </p>
          </div>

          {/* AI Suggest Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAiSuggest}
            disabled={text.trim().length < 2 || aiLoading}
            className="w-full border-primary/30 hover:border-primary hover:bg-primary/10 text-primary"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {aiLoading ? "Finding icons..." : "AI Suggest Icons"}
          </Button>

          {/* AI Suggested Icons */}
          {aiSuggestions.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                AI Suggested
              </label>
              <div className="flex gap-2">
                {aiSuggestions.map((iconName, idx) => {
                  const IconComp = getIconComponent(iconName);
                  const isSelected = selectedIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`p-3 rounded-xl transition-all duration-200 flex flex-col items-center gap-1 ${
                        isSelected
                          ? "bg-primary/20 border-2 border-primary orange-glow"
                          : "bg-secondary/50 border-2 border-primary/40 hover:border-primary/60"
                      }`}
                    >
                      <IconComp className={`h-6 w-6 ${isSelected ? "text-primary" : "text-primary/70"}`} />
                      <span className="text-[10px] text-primary font-medium">#{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Icon Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Or choose manually</label>
            <div className="max-h-48 overflow-y-auto pr-1">
              <IconPickerGrid
                icons={TODO_ICONS}
                selectedIcon={selectedIcon}
                onSelect={setSelectedIcon}
                batchSize={15}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="glass-button">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
            Add Habit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTodoDialog;
