import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface GlassIconProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  iconClassName?: string;
}

const sizeMap = {
  sm: { tile: "w-7 h-7 rounded-lg", icon: "w-3.5 h-3.5" },
  md: { tile: "w-10 h-10 rounded-xl", icon: "w-5 h-5" },
  lg: { tile: "w-14 h-14 rounded-2xl", icon: "w-7 h-7" },
  xl: { tile: "w-20 h-20 rounded-3xl", icon: "w-10 h-10" },
};

const GlassIcon = ({ icon: Icon, size = "md", className, iconClassName }: GlassIconProps) => {
  const s = sizeMap[size];
  return (
    <span className={cn("glass-icon-tile", s.tile, className)}>
      <Icon className={cn("text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]", s.icon, iconClassName)} />
    </span>
  );
};

export default GlassIcon;