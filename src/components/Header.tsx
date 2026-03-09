interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const tabs = [
    { id: "todos", label: "Todos" },
    { id: "analytics", label: "Analytics" },
    { id: "events", label: "Schedule" },
    { id: "tools", label: "Tools" },
  ];

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="flex gap-2 mb-6 lg:mb-8 rounded-xl p-1.5 min-w-max backdrop-blur-xl" style={{ background: 'hsla(240, 8%, 10%, 0.5)', border: '1px solid hsla(0, 0%, 100%, 0.06)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all duration-300 text-sm lg:text-base whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary/20 text-primary border border-primary/40"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
            style={activeTab === tab.id ? { boxShadow: '0 0 16px hsla(24, 95%, 53%, 0.2)' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Header;
