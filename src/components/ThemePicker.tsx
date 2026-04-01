import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { THEMES, type ThemeConfig } from "@/hooks/useTheme";

interface ThemePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentThemeId: string;
  onSelectTheme: (id: string) => void;
}

const ThemePicker = ({ open, onOpenChange, currentThemeId, onSelectTheme }: ThemePickerProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-background border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-foreground text-center">Choose Theme</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => { onSelectTheme(theme.id); onOpenChange(false); }}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                currentThemeId === theme.id
                  ? "border-foreground shadow-lg"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
              style={{ background: theme.preview.bg }}
            >
              {currentThemeId === theme.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: theme.preview.accent }}>
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className="flex gap-1.5">
                <div className="w-8 h-8 rounded-full shadow-md" style={{ background: theme.preview.accent }} />
                <div className="w-8 h-8 rounded-full shadow-md" style={{ background: theme.preview.bg, border: '2px solid ' + (theme.isDark ? '#333' : '#ccc') }} />
              </div>
              <span className="text-xs font-medium" style={{ color: theme.isDark ? '#ccc' : '#333' }}>
                {theme.label}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemePicker;
