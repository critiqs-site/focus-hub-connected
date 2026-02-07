import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DIVIDER_ICONS } from "@/lib/icons";

interface AddDividerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, icon: string) => void;
}

const AddDividerDialog = ({ open, onOpenChange, onAdd }: AddDividerDialogProps) => {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(DIVIDER_ICONS[0].name);

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(name.trim(), selectedIcon);
      setName("");
      setSelectedIcon(DIVIDER_ICONS[0].name);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/20 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Divider</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Section name (e.g., Afternoon)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-secondary/50 border-primary/30 focus:border-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          <div>
            <p className="text-sm text-muted-foreground mb-3">Choose an icon:</p>
            <div className="grid grid-cols-5 gap-2">
              {DIVIDER_ICONS.map(({ name: iconName, icon: Icon, label }) => (
                <button
                  key={iconName}
                  onClick={() => setSelectedIcon(iconName)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
                    selectedIcon === iconName
                      ? "bg-primary/30 border-2 border-primary"
                      : "bg-secondary/50 border border-border hover:border-primary/50"
                  }`}
                  title={label}
                >
                  <Icon className={`h-5 w-5 ${selectedIcon === iconName ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="glass-button">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
            Add Divider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDividerDialog;
