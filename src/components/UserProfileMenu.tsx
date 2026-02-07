import { User, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface UserProfileMenuProps {
  email: string;
  name?: string;
  onSignOut: () => void;
}

const UserProfileMenu = ({ email, name, onSignOut }: UserProfileMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-3"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-background border-primary/20">
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
  );
};

export default UserProfileMenu;
