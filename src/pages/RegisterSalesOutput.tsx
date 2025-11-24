import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { ArrowDownCircle, Package, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MovimientoService,
  ProductoBusqueda,
  RegistroSalidaPayload,
  MovimientoHistorialSalida,
} from "@/api/movimientoService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- ESQUEMA DEL FORMULARIO ---
const formSchema = z.object({
  producto: z.string().optional(),
  cantidad: z.coerce
    .number()
    .positive({ message: "La cantidad debe ser mayor a cero" })
    .int({ message: "Debe ser un número entero" })
    .optional(),
  motivo: z.string().min(1, { message: "Debe seleccionar un motivo" }),
});

// --- INTERFAZ LOCAL ---
interface ProductoAgregado {
  id: number;
  nombre: string;
  cantidad: number;
  stock: number; // Stock real (de lotes) al momento de agregar
  precioVenta: number;
}

// --- (FIX 1) COMPONENTE DE BÚSQUEDA EXTRAÍDO ---
// Movido fuera del componente principal para evitar pérdida de foco.
interface ProductSearchProps {
  field: any; // de react-hook-form
  query: string;
  setQuery: (query: string) => void;
  suggestions: ProductoBusqueda[] | undefined;
  isLoading: boolean;
  isLocked: boolean;
  onSelectProduct: (product: ProductoBusqueda) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  field,
  query,
  setQuery,
  suggestions,
  isLoading,
  isLocked,
  onSelectProduct,
}) => {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  function selectProduct(product: ProductoBusqueda) {
    field.onChange(product.idProducto.toString());
    onSelectProduct(product);
    setQuery(""); // (FIX 3) Limpiar input después de seleccionar
    setOpen(false);
  }

  return (
    <FormItem ref={containerRef}>
      <FormLabel>Producto *</FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            className="h-11"
            placeholder="Buscar producto por nombre"
            value={query}
            onFocus={() => {
              setOpen(true); // (FIX 2) Abrir al hacer foco
              // El useQuery se activará solo con el 'query'
            }}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              field.onChange(value);
              setOpen(true);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (!open || !suggestions) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightIndex((i) =>
                  Math.min(i + 1, suggestions.length - 1)
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (highlightIndex >= 0 && suggestions[highlightIndex]) {
                  selectProduct(suggestions[highlightIndex]);
                }
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            disabled={isLocked}
          />

          {open && (suggestions || isLoading) && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-auto">
              {isLoading && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  Buscando...
                </div>
              )}
              {!isLoading && !suggestions?.length && query && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  No se encontraron productos.
                </div>
              )}
              {!isLoading && !suggestions?.length && !query && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  Escriba para buscar...
                </div>
              )}
              {suggestions?.map((p, idx) => (
                <div
                  key={p.idProducto}
                  className={`px-3 py-2 cursor-pointer hover:bg-accent/30 ${
                    idx === highlightIndex ? "bg-accent/40" : ""
                  }`}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    selectProduct(p);
                  }}
                >
                  <div className="flex justify-between">
                    <div className="font-medium">{p.nombreProducto}</div>
                    <div className="text-xs text-muted-foreground">
                      Stock: {p.stock} {/* <-- VIENE DEL CÁLCULO DE LOTES */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

// --- COMPONENTE PRINCIPAL ---
const RegisterSalesOutput = () => {
  const [customMotivo, setCustomMotivo] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<ProductoAgregado[]>(
    []
  );
  const [selectedProduct, setSelectedProduct] =
    useState<ProductoBusqueda | null>(null);
  const [cantidadKey, setCantidadKey] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    productName: string;
    newQuantity: number;
  } | null>(null);
  const [query, setQuery] = useState("");

  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      producto: "",
      cantidad: undefined,
      motivo: "",
    },
  });

  // 1. Obtener Historial de Salidas
  const {
    data: historial,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useQuery({
    queryKey: ["historialSalidas"],
    queryFn: MovimientoService.obtenerHistorialSalidas,
    // (FIX 4) Desactivar refetch automático al enfocar esta query
    refetchOnWindowFocus: false,
  });

  // 2. Búsqueda de Productos
  const { data: suggestions, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["buscarProductos", query],
    // (FIX 2) Llamar al servicio incluso si el query está vacío.
    // El backend ahora maneja esto y devuelve todos los productos.
    queryFn: () => MovimientoService.buscarProductos(query),
    staleTime: 1000, // Un cache breve
  });

  // 3. Mutación para Registrar Salida
  const registrarSalidaMutation = useMutation({
    mutationFn: MovimientoService.registrarSalida,
    onSuccess: () => {
      toast.success("Salida registrada exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["historialSalidas"] });
      // Invalidar 'buscarProductos' con CUALQUIER query para refrescar el stock en todos lados
      queryClient.invalidateQueries({ queryKey: ["buscarProductos"] });

      form.reset();
      setSelectedProducts([]);
      setSelectedProduct(null);
      setCustomMotivo("");
      setQuery("");
      setIsLocked(false);
      setCantidadKey((k) => k + 1);
    },
    onError: (error: Error) => {
      // Intentar parsear el JSON de error del backend
      let errorMessage = "No se pudo conectar al servidor.";
      try {
        const errorJson = JSON.parse(error.message);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch (e) {
        errorMessage = error.message;
      }

      toast.error("Error al registrar la salida", {
        description: errorMessage,
      });
    },
  });

  const cantidad = form.watch("cantidad");
  const hasStockError =
    selectedProduct && cantidad && cantidad > selectedProduct.stock;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // ... (código existente de onSubmit, sigue igual) ...
    if (selectedProducts.length === 0) {
      toast.error("Debe agregar al menos un producto a la salida.");
      return;
    }

    const payload: RegistroSalidaPayload = {
      motivo: values.motivo === "otro" ? customMotivo : values.motivo,
      observacion: values.motivo === "otro" ? customMotivo : undefined,
      detalles: selectedProducts.map((p) => ({
        idProducto: p.id,
        cantidad: p.cantidad,
      })),
    };

    registrarSalidaMutation.mutate(payload);
  };

  function addProduct() {
    // ... (código existente de addProduct, sigue igual) ...
    if (!selectedProduct) {
      toast.error("Debe seleccionar un producto antes de agregarlo");
      return;
    }

    if (!cantidad || cantidad <= 0) {
      toast.error("Debe ingresar una cantidad válida antes de agregarlo");
      return;
    }

    if (cantidad > selectedProduct.stock) {
      toast.error(
        "La cantidad supera el stock disponible del producto seleccionado"
      );
      return;
    }

    const existingProductIndex = selectedProducts.findIndex(
      (product) => product.id === selectedProduct.idProducto
    );

    if (existingProductIndex !== -1) {
      setConfirmation({
        productName: selectedProduct.nombreProducto,
        newQuantity: cantidad,
      });
      return;
    }

    setSelectedProducts((prev) => [
      ...prev,
      {
        id: selectedProduct.idProducto,
        nombre: selectedProduct.nombreProducto,
        cantidad,
        stock: selectedProduct.stock,
        precioVenta: selectedProduct.precioVenta,
      },
    ]);

    // Resetear campos de producto
    form.setValue("producto", "");
    setSelectedProduct(null);
    setQuery(""); // Esto ya estaba, es correcto
    form.resetField("cantidad");
    form.clearErrors("cantidad");
    setCantidadKey((k) => k + 1);
  }

  function removeProduct(productId: number) {
    // ... (código existente de removeProduct, sigue igual) ...
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  }

  function confirmUpdate() {
    // ... (código existente de confirmUpdate, sigue igual) ...
    if (!confirmation) return;

    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.nombre === confirmation.productName
          ? { ...product, cantidad: confirmation.newQuantity }
          : product
      )
    );
    toast.success("Cantidad del producto actualizada");
    setConfirmation(null);
  }

  function cancelUpdate() {
    // ... (código existente de cancelUpdate, sigue igual) ...
    setConfirmation(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col">
      <div className="flex flex-1">
        <Sidebar activeSection="salidas" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold mb-2 text-foreground">
                Registrar Salida por Venta
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Registre las salidas de productos del inventario
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 lg:ml-0 ml-14">
              {/* Formulario */}
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5 text-destructive" />
                  Registro de Salida
                </h2>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <FormField
                      control={form.control}
                      name="producto"
                      render={({ field }) => (
                        // (FIX 1) Usar el componente extraído
                        <ProductSearch
                          field={field}
                          query={query}
                          setQuery={setQuery}
                          suggestions={suggestions}
                          isLoading={isLoadingProducts}
                          isLocked={isLocked}
                          onSelectProduct={setSelectedProduct}
                        />
                      )}
                    />

                    {selectedProduct && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border shadow-md">
                        <h3 className="text-lg font-semibold mb-2">
                          Producto seleccionado
                        </h3>
                        <p className="text-sm font-medium">
                          Nombre:{" "}
                          <span className="text-foreground">
                            {selectedProduct.nombreProducto}
                          </span>
                        </p>
                        <p className="text-sm font-medium">
                          Stock actual:{" "}
                          <span className="text-foreground">
                            {selectedProduct.stock} {/* <-- Stock REAL */}
                          </span>
                        </p>
                        {selectedProduct.descripcionProducto && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Descripción: {selectedProduct.descripcionProducto}
                          </p>
                        )}
                        <p className="text-sm font-medium mt-2">
                          Precio:{" "}
                          <span className="text-foreground">
                            {selectedProduct.precioVenta?.toFixed(2) ?? "N/A"}
                          </span>
                        </p>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="cantidad"
                      // ... (código existente de FormField 'cantidad', sigue igual) ...
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad a retirar *</FormLabel>
                          <FormControl>
                            <Input
                              key={cantidadKey}
                              type="number"
                              step="1"
                              className="h-11"
                              {...field}
                              disabled={!selectedProduct || isLocked}
                            />
                          </FormControl>
                          {hasStockError && (
                            <p className="text-xs text-destructive mt-1">
                              La cantidad supera el stock disponible (
                              {selectedProduct.stock})
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      className="mt-2 h-10 px-4 py-2 text-sm font-medium bg-primary text-white rounded-md self-end"
                      onClick={addProduct}
                      // ... (código existente del botón 'Agregar Producto', sigue igual) ...
                      disabled={
                        isLocked ||
                        !selectedProduct ||
                        !cantidad ||
                        cantidad <= 0 ||
                        hasStockError
                      }
                    >
                      Agregar Producto
                    </Button>

                    {selectedProducts.length > 0 && (
                      // ... (código existente del mapeo de 'selectedProducts', sigue igual) ...
                      <div className="space-y-4 mt-4">
                        {selectedProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-4 bg-muted/50 rounded-lg border border-border shadow-md flex justify-between items-center hover:shadow-lg transition-shadow"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Producto: {product.nombre}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Cantidad: {product.cantidad} | Stock:{" "}
                                {product.stock}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Precio: {product.precioVenta?.toFixed(2) ?? "N/A"}{" "}
                                | Subtotal:{" "}
                                {(
                                  product.cantidad * (product.precioVenta || 0)
                                ).toFixed(2)}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeProduct(product.id)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="motivo"
                      // ... (código existente de FormField 'motivo', sigue igual) ...
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo de salida *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Seleccione un motivo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover">
                              <SelectItem value="Venta">Venta</SelectItem>
                              <SelectItem value="Traslado Interno">
                                Traslado interno
                              </SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />

                          {field.value === "otro" && (
                            <div className="mt-4">
                              <FormLabel>Especifique el motivo</FormLabel>
                              <FormControl>
                                <Input
                                  className="h-11"
                                  placeholder="Ingrese el motivo"
                                  value={customMotivo}
                                  onChange={(e) =>
                                    setCustomMotivo(e.target.value)
                                  }
                                />
                              </FormControl>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    {form.watch("motivo") === "Venta" &&
                      selectedProducts.length > 0 && (
                        <div className="flex justify-end mt-4 text-lg font-bold">
                          Total: S/{" "}
                          {selectedProducts
                            .reduce(
                              (acc, p) => acc + p.cantidad * (p.precioVenta || 0),
                              0
                            )
                            .toFixed(2)}
                        </div>
                      )}

                    <Button
                      type="submit"
                      className="w-full h-12"
                      // ... (código existente del botón 'Registrar Salida', sigue igual) ...
                      disabled={
                        registrarSalidaMutation.isPending ||
                        selectedProducts.length === 0
                      }
                    >
                      {registrarSalidaMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Registrar Salida
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Historial */}
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Historial de Salidas
                </h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {isLoadingHistory && (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Cargando historial...
                      </p>
                    </div>
                  )}
                  {historyError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error al cargar historial</AlertTitle>
                      <AlertDescription>
                        {historyError.message ||
                          "No se pudo conectar al servidor."}
                      </AlertDescription>
                    </Alert>
                  )}
                  {!isLoadingHistory && !historial?.length && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay movimientos registrados
                    </p>
                  )}
                  {historial?.map((item) => (
                    <div
                      key={item.idMovimiento}
                      className="p-3 bg-background/50 border border-border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-destructive" />
                        </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">
                              Motivo: {item.motivo}
                            </h4>
                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                              {item.detalles.map((detalle, index) => (
                                <p key={index} className="leading-snug">
                                  • {detalle.nombreProducto}: {detalle.cantidad}{" "}
                                  und. | Precio:{" "}
                                  {detalle.precioVenta?.toFixed(2) ?? "N/A"} |
                                  Subtotal:{" "}
                                  {detalle.subtotal?.toFixed(2) ?? "N/A"}
                                </p>
                              ))}
                              <p className="font-semibold text-foreground pt-1 border-t border-border">
                                Total: S/ {item.totalGeneral?.toFixed(2) ?? "N/A"}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(
                                new Date(item.fechaMovimiento),
                                "dd/MM/yyyy HH:mm"
                              )}{" "}
                              - {item.nombreUsuario}
                            </p>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="container mx-auto px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
        La Espiga © 2025 - Sistema de gestión para abarrotes y postres
      </footer>

      {/* Diálogo de Confirmación */}
      {confirmation && (
        <AlertDialog
          open={!!confirmation}
          onOpenChange={() => setConfirmation(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Producto ya agregado</AlertDialogTitle>
              <AlertDialogDescription>
                El producto "
                <span className="font-medium">{confirmation.productName}</span>"
                ya está en la lista. ¿Desea actualizar la cantidad a{" "}
                <span className="font-medium">{confirmation.newQuantity}</span>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelUpdate}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmUpdate}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default RegisterSalesOutput;
