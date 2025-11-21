import {
  FileText,
  BarChart3,
  Users,
  PackagePlus,
  Home,
  Menu,
  LogOut,
  MapPin,
  FolderOpen,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

interface SidebarProps {
  activeSection?: string;
}

const Sidebar = ({ activeSection }: SidebarProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setUserRole(user.rol || "");
      } catch (e) {
        console.error("Error leyendo usuario del storage");
      }
    }
  }, []);

  // Definir items y sus roles permitidos
  // Si allowedRoles está vacío o undefined, es accesible para todos los autenticados
  const allMenuItems = [
    {
      id: "panel-principal",
      label: "Panel Principal",
      icon: Home,
      path: "/",
      allowedRoles: ["Administrador", "Vendedor", "ADMINISTRADOR", "VENDEDOR"],
    },
    {
      id: "nuevo-producto",
      label: "Nuevo producto",
      icon: PackagePlus,
      path: "/nuevo-producto",
      allowedRoles: ["Administrador", "ADMINISTRADOR"],
    },
    {
      id: "salidas",
      label: "Registrar Salida",
      icon: ArrowDownCircle,
      path: "/salidas",
      allowedRoles: ["Administrador", "Vendedor", "ADMINISTRADOR", "VENDEDOR"],
    },
    {
      id: "entradas",
      label: "Registrar Entrada",
      icon: ArrowUpCircle,
      path: "/entradas",
      allowedRoles: ["Administrador", "ADMINISTRADOR"],
    },
    {
      id: "administrar-categorias",
      label: "Administrar Categorías",
      icon: FolderOpen,
      path: "/administrar-categorias",
      allowedRoles: ["Administrador", "ADMINISTRADOR"],
    },
    {
      id: "administrar-proveedores",
      label: "Administrar Proveedores",
      icon: Users,
      path: "/administrar-proveedores",
      allowedRoles: ["Administrador", "ADMINISTRADOR"],
    },
    {
      id: "movimientos",
      label: "Movimientos",
      icon: History,
      path: "/movimientos",
      allowedRoles: ["Administrador", "ADMINISTRADOR"],
    },
    {
      id: "reportes",
      label: "Reportes",
      icon: BarChart3,
      path: "/reportes",
      allowedRoles: ["Administrador", "ADMINISTRADOR"],
    },
    {
      id: "administrar-usuarios",
      label: "Administrar Usuarios",
      icon: Users,
      path: "/administrar-usuarios",
      allowedRoles: ["Administrador", "ADMINISTRADOR"],
    },
  ];

  // Filtrar menú basado en el rol
  const menuItems = allMenuItems.filter((item) => {
    if (!userRole) return false; // Si no hay rol cargado aún, no mostrar nada por seguridad visual
    // Normalizar comparación
    return item.allowedRoles.some(
      (r) => r.toLowerCase() === userRole.toLowerCase()
    );
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const MenuContent = () => (
    <div className="p-6 space-y-2 h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
            <span className="text-xl">🌾</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">La Espiga</h1>
            <p className="text-xs text-muted-foreground">Sistema de gestión</p>
          </div>
        </div>
      </div>

      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
        Menú Principal
      </h2>

      <div className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          const ButtonContent = (
            <>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
            </>
          );

          return (
            <Link key={item.id} to={item.path} onClick={() => setOpen(false)}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 h-11 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-accent/60 hover:translate-x-1"
                }`}
              >
                {ButtonContent}
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="pt-4 border-t border-border/50">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 h-11 text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-left">Cerrar sesión</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-card"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <MenuContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-card/80 backdrop-blur-lg border-r border-border/50 min-h-screen">
        <MenuContent />
      </aside>
    </>
  );
};

export default Sidebar;