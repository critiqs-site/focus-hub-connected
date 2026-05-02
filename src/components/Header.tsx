interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const tabs = [
    { id: "todos", label: "Todos" },
    { id: "analytics", label: "Analytics" },
    { id: "events", label: "Schedule" },
    { id: "notebook", label: "Notebook", isNew: true },
    { id: "journal", label: "Journal" },
    { id: "tools", label: "Tools" },
  ];

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="flex gap-2 mb-6 lg:mb-8 rounded-xl p-1.5 min-w-max backdrop-blur-xl glass-card">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all duration-300 text-sm lg:text-base whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary/20 text-primary border border-primary/40"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            } ${tab.isNew && activeTab !== tab.id ? "tab-new-glow text-primary" : ""}`}
            style={
              activeTab === tab.id
                ? { boxShadow: '0 0 16px hsl(var(--primary) / 0.2)' }
                : tab.isNew
                ? { boxShadow: '0 0 14px hsl(var(--primary) / 0.45)' }
                : {}
            }
          >
            <span className="inline-flex items-center gap-1.5">
              {tab.label}
              {tab.isNew && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground tracking-wider">NEW</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Header;
