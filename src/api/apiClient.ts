// apiClient.ts - Cliente API con manejo de errores mejorado

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://laespiga-684242e27541.herokuapp.com";

// Interfaz para errores de ubicación ocupada
export interface UbicacionOcupadaError {
  error: "UBICACION_OCUPADA";
  message: string;
  idProductoOcupante: number;
  nombreProductoOcupante: string;
}

// Tipo para distinguir tipos de error
export type ApiError = UbicacionOcupadaError | { message: string };

// 🔸 Lista de endpoints que NO deben incluir token automáticamente
const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register"];

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // 🔸 CRÍTICO: Solo agregar token si NO es un endpoint público
  // Usamos el endpoint original para esta validación
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some((publicPath) =>
    endpoint.startsWith(publicPath)
  );

  if (
    token &&
    !isPublicEndpoint &&
    !options.headers?.hasOwnProperty("Authorization")
  ) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  // ✅ CORRECCIÓN DE DOBLE BARRA (//)
  // 1. Quitamos la barra final de la URL base si existe
  const cleanBaseUrl = API_BASE_URL.replace(/\/$/, "");
  // 2. Quitamos la barra inicial del endpoint si existe
  const cleanEndpoint = endpoint.replace(/^\//, "");
  // 3. Unimos con una única barra
  const finalUrl = `${cleanBaseUrl}/${cleanEndpoint}`;

  try {
    // Console log opcional para que verifiques en el navegador que la URL es correcta
    console.log("📡 Enviando petición a:", finalUrl); 

    const response = await fetch(finalUrl, config);

    // Si la respuesta es exitosa
    if (response.ok) {
      const contentType = response.headers.get("content-type");

      // Si es JSON, parsearlo
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      // Si es texto plano (como el endpoint de registro)
      return (await response.text()) as unknown as T;
    }

    // Manejo de errores
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();

      // Si es un error de ubicación ocupada, lanzar con la estructura completa
      if (errorData.error === "UBICACION_OCUPADA") {
        throw errorData as UbicacionOcupadaError;
      }

      // Otros errores con mensaje
      throw new Error(
        errorData.message || errorData.error || "Error en la solicitud"
      );
    }

    // Error de texto plano
    const errorText = await response.text();
    throw new Error(
      errorText || `Error ${response.status}: ${response.statusText}`
    );
  } catch (error: any) {
    // Si ya es un error estructurado de ubicación ocupada, relanzarlo
    if (error.error === "UBICACION_OCUPADA") {
      throw error;
    }

    // Para otros errores
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Error de conexión con el servidor");
  }
}
