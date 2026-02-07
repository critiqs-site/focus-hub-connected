interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const tabs = [
    { id: "todos", label: "Todos" },
    { id: "analytics", label: "Analytics" },
    { id: "notes", label: "Notes" },
    { id: "therapist", label: "Therapist" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
            activeTab === tab.id
              ? "bg-primary/20 text-primary border border-primary/40"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Header;
