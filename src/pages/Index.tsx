import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Search, ArrowUpDown, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";
import {
  ProductService,
  ProductoInventario,
  ProductoDetalle,
  LoteDetalle,
  CategoriaFiltro,
  RepisaFiltro,
  ProductoUpdatePayload,
} from "../api/productService";
import { Skeleton } from "../components/ui/skeleton";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

type SortField =
  | "nombre"
  | "categoria"
  | "precio"
  | "stock"
  | "stockMinimo"
  | "ubicacion"
  | "proveedor";

const Index = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [userRol, setUserRol] = useState<string | null>(null);

  // Estados de Datos
  const [products, setProducts] = useState<ProductoInventario[]>([]);
  const [allCategorias, setAllCategorias] = useState<CategoriaFiltro[]>([]);
  const [allRepisas, setAllRepisas] = useState<RepisaFiltro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Filtros
  const [searchName, setSearchName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchRepisa, setSearchRepisa] = useState("");
  const [searchFila, setSearchFila] = useState("");
  const [searchColumna, setSearchColumna] = useState("");

  // Estados de Ordenamiento
  const [sortField, setSortField] = useState<SortField>("nombre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Estados de Modal Ver Detalles
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<ProductoDetalle | null>(null);
  const [isViewDetailLoading, setIsViewDetailLoading] = useState(false);

  // Estados de Modal Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductoDetalle | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados del formulario de edición
  const [editForm, setEditForm] = useState({
    nombreProducto: "",
    descripcion: "",
    idCategoria: 0,
    precio: 0,
    stockMinimo: 0,
  });

  // Errores de validación
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Efecto para autenticación
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
    } else {
      try {
        const userData = JSON.parse(user);
        if (!userData.username || !userData.id) {
          throw new Error("Datos de usuario incompletos");
        }
        setUserName(userData.username);
        setUserId(userData.id);
        setUserRol(userData.rol);
      } catch (e) {
        console.error("Error parsing user data", e);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/auth");
      }
    }
  }, [navigate]);

  // Cargar filtros
  useEffect(() => {
    const loadFiltros = async () => {
      try {
        const data = await ProductService.getFiltrosInventario();
        setAllCategorias(data.categorias || []);
        setAllRepisas(data.repisas || []);
      } catch (error) {
        console.error("Error fetching filtros:", error);
        toast.error("Error al cargar los filtros.");
      }
    };
    loadFiltros();
  }, []);

  // Cargar inventario
  const loadInventario = async () => {
    setIsLoading(true);
    try {
      const params = {
        nombre: searchName || undefined,
        categoriaId:
          selectedCategory === "Todas" ? undefined : parseInt(selectedCategory),
        repisa: searchRepisa || undefined,
        fila: searchFila ? parseInt(searchFila) : undefined,
        columna: searchColumna ? parseInt(searchColumna) : undefined,
        sortBy: sortField === "stock" ? "stockDisponible" : sortField,
        sortDir: sortDirection,
      };
      const data = await ProductService.getInventario(params);
      setProducts(data);
    } catch (error) {
      console.error("Error fetching inventario:", error);
      toast.error("Error al cargar el inventario.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInventario();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    searchName,
    selectedCategory,
    searchRepisa,
    searchFila,
    searchColumna,
    sortField,
    sortDirection,
  ]);

  // Filtros dependientes
  const repisaSeleccionada = useMemo(
    () => allRepisas.find((r) => r.codigo === searchRepisa),
    [allRepisas, searchRepisa]
  );

  const filas = useMemo(
    () =>
      repisaSeleccionada
        ? Array.from({ length: repisaSeleccionada.numeroFilas }, (_, i) =>
            (i + 1).toString()
          )
        : [],
    [repisaSeleccionada]
  );

  const columnas = useMemo(
    () =>
      repisaSeleccionada && searchFila
        ? Array.from({ length: repisaSeleccionada.numeroColumnas }, (_, i) =>
            (i + 1).toString()
          )
        : [],
    [repisaSeleccionada, searchFila]
  );

  // Manejadores
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleClearFilters = () => {
    setSearchName("");
    setSelectedCategory("Todas");
    setSearchRepisa("");
    setSearchFila("");
    setSearchColumna("");
    setSortField("nombre");
    setSortDirection("asc");
  };

  const handleVerDetalles = async (id: number) => {
    setIsViewDetailLoading(true);
    setSelectedProductDetail(null);
    try {
      const data = await ProductService.getProductoDetalle(id);
      setSelectedProductDetail(data);
    } catch (error) {
      console.error("Error fetching product detail:", error);
      toast.error("Error al cargar los detalles del producto.");
    } finally {
      setIsViewDetailLoading(false);
    }
  };

  // Abrir modal de edición
  const handleOpenEdit = async (id: number) => {
    setIsEditLoading(true);
    setEditProduct(null);
    setFormErrors({});
    setIsEditModalOpen(true);

    try {
      const data = await ProductService.getProductoDetalle(id);
      setEditProduct(data);
      setEditForm({
        nombreProducto: data.nombre,
        descripcion: data.descripcion || "",
        idCategoria: data.idCategoria,
        precio: data.precio,
        stockMinimo: data.stockMinimo,
      });
    } catch (error) {
      console.error("Error loading product for edit:", error);
      toast.error("Error al cargar el producto para editar.");
      setIsEditModalOpen(false);
    } finally {
      setIsEditLoading(false);
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editForm.nombreProducto.trim()) {
      errors.nombreProducto = "El nombre es obligatorio";
    } else if (editForm.nombreProducto.length > 100) {
      errors.nombreProducto = "El nombre no debe superar 100 caracteres";
    }

    if (editForm.descripcion && editForm.descripcion.length > 500) {
      errors.descripcion = "La descripción no debe superar 500 caracteres";
    }

    if (!editForm.idCategoria || editForm.idCategoria === 0) {
      errors.idCategoria = "Debe seleccionar una categoría";
    }

    if (!editForm.precio || editForm.precio <= 0) {
      errors.precio = "El precio debe ser mayor a cero";
    }

    if (!editForm.stockMinimo || editForm.stockMinimo <= 0) {
      errors.stockMinimo = "El stock mínimo debe ser mayor a cero";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar cambios
  const handleSaveEdit = async () => {
    if (!validateForm()) {
      toast.error("Por favor corrija los errores en el formulario");
      return;
    }

    if (!editProduct) return;

    setIsSaving(true);
    try {
      const payload: ProductoUpdatePayload = {
        nombreProducto: editForm.nombreProducto.trim(),
        descripcion: editForm.descripcion.trim() || undefined,
        idCategoria: editForm.idCategoria,
        precio: editForm.precio,
        stockMinimo: editForm.stockMinimo,
      };

      await ProductService.updateProducto(editProduct.idProducto, payload);

      toast.success("Producto actualizado correctamente");
      setIsEditModalOpen(false);
      loadInventario(); // Recargar la tabla
    } catch (error: any) {
      console.error("Error updating product:", error);

      // Manejar diferentes tipos de errores
      if (error.message?.includes("Ya existe")) {
        toast.error("Ya existe otro producto con ese nombre");
      } else if (error.message?.includes("autorizado")) {
        toast.error("No tiene permisos para realizar esta acción");
      } else {
        toast.error("Error al actualizar el producto");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Renderizar tabla
  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-24 ml-auto" />
          </TableCell>
        </TableRow>
      ));
    }

    if (products.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={8}
            className="text-center py-8 text-muted-foreground"
          >
            No se encontraron productos que coincidan con los filtros
          </TableCell>
        </TableRow>
      );
    }

    return products.map((product) => (
      <TableRow
        key={product.idProducto}
        className="border-b border-border/30 hover:bg-accent/30 transition-colors"
      >
        <TableCell className="font-medium">{product.nombre}</TableCell>
        <TableCell>{product.categoria}</TableCell>
        <TableCell>{product.proveedor}</TableCell>
        <TableCell>
          {product.precio?.toLocaleString("es-PE", {
            style: "currency",
            currency: "PEN",
          })}
        </TableCell>
        <TableCell>
          <span
            className={`font-semibold ${
              product.stockDisponible < product.stockMinimo
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {product.stockDisponible}
          </span>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {product.stockMinimo}
        </TableCell>
        <TableCell>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
            {product.ubicacion}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex gap-2 justify-end">
            {/* Modal Ver Detalles */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleVerDetalles(product.idProducto)}
                >
                  Ver detalles
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-popover">
                {isViewDetailLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !selectedProductDetail ? (
                  <div className="text-center h-64 flex-col flex justify-center items-center">
                    <p className="text-destructive">
                      No se pudieron cargar los detalles.
                    </p>
                  </div>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>{selectedProductDetail.nombre}</DialogTitle>
                      <DialogDescription>
                        Información detallada del producto
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Categoría
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.categoria ?? "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Marca</p>
                        <p className="font-medium">
                          {selectedProductDetail.marca ?? "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Proveedor
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.proveedor ?? "N/A"}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-muted-foreground">
                          Descripción
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.descripcion ?? "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Precio</p>
                        <p className="font-medium">
                          {selectedProductDetail.precio?.toLocaleString(
                            "es-PE",
                            {
                              style: "currency",
                              currency: "PEN",
                            }
                          ) ?? "N/D"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Stock disponible
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.stockDisponible}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Stock mínimo
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.stockMinimo}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Ubicación
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.ubicacion}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Perecible
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.perecible ? "Sí" : "No"}
                        </p>
                      </div>
                      {selectedProductDetail.perecible && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Fecha de vencimiento (próxima)
                          </p>
                          <p className="font-medium">
                            {selectedProductDetail.fechaVencimientoProxima ??
                              "N/A"}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold mt-2">Lotes</p>
                      {selectedProductDetail.lotes &&
                      selectedProductDetail.lotes.length > 0 ? (
                        <div className="mt-2 border rounded-md divide-y max-h-32 overflow-y-auto">
                          {selectedProductDetail.lotes.map((l: LoteDetalle) => (
                            <div
                              key={l.codigoLote}
                              className="p-2 text-sm flex items-center justify-between"
                            >
                              <span className="text-muted-foreground">
                                {l.codigoLote}
                              </span>
                              <span>Cant.: {l.cantidad}</span>
                              {selectedProductDetail.perecible && (
                                <span className="text-muted-foreground">
                                  Vence: {l.fechaVencimiento ?? "-"}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Sin lotes registrados
                        </p>
                      )}
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* Botón Modificar */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenEdit(product.idProducto)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Modificar
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col">
      <div className="flex flex-1">
        <Sidebar activeSection="panel-principal" />
        <main className="flex-1 overflow-y-auto animate-fade-in">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            {/* Encabezado */}
            <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Inventario de Productos
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                Busca y filtra productos por nombre, categoría o ubicación
              </p>
            </div>

            {/* Filtros de búsqueda */}
            <div className="mb-6 lg:ml-0 ml-14">
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Buscar por nombre
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nombre del producto..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Categoría
                    </label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todas">Todas</SelectItem>
                        {allCategorias.map((cat) => (
                          <SelectItem
                            key={cat.idCategoria}
                            value={cat.idCategoria.toString()}
                          >
                            {cat.nombreCategoria} ({cat.cantidadProductos})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Repisa
                    </label>
                    <Select
                      value={searchRepisa}
                      onValueChange={(v) => {
                        setSearchRepisa(v === "__all__" ? "" : v);
                        setSearchFila("");
                        setSearchColumna("");
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar repisa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        {allRepisas.map((r) => (
                          <SelectItem key={r.idRepisa} value={r.codigo}>
                            {r.codigo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Fila
                    </label>
                    <Select
                      value={searchFila}
                      onValueChange={(v) => {
                        setSearchFila(v === "__all__" ? "" : v);
                        setSearchColumna("");
                      }}
                    >
                      <SelectTrigger className="h-11" disabled={!searchRepisa}>
                        <SelectValue placeholder="Seleccionar fila" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        {filas.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Columna
                    </label>
                    <Select
                      value={searchColumna}
                      onValueChange={(v) => {
                        setSearchColumna(v === "__all__" ? "" : v);
                      }}
                    >
                      <SelectTrigger
                        className="h-11"
                        disabled={!searchRepisa || !searchFila}
                      >
                        <SelectValue placeholder="Seleccionar columna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        {columnas.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabla de productos */}
            <div className="lg:ml-0 ml-14">
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/50 bg-muted/50">
                        <TableHead className="font-bold">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("nombre")}
                            className="flex items-center gap-2 hover:bg-accent/60 h-auto p-2"
                          >
                            Nombre
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-bold">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("categoria")}
                            className="flex items-center gap-2 hover:bg-accent/60 h-auto p-2"
                          >
                            Categoría
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-bold">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("proveedor")}
                            className="flex items-center gap-2 hover:bg-accent/60 h-auto p-2"
                          >
                            Proveedor
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-bold">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("precio")}
                            className="flex items-center gap-2 hover:bg-accent/60 h-auto p-2"
                          >
                            Precio
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-bold">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("stock")}
                            className="flex items-center gap-2 hover:bg-accent/60 h-auto p-2"
                          >
                            Stock Disponible
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-bold">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("stockMinimo")}
                            className="flex items-center gap-2 hover:bg-accent/60 h-auto p-2"
                          >
                            Stock Mínimo
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-bold">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("ubicacion")}
                            className="flex items-center gap-2 hover:bg-accent/60 h-auto p-2"
                          >
                            Ubicación
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-bold text-right">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{renderTableBody()}</TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-popover max-h-[90vh] overflow-y-auto">
          {isEditLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !editProduct ? (
            <div className="text-center h-64 flex-col flex justify-center items-center">
              <p className="text-destructive">
                No se pudieron cargar los datos del producto.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Modificar Producto</DialogTitle>
                <DialogDescription>
                  Edita los campos modificables del producto
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Nombre del Producto */}
                <div className="space-y-2">
                  <Label htmlFor="edit-nombre">
                    Nombre del Producto{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-nombre"
                    value={editForm.nombreProducto}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        nombreProducto: e.target.value,
                      })
                    }
                    placeholder="Ej: Arroz Costeño 1kg"
                    className={
                      formErrors.nombreProducto ? "border-destructive" : ""
                    }
                  />
                  {formErrors.nombreProducto && (
                    <p className="text-sm text-destructive">
                      {formErrors.nombreProducto}
                    </p>
                  )}
                </div>

                {/* Marca (Solo lectura) */}
                <div className="space-y-2">
                  <Label htmlFor="edit-marca">Marca</Label>
                  <Input
                    id="edit-marca"
                    value={editProduct.marca || "N/A"}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este campo no es modificable
                  </p>
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="edit-descripcion">Descripción</Label>
                  <Textarea
                    id="edit-descripcion"
                    value={editForm.descripcion}
                    onChange={(e) =>
                      setEditForm({ ...editForm, descripcion: e.target.value })
                    }
                    placeholder="Descripción del producto..."
                    rows={3}
                    className={
                      formErrors.descripcion ? "border-destructive" : ""
                    }
                  />
                  {formErrors.descripcion && (
                    <p className="text-sm text-destructive">
                      {formErrors.descripcion}
                    </p>
                  )}
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                  <Label htmlFor="edit-categoria">
                    Categoría <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={editForm.idCategoria.toString()}
                    onValueChange={(v) =>
                      setEditForm({ ...editForm, idCategoria: parseInt(v) })
                    }
                  >
                    <SelectTrigger
                      id="edit-categoria"
                      className={
                        formErrors.idCategoria ? "border-destructive" : ""
                      }
                    >
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategorias.map((cat) => (
                        <SelectItem
                          key={cat.idCategoria}
                          value={cat.idCategoria.toString()}
                        >
                          {cat.nombreCategoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.idCategoria && (
                    <p className="text-sm text-destructive">
                      {formErrors.idCategoria}
                    </p>
                  )}
                </div>

                {/* Precio */}
                <div className="space-y-2">
                  <Label htmlFor="edit-precio">
                    Precio (S/) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-precio"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editForm.precio}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        precio: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className={formErrors.precio ? "border-destructive" : ""}
                  />
                  {formErrors.precio && (
                    <p className="text-sm text-destructive">
                      {formErrors.precio}
                    </p>
                  )}
                </div>

                {/* Stock Mínimo */}
                <div className="space-y-2">
                  <Label htmlFor="edit-stock-minimo">
                    Stock Mínimo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-stock-minimo"
                    type="number"
                    min="1"
                    value={editForm.stockMinimo}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        stockMinimo: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className={
                      formErrors.stockMinimo ? "border-destructive" : ""
                    }
                  />
                  {formErrors.stockMinimo && (
                    <p className="text-sm text-destructive">
                      {formErrors.stockMinimo}
                    </p>
                  )}
                </div>

                {/* Campos no modificables (información) */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Información no modificable:
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stock Disponible:</p>
                      <p className="font-medium">
                        {editProduct.stockDisponible}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ubicación:</p>
                      <p className="font-medium">{editProduct.ubicacion}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Proveedor:</p>
                      <p className="font-medium">{editProduct.proveedor}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Perecible:</p>
                      <p className="font-medium">
                        {editProduct.perecible ? "Sí" : "No"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>La Espiga © 2025 - Sistema de gestión para abarrotes y postres</p>
      </footer>
    </div>
  );
};

export default Index;
