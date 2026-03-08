import { useState } from "react";
import { getIconComponent } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface IconItem {
  name: string;
  icon: any;
  label: string;
}

interface IconPickerGridProps {
  icons: IconItem[];
  selectedIcon: string;
  onSelect: (name: string) => void;
  batchSize?: number;
  columns?: number;
}

const IconPickerGrid = ({ icons, selectedIcon, onSelect, batchSize = 15, columns = 5 }: IconPickerGridProps) => {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const visibleIcons = icons.slice(0, visibleCount);
  const hasMore = visibleCount < icons.length;

  return (
    <div className="space-y-2">
      <div className={cn("grid gap-2", `grid-cols-${columns}`)}>
        {visibleIcons.map((iconItem) => {
          const IconComp = getIconComponent(iconItem.name);
          return (
            <button
              key={iconItem.name}
              type="button"
              onClick={() => onSelect(iconItem.name)}
              className={cn(
                "p-3 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1",
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
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">{iconItem.label}</span>
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount(prev => Math.min(prev + batchSize, icons.length))}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary/50"
        >
          <ChevronDown className="h-3 w-3" />
          Show more ({icons.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
};

export default IconPickerGrid;
