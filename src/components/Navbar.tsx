import { MoreHorizontal, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import logoIcon from "@/assets/logo-icon.png";

const Navbar = () => {
  const { user } = useAuth();
  const links = [
    { label: "TERMS", href: "https://critiqs.site/tos" },
    { label: "PRIVACY", href: "https://critiqs.site/privacy" },
    { label: "DONATE", href: "https://critiqs.site/donate" },
  ];

  return (
    <nav
      className="w-full backdrop-blur-2xl relative"
      style={{
        background: 'hsla(240, 8%, 8%, 0.55)',
        borderBottom: '1px solid hsl(var(--primary) / 0.18)',
        boxShadow: '0 1px 0 0 hsl(var(--primary) / 0.06), 0 8px 24px hsla(0, 0%, 0%, 0.25)',
      }}
    >
      <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 lg:px-8 h-14 lg:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logoIcon}
            alt="CRITIQS logo"
            className="h-9 lg:h-11 object-contain brightness-0 invert transition-all duration-300 group-hover:drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
          />
        </Link>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-primary/20 hover:bg-primary/5"
                aria-label="More links"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 bg-background/95 backdrop-blur-xl border-primary/20"
            >
              {links.map((link) => (
                <DropdownMenuItem key={link.label} asChild className="cursor-pointer">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium tracking-wide"
                  >
                    {link.label}
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {!user && (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30"
            >
              <UserPlus className="w-4 h-4" />
              Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
