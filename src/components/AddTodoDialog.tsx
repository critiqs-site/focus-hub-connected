import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (open && preselectedDividerId) {
      setDividerId(preselectedDividerId);
    } else if (open && !preselectedDividerId && dividers[0]) {
      setDividerId(dividers[0].id);
    }
  }, [open, preselectedDividerId, dividers]);

  const selectedDivider = dividers.find((d) => d.id === dividerId);

  const handleSubmit = () => {
    if (text.trim() && dividerId) {
      onAdd(text.trim(), dividerId, selectedIcon, description.trim() || undefined);
      setText("");
      setDescription("");
      setSelectedIcon("PersonStanding");
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

          {/* Icon Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Choose an icon</label>
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
