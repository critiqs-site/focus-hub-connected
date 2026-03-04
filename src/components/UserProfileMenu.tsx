import { User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfileMenuProps {
  email: string;
  name?: string;
  onSignOut: () => void;
}

const UserProfileMenu = ({ email, name, onSignOut }: UserProfileMenuProps) => {
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-12 h-12 rounded-full bg-secondary border border-border shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200">
            <User className="w-5 h-5 text-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-64 bg-background border-primary/20 mb-2">
          <div className="px-3 py-3">
            {name && (
              <p className="font-semibold text-foreground">{name}</p>
            )}
            <p className="text-sm text-muted-foreground truncate">{email}</p>
          </div>
          <DropdownMenuSeparator className="bg-primary/10" />
          <DropdownMenuItem
            onClick={onSignOut}
            className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfileMenu;
