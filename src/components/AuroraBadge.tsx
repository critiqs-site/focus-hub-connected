import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { isRevampActive, clearRevamp } from "@/lib/revampTheme";

const AuroraBadge = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isRevampActive());
  }, []);

  if (!active) return null;

  return (
    <div className="fixed top-3 left-3 z-[60] flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium aurora-badge group">
      <Sparkles className="w-3 h-3" />
      <span>Aurora</span>
      <button
        onClick={() => { clearRevamp(); setActive(false); window.location.reload(); }}
        className="ml-0.5 opacity-60 hover:opacity-100"
        title="Disable Aurora"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default AuroraBadge;
