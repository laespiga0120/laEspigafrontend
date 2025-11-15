import { apiRequest } from "./apiClient";

// Coincide con tu ProductoDTO del backend
export interface ProductPayload {
  nombreProducto: string;
  precio: number;
  unidadMedida: string;
  idCategoria: number;
  idProveedor: number;
  stock: number;
  stockMinimo: number;
  fechaVencimiento?: string | null;
  perecible: boolean;
  marca?: string;
  descripcion?: string;
  idUbicacion: number; // Es requerido por tu DTO
}

// --- NUEVA INTERFAZ ---
// Corresponde a ProductoUpdateDto
export interface ProductoUpdatePayload {
  nombreProducto: string;
  descripcion?: string;
  idCategoria: number;
  precio: number;
  stockMinimo: number;
}

export interface ProductoInventario {
  idProducto: number;
  nombre: string;
  categoria: string;
  precio: number;
  stockDisponible: number;
  stockMinimo: number;
  ubicacion: string; // Formato "A-1-2"
  proveedor: string; // <-- AÑADIDO
}

// Corresponde a LoteDetalleDto
export interface LoteDetalle {
  codigoLote: string;
  cantidad: number;
  fechaVencimiento: string | null; // "YYYY-MM-DD"
}

// Corresponde a ProductoDetalleDto
export interface ProductoDetalle {
  idProducto: number;
  nombre: string;
  categoria: string;
  marca: string;
  descripcion: string;
  precio: number;
  stockDisponible: number;
  stockMinimo: number;
  ubicacion: string;
  perecible: boolean;
  fechaVencimientoProxima: string | null; // "YYYY-MM-DD" o "N/A"
  proveedor: string; // <-- AÑADIDO
  lotes: LoteDetalle[];
}

// Corresponde a CategoriaDto
export interface CategoriaFiltro {
  idCategoria: number;
  nombreCategoria: string;
  descripcion: string;
  cantidadProductos: number;
}

// Corresponde a RepisaDetalleDto
export interface RepisaFiltro {
  idRepisa: number;
  codigo: string;
  numeroFilas: number;
  numeroColumnas: number;
}

// Corresponde a FiltrosDto
export interface FiltrosData {
  categorias: CategoriaFiltro[];
  repisas: RepisaFiltro[];
}

// --- Parámetros para getInventario ---
export interface InventarioParams {
  nombre?: string;
  categoriaId?: number;
  repisa?: string;
  fila?: number;
  columna?: number;
  sortBy?: string;
  sortDir?: string;
}

// --- Helper para construir query strings ---
const buildQueryString = (params: Record<string, any>): string => {
  const query = Object.entries(params)
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== ""
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
  return query ? `?${query}` : "";
};

export const ProductService = {
  // POST /api/productos/registrar
  create: (payload: ProductPayload): Promise<string> => {
    // Tu backend devuelve un string en el body, no un JSON
    return apiRequest<string>("/api/productos/registrar", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // --- NUEVAS FUNCIONES PARA EL PANEL DE INVENTARIO ---

  /**
   * GET /api/v1/productos/inventario
   * Obtiene la lista filtrada y ordenada de productos.
   */
  getInventario: (params: InventarioParams): Promise<ProductoInventario[]> => {
    const queryString = buildQueryString(params);
    return apiRequest<ProductoInventario[]>(
      `/api/productos/inventario${queryString}`
    );
  },

  /**
   * GET /api/v1/productos/filtros
   * Obtiene los datos para los dropdowns de filtros.
   */
  getFiltrosInventario: (): Promise<FiltrosData> => {
    return apiRequest<FiltrosData>("/api/productos/filtros");
  },

  /**
   * GET /api/v1/productos/detalles/{id}
   * Obtiene los detalles de un solo producto para el modal.
   */
  getProductoDetalle: (id: number): Promise<ProductoDetalle> => {
    return apiRequest<ProductoDetalle>(`/api/productos/detalles/${id}`);
  },

  // --- NUEVA FUNCIÓN ---
  /**
   * PUT /api/v1/productos/actualizar/{id}
   * Actualiza los datos básicos de un producto.
   */
  updateProducto: (
    id: number,
    payload: ProductoUpdatePayload
  ): Promise<ProductoDetalle> => {
    const token = localStorage.getItem("token"); // <- Necesario para endpoint seguro
    return apiRequest<ProductoDetalle>(`/api/productos/actualizar/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${token}`, // <- Enviar token
        "Content-Type": "application/json",
      },
    });
  },
};
