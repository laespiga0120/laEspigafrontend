import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface HeaderProps {
  userName: string;
}

const Header = ({ userName }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/auth");
  };

  return (
    <header className="bg-gradient-to-r from-card/95 to-secondary/80 backdrop-blur-xl border-b border-border/50 shadow-md">
      <div className="container mx-auto px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-primary/30">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Usuario</p>
            <h1 className="text-lg font-bold text-foreground">
              {userName}
            </h1>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
};

export default Header;
