import { apiRequest } from "./apiClient";

// Coincide con tu ProductoDTO del backend
export interface ProductPayload {
  nombreProducto: string;
  precio: number;
  unidadMedida: string;
  idCategoria: number;
  idProveedor:number;
  stock: number;
  stockMinimo: number;
  fechaVencimiento?: string | null;
  perecible: boolean;
  marca?: string;
  descripcion?: string;
  idUbicacion: number; // Es requerido por tu DTO
}

export const ProductService = {
  // POST /api/productos/registrar
  create: (payload: ProductPayload): Promise<string> => {
    // Tu backend devuelve un string en el body, no un JSON
    return apiRequest<string>("/api/productos/registrar", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
