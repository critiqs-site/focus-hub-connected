import { ExternalLink } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";

const Navbar = () => {
  const links = [
    { label: "TERMS", href: "https://critiqs.site/tos" },
    { label: "PRIVACY", href: "https://critiqs.site/privacy" },
    { label: "DONATE", href: "https://critiqs.site/donate" },
  ];

  return (
    <nav className="w-full backdrop-blur-2xl relative" style={{ background: 'hsla(240, 8%, 8%, 0.4)', borderBottom: '1px solid hsla(24, 95%, 53%, 0.08)' }}>
      <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 lg:px-8 h-14 lg:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoIcon} alt="CRITIQS logo" className="h-8 lg:h-10 object-contain brightness-0 invert" />
        </div>
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm lg:text-base font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
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
