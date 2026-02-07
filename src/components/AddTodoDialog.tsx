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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Divider } from "@/types/todo";
import { TODO_ICONS, getIconComponent } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface AddTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (text: string, dividerId: string, icon: string) => void;
  dividers: Divider[];
  preselectedDividerId?: string | null;
}

const AddTodoDialog = ({ open, onOpenChange, onAdd, dividers, preselectedDividerId }: AddTodoDialogProps) => {
  const [text, setText] = useState("");
  const [dividerId, setDividerId] = useState(preselectedDividerId || dividers[0]?.id || "");
  const [selectedIcon, setSelectedIcon] = useState("PersonStanding");

  useEffect(() => {
    if (open && preselectedDividerId) {
      setDividerId(preselectedDividerId);
    } else if (open && !preselectedDividerId && dividers[0]) {
      setDividerId(dividers[0].id);
    }
  }, [open, preselectedDividerId, dividers]);

  const handleSubmit = () => {
    if (text.trim() && dividerId) {
      onAdd(text.trim(), dividerId, selectedIcon);
      setText("");
      setSelectedIcon("PersonStanding");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/20 bg-card/95 backdrop-blur-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Habit</DialogTitle>
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

          {/* Icon Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Choose an icon</label>
            <div className="grid grid-cols-5 gap-2">
              {TODO_ICONS.map((iconItem) => {
                const IconComp = getIconComponent(iconItem.name);
                return (
                  <button
                    key={iconItem.name}
                    type="button"
                    onClick={() => setSelectedIcon(iconItem.name)}
                    className={cn(
                      "p-3 rounded-xl transition-all duration-200 flex items-center justify-center",
                      selectedIcon === iconItem.name
                        ? "bg-primary/20 border-2 border-primary orange-glow"
                        : "bg-secondary/50 border-2 border-transparent hover:border-primary/30"
                    )}
                    title={iconItem.label}
                  >
                    <IconComp className={cn(
                      "h-5 w-5 transition-colors",
                      selectedIcon === iconItem.name ? "text-primary" : "text-muted-foreground"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>

          <Select value={dividerId} onValueChange={setDividerId}>
            <SelectTrigger className="bg-secondary/50 border-primary/30">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent className="glass-card border-primary/20 bg-card/95 backdrop-blur-xl">
              {dividers.map((divider) => {
                const DividerIcon = getIconComponent(divider.icon);
                return (
                  <SelectItem key={divider.id} value={divider.id} className="hover:bg-primary/20 focus:bg-primary/20">
                    <div className="flex items-center gap-2">
                      <DividerIcon className="h-4 w-4" />
                      {divider.name}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
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
