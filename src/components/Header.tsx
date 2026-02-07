import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const tabs = [
    { id: "todos", label: "Habits", comingSoon: false },
    { id: "analytics", label: "Analytics", comingSoon: false },
    { id: "notes", label: "Notes", comingSoon: false },
    { id: "ai", label: "AI", comingSoon: false },
  ];

  return (
    <header className="glass-card px-6 py-4 mb-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-foreground">CRITI</span>
          <span className="text-primary">QS</span>
        </h1>

        <nav className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {tab.label}
              {tab.comingSoon && (
                <Badge
                  variant="outline"
                  className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 border-primary/40 text-primary"
                >
                  Soon
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
