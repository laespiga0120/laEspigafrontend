import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { useToast } from "@/components/ui/use-toast";
import { AuthService } from "@/api/authService";

const Auth = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    username: "",
    password: "",
    general: "",
  });
  const { toast } = useToast();

  // 🔹 CORRECCIÓN: Verificar si ya está autenticado al cargar la página
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      // Si ya tiene token, redirigir al home y reemplazar la historia para que no pueda volver atrás
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpiar errores previos
    setErrors({ username: "", password: "", general: "" });

    let hasErrors = false;
    const newErrors = { username: "", password: "", general: "" };

    // Validar campos vacíos
    if (!username.trim()) {
      newErrors.username = "Debe ingresar su usuario";
      hasErrors = true;
    }

    if (!password.trim()) {
      newErrors.password = "Debe ingresar su contraseña";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await AuthService.login(username, password);
      if (response.token) {
        // 🔹 NOTA: AuthService.login ya guarda el token y el user en localStorage
        // pero aquí hacemos una redirección explícita tras el éxito.
        
        toast({
          title: "Inicio de sesión exitoso",
          description: "Redirigiendo al panel principal...",
        });

        navigate("/", { replace: true }); // Redirigir al dashboard
      } else {
        setErrors({
          ...newErrors,
          general: response.message || "Error de autenticación",
        });
        toast({
          title: "Error de autenticación",
          description: response.message || "Usuario o contraseña incorrectos",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error en login:", error);

      let description = "No se pudo conectar al servidor";
      let title = "Error del servidor";

      if (error?.message) {
        const msg = error.message;
        try {
          const parsed = JSON.parse(msg);
          const serverMsg = parsed?.message || parsed?.error || "";
          if (serverMsg) {
            // Normalize common server messages about invalid credentials
            const lower = serverMsg.toLowerCase();
            if (
              lower.includes("credencial") ||
              lower.includes("credenciales") ||
              lower.includes("invalid")
            ) {
              description = "Usuario o contraseña incorrectos";
              title = "Error de autenticación";
            } else {
              description = serverMsg;
            }
          } else {
            description = msg;
          }
        } catch {
          description = msg;
        }
      }

      setErrors({ ...newErrors, general: description });
      toast({
        title,
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-accent p-4">
      <div className="w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-lg rounded-[2rem] shadow-[0_8px_40px_-12px_hsl(30,50%,66%,0.3)] p-8 space-y-6 border border-border/50">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-6">
            <div className="w-28 h-28 flex items-center justify-center">
              <img
                src={logo}
                alt="La Espiga"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-playfair font-bold text-foreground tracking-tight">
              La Espiga
            </h1>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Usuario */}
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-foreground"
              >
                Usuario
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-xl border-2 bg-background/50 backdrop-blur-sm transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(30,50%,66%,0.1)]"
              />
              {errors.username && (
                <p className="text-sm text-muted-foreground mt-1">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-2 bg-background/50 backdrop-blur-sm transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(30,50%,66%,0.1)]"
              />
              {errors.password && (
                <p className="text-sm text-muted-foreground mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Error general */}
            {errors.general && (
              <div className="text-center">
                <p className="text-sm text-destructive bg-destructive/10 py-2 px-4 rounded-lg">
                  {errors.general}
                </p>
              </div>
            )}

            {/* Botón Iniciar Sesión */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              Iniciar sesión
            </Button>

            {/* Enlace Olvidó su contraseña */}
            <div className="text-center">
              <Link
                to="#"
                onClick={(e) => {
                    e.preventDefault();
                    alert("Contacte al administrador para restablecer su contraseña.")
                }}
                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              >
                ¿Olvidó su contraseña?
              </Link>
            </div>
          </form>
        </div>

        {/* Texto inferior */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Sistema de gestión para abarrotes y postres
        </p>
      </div>
    </div>
  );
};

export default Auth;