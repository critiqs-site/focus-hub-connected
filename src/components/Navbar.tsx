import { ExternalLink } from "lucide-react";

const Navbar = () => {
  const links = [
    { label: "DOCS", href: "https://docs.critiqs.site" },
    { label: "GITHUB", href: "https://github.com/critiqs-site" },
    { label: "DONATE", href: "https://donate.critiqs.site" },
  ];

  return (
    <nav className="w-full border-b border-border/50 bg-card/30 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-foreground">CRITI</span>
          <span className="text-primary">QS</span>
        </h1>
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              {link.label}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
