import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// --- CORRECCIÓN DE RUTAS: Usar rutas relativas ---
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
} from "../components/ui/dialog";
import { Search, ArrowUpDown, Loader2, Pencil } from "lucide-react";
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
import { Textarea } from "../components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Label } from "../components/ui/label";
// --- FIN CORRECCIÓN DE RUTAS ---

// ... (SortField type no cambia) ...
type SortField =
  | "nombre"
  | "categoria"
  | "precio"
  | "stock"
  | "stockMinimo"
  | "ubicacion"
  | "proveedor";

// Esquema de validación (sigue SIN idProducto)
const editFormSchema = z.object({
  nombreProducto: z.string().min(1, { message: "El nombre es obligatorio." }),
  descripcion: z.string().optional(),
  idCategoria: z
    .string()
    .min(1, { message: "Debe seleccionar una categoría." }),
  precio: z.coerce
    .number()
    .positive({ message: "El precio debe ser mayor a cero." }),
  stockMinimo: z.coerce
    .number()
    .int({ message: "Debe ser un número entero." })
    .min(0, { message: "El stock mínimo no puede ser negativo." }),
});

type EditFormValues = z.infer<typeof editFormSchema>;

// Componente del Formulario de Edición
interface EditProductDialogProps {
  product: ProductoDetalle | null;
  categorias: CategoriaFiltro[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: ProductoDetalle) => void;
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({
  product,
  categorias,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  // --- CORRECCIÓN LÓGICA 1: Añadir idProducto al TIPO del formulario ---
  // Zod no lo validará, pero react-hook-form lo gestionará.
  const form = useForm<EditFormValues & { idProducto: number }>({
    resolver: zodResolver(editFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    // --- CORRECCIÓN LÓGICA 2: Añadir idProducto a los defaultValues ---
    defaultValues: {
      idProducto: 0, // <-- AÑADIDO
      nombreProducto: "",
      descripcion: "",
      idCategoria: "",
      precio: 0,
      stockMinimo: 0,
    },
  });

  // 2. Precargar el formulario cuando el producto cambie
  useEffect(() => {
    if (product && categorias.length > 0) {
      const prodCatName = (product.categoria || "").trim().toLowerCase();
      const catMatch = categorias.find(
        (c) => c.nombreCategoria.trim().toLowerCase() === prodCatName
      );

      // --- CORRECCIÓN LÓGICA 3: Añadir idProducto al form.reset ---
      form.reset({
        idProducto: product.idProducto, // <-- AÑADIDO
        nombreProducto: product.nombre,
        descripcion: product.descripcion || "",
        precio: product.precio,
        stockMinimo: product.stockMinimo,
        idCategoria: catMatch ? String(catMatch.idCategoria) : "",
      });

      form.clearErrors();
    }
  }, [product, categorias, form.reset]);

  if (!product) return null;

  // 3. Manejadores de envío
  const onInvalid = (errors: Record<string, any>) => {
    console.warn("Validación fallida al actualizar:", errors);
    const missing: string[] = [];
    if (errors["nombreProducto"]) missing.push("nombre");
    if (errors["idCategoria"]) missing.push("categoría");
    if (errors["precio"]) missing.push("precio");
    if (errors["stockMinimo"]) missing.push("stock mínimo");
    const desc = missing.length
      ? `Corrige: ${missing.join(", ")}.`
      : "Revisa los campos obligatorios.";
    toast.error("No se puede guardar", { description: desc });
  };

  // --- CORRECCIÓN LÓGICA 4: El tipo de 'values' ahora incluye idProducto ---
  const onSubmit = async (values: EditFormValues & { idProducto: number }) => {
    console.log("Enviando actualización de producto", values); // values AHORA tiene el idProducto
    setIsSaving(true);

    const payload: ProductoUpdatePayload = {
      nombreProducto: values.nombreProducto,
      descripcion: values.descripcion || undefined,
      idCategoria: parseInt(values.idCategoria),
      precio: values.precio,
      stockMinimo: values.stockMinimo,
    };

    try {
      // --- CORRECCIÓN LÓGICA 5: Usar values.idProducto (del estado del formulario) ---
      const updatedProduct = await ProductService.updateProducto(
        values.idProducto, // <-- CORREGIDO
        payload
      );
      console.log("Producto actualizado (respuesta):", updatedProduct);
      toast.success("Producto actualizado correctamente.");
      onSuccess(updatedProduct);
    } catch (error: any) {
      console.error("Error updating product:", error);
      let errorMessage = "Error desconocido al actualizar.";
      if (error instanceof Error) {
        try {
          const jsonError = JSON.parse(error.message);
          errorMessage =
            jsonError.message || jsonError.error || "Error de servidor.";
        } catch (e) {
          errorMessage = error.message;
        }
      }
      toast.error("Error al actualizar", { description: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modificar Producto</DialogTitle>
          <DialogDescription>
            Ajuste los campos permitidos del producto.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="space-y-4 py-2"
          >
            {/* ... (Campos no editables no cambian) ... */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Marca</Label>
                <Input
                  value={product.marca || "N/A"}
                  disabled
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Proveedor
                </Label>
                <Input
                  value={product.proveedor || "N/A"}
                  disabled
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Stock Disponible
                </Label>
                <Input
                  value={product.stockDisponible}
                  disabled
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Ubicación
                </Label>
                <Input
                  value={product.ubicacion || "N/A"}
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </div>

            <hr />

            {/* ... (Campos editables no cambian) ... */}
            <FormField
              control={form.control}
              name="nombreProducto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del producto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descripción..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="idCategoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem
                          key={cat.idCategoria}
                          value={String(cat.idCategoria)}
                        >
                          {cat.nombreCategoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="precio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stockMinimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                onClick={(e) => {
                  console.debug("Click en Guardar Cambios");
                }}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
// ------------------------------------------

// ... (El componente Index principal no cambia) ...
const Index = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [userRol, setUserRol] = useState<string | null>(null);

  // --- ESTADOS DE DATOS REALES ---
  const [products, setProducts] = useState<ProductoInventario[]>([]);
  const [allCategorias, setAllCategorias] = useState<CategoriaFiltro[]>([]);
  const [allRepisas, setAllRepisas] = useState<RepisaFiltro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- ESTADOS DE FILTROS ---
  const [searchName, setSearchName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchRepisa, setSearchRepisa] = useState("");
  const [searchFila, setSearchFila] = useState("");
  const [searchColumna, setSearchColumna] = useState("");

  // --- ESTADOS DE ORDENAMIENTO ---
  const [sortField, setSortField] = useState<SortField>("nombre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // --- ESTADOS DEL MODAL ---
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<ProductoDetalle | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoDetalle | null>(
    null
  );

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

  // Efecto para cargar los filtros (categorías y repisas) al montar
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

  // Efecto para cargar el inventario CADA VEZ que un filtro u orden cambie
  useEffect(() => {
    const timer = setTimeout(() => {
      loadInventario();
    }, 300); // 300ms debounce
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

  // Lógica de filtros dependientes
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

  // --- MANEJADORES ---
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

  // Carga los detalles cuando se abre el modal "Ver Detalles"
  const handleVerDetalles = async (id: number) => {
    setIsDetailLoading(true);
    setSelectedProductDetail(null);
    try {
      const data = await ProductService.getProductoDetalle(id);
      setSelectedProductDetail(data);
    } catch (error) {
      console.error("Error fetching product detail:", error);
      toast.error("Error al cargar los detalles del producto.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Carga los detalles y abre el modal de EDICIÓN
  const handleModificarClick = async (id: number) => {
    setIsDetailLoading(true);
    setEditingProduct(null);
    try {
      const data = await ProductService.getProductoDetalle(id);
      setEditingProduct(data);
    } catch (error) {
      console.error("Error fetching product detail for edit:", error);
      toast.error("Error al cargar datos para edición.");
    } finally {
      setIsDetailLoading(false);
    }
  };

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
            colSpan={8} // <-- Ajustado a 8 columnas
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
              <DialogContent className="sm:max-w-[600px]">
                {isDetailLoading ? (
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

            {(userRol === "ADMIN" || userId === 1) && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => handleModificarClick(product.idProducto)}
                disabled={isDetailLoading}
              >
                <Pencil className="h-3 w-3" />
                Modificar
              </Button>
            )}
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
                  {/* Búsqueda por nombre */}
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

                  {/* Filtro por categoría */}
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

                  {/* Filtro por repisa */}
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

                  {/* Filtro por fila (depende de repisa) */}
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

                  {/* Filtro por columna (nivel) depende de repisa y fila */}
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

                {/* Acciones de filtros */}
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

      {/* Renderizado del Modal de Edición */}
      <EditProductDialog
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        categorias={allCategorias}
        onSuccess={(updatedProduct) => {
          // Actualizar la lista de productos sin recargar toda la página
          setProducts((prev) =>
            prev.map((p) =>
              p.idProducto === updatedProduct.idProducto
                ? {
                    ...p,
                    nombre: updatedProduct.nombre,
                    categoria: updatedProduct.categoria,
                    proveedor: updatedProduct.proveedor,
                    precio: updatedProduct.precio,
                    stockMinimo: updatedProduct.stockMinimo,
                    // Actualizamos el stock disponible desde la respuesta
                    stockDisponible: updatedProduct.stockDisponible,
                  }
                : p
            )
          );
          setEditingProduct(null);
        }}
      />

      {/* Footer */}
      <footer className="container mx-auto px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>La Espiga © 2025 - Sistema de gestión para abarrotes y postres</p>
      </footer>
    </div>
  );
};

export default Index;
