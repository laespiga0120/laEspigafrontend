import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";

const Index = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
    } else {
      const userData = JSON.parse(user);
      setUserName(userData.name);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col">
      {/* Layout con Sidebar */}
      <div className="flex flex-1">
        <Sidebar activeSection="panel-principal" />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto animate-fade-in">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            {/* Mensaje de bienvenida */}
            <div className="mb-6 sm:mb-8 lg:mb-10 lg:ml-0 ml-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Bienvenido, {userName}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                Panel principal del sistema
              </p>
            </div>

            {/* Panel principal limpio */}
            <div className="max-w-5xl lg:ml-0 ml-14">
              <div className="bg-gradient-to-br from-card/95 to-secondary/50 backdrop-blur-sm border-2 border-border/50 rounded-2xl lg:rounded-3xl shadow-xl p-6 sm:p-10 lg:p-16 transition-all hover:shadow-2xl hover:scale-[1.01]">
                <div className="text-center space-y-6 sm:space-y-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 mx-auto rounded-2xl lg:rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg ring-4 ring-primary/10 transition-transform hover:scale-110">
                    <div className="text-5xl sm:text-6xl lg:text-7xl">📊</div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                    Panel de Control
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base lg:text-xl max-w-2xl mx-auto leading-relaxed">
                    Bienvenido al sistema de gestión de La Espiga. 
                    Utiliza el menú lateral para acceder a las diferentes secciones del sistema.
                  </p>
                  <div className="pt-4 sm:pt-6 lg:pt-8">
                    <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-primary/10 rounded-full border-2 border-primary/20 shadow-sm hover:shadow-md transition-all hover:scale-105">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-xs sm:text-sm lg:text-base font-semibold text-primary">Sistema operativo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>La Espiga © 2025 - Sistema de gestión para abarrotes y postres</p>
      </footer>
    </div>
  );
};

export default Index;
