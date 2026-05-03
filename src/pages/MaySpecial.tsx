import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyRevamp } from "@/lib/revampTheme";
import { Sparkles } from "lucide-react";

const MaySpecial = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    applyRevamp();
    const t1 = setTimeout(() => setPhase("out"), 1600);
    const t2 = setTimeout(() => navigate("/", { replace: true }), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [navigate]);

  return (
    <div className={`revamp-aurora min-h-screen flex items-center justify-center transition-opacity duration-500 ${phase === "out" ? "opacity-0" : "opacity-100"}`}>
      <div className="aurora-bg absolute inset-0 -z-10" />
      <div className="text-center px-6 animate-scale-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 aurora-ring">
          <Sparkles className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-3 aurora-text">
          Aurora Unlocked
        </h1>
        <p className="text-base md:text-lg text-white/70 tracking-wide">
          May Special · A new vibe for CRITIQS
        </p>
      </div>
    </div>
  );
};

export default MaySpecial;
