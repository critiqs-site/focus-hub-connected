interface ComingSoonProps {
  section: string;
}

const ComingSoon = ({ section }: ComingSoonProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-6">
          {section === "notes" ? "📝" : "🤖"}
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{section === "notes" ? "Notes" : "AI Assistant"}</h2>
        <p className="text-muted-foreground mb-4">Coming Soon</p>
        <div className="flex justify-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0s" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
