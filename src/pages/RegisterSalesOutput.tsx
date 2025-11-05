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
// NOTE: Replaced the Select control with a searchable Input + suggestions UI
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { ArrowDownCircle, Package } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  producto: z.string().optional(), // Producto is optional if products are selected
  cantidad: z.coerce
    .number()
    .positive({ message: "La cantidad debe ser mayor a cero" })
    .int({ message: "Debe ser un número entero" })
    .optional(), // Cantidad is optional if products are selected
  motivo: z.string().min(1, { message: "Debe seleccionar un motivo" }),
});

// Mock data de productos
const mockProducts = [
  {
    id: "1",
    nombre: "Harina integral",
    codigo: "HAR001",
    stock: 50,
    descripcion: "Harina de trigo integral de alta calidad.",
  },
  {
    id: "2",
    nombre: "Azúcar blanca",
    codigo: "AZU001",
    stock: 30,
    descripcion: "Azúcar refinada ideal para postres.",
  },
  {
    id: "3",
    nombre: "Aceite de oliva",
    codigo: "ACE001",
    stock: 15,
    descripcion: "Aceite de oliva extra virgen.",
  },
  {
    id: "4",
    nombre: "Sal de mesa",
    codigo: "SAL001",
    stock: 100,
    descripcion: "Sal refinada para uso diario.",
  },
];

interface HistorialItem {
  id: string;
  producto: string;
  codigo: string;
  cantidad: number;
  motivo: string;
  fecha: Date;
  usuario: string;
}

const RegisterSalesOutput = () => {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  // Add state for custom motivo
  const [customMotivo, setCustomMotivo] = useState("");

  // Add state to manage selected products
  const [selectedProducts, setSelectedProducts] = useState<
    {
      id: string;
      nombre: string;
      cantidad: number;
      stock: number;
    }[]
  >([]);

  // key to force remount of cantidad input so it clears visually
  const [cantidadKey, setCantidadKey] = useState(0);

  // Add state to lock the search and product addition after selecting a motivo
  const [isLocked, setIsLocked] = useState(false);

  // Add state for confirmation dialog
  const [confirmation, setConfirmation] = useState<{
    productName: string;
    newQuantity: number;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      producto: "",
      cantidad: undefined, // Set cantidad to undefined by default
      motivo: "",
    },
  });

  const selectedProduct = mockProducts.find((p) => p.id === selectedProductId);
  const cantidad = form.watch("cantidad");
  const hasStockError = selectedProduct && cantidad > selectedProduct.stock;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (selectedProducts.length === 0) {
      toast.error("Debe agregar al menos un producto");
      return;
    }

    try {
      const registro: HistorialItem = {
        id: `${Date.now()}`,
        producto: JSON.stringify(
          selectedProducts.map((product) => ({
            nombre: product.nombre,
            cantidad: product.cantidad,
          }))
        ),
        codigo: selectedProducts.map((product) => product.id).join(", "),
        cantidad: selectedProducts.reduce(
          (total, product) => total + product.cantidad,
          0
        ),
        motivo: values.motivo,
        fecha: new Date(),
        usuario: "Administrador",
      };

      setHistorial((prev) => [registro, ...prev]);

      // Reset form and state
      form.reset();
      setSelectedProducts([]);
      setIsLocked(false);
    } catch (error) {
      toast.error("Error al registrar la salida");
    }
  };

  // Function to add a product to the list
  function addProduct() {
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
      (product) => product.id === selectedProduct.id
    );

    if (existingProductIndex !== -1) {
      // Show confirmation dialog instead of prompt
      setConfirmation({
        productName: selectedProduct.nombre,
        newQuantity: cantidad,
      });
      return;
    }

    setSelectedProducts((prev) => [
      ...prev,
      {
        id: selectedProduct.id,
        nombre: selectedProduct.nombre,
        cantidad,
        stock: selectedProduct.stock,
      },
    ]);

    // Reset product selection and cantidad
    form.setValue("producto", "");
    setSelectedProductId("");
    // Clear cantidad input so it appears empty for the next entry
    form.resetField("cantidad");
    form.clearErrors("cantidad");
    // force remount the input so the displayed value is cleared
    setCantidadKey((k) => k + 1);
  }

  // Function to remove a product from the list
  function removeProduct(productId: string) {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  }

  // Function to confirm update in the dialog
  function confirmUpdate() {
    if (!confirmation) return;

    const { productName, newQuantity } = confirmation;

    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.nombre === productName
          ? { ...product, cantidad: newQuantity }
          : product
      )
    );
    toast.success("Cantidad del producto actualizada");

    // Reset confirmation state
    setConfirmation(null);
  }

  // Function to cancel update in the dialog
  function cancelUpdate() {
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
                      render={({ field }) => {
                        // local state for suggestions
                        const [query, setQuery] = useState("");
                        const [suggestions, setSuggestions] = useState<
                          typeof mockProducts
                        >([]);
                        const [open, setOpen] = useState(false);
                        const [highlightIndex, setHighlightIndex] =
                          useState<number>(-1);
                        const containerRef = useRef<HTMLDivElement | null>(
                          null
                        );

                        // debounce search
                        useEffect(() => {
                          const handler = setTimeout(() => {
                            const q = query.toLowerCase();
                            if (!q) {
                              setSuggestions([]);
                              return;
                            }

                            const filtered = mockProducts.filter((p) =>
                              p.nombre.toLowerCase().includes(q)
                            );
                            setSuggestions(filtered);
                            setOpen(filtered.length > 0);
                            setHighlightIndex(-1);
                          }, 200);

                          return () => clearTimeout(handler);
                        }, [query]);

                        // click outside to close
                        useEffect(() => {
                          function onDoc(e: MouseEvent) {
                            if (!containerRef.current) return;
                            if (
                              !containerRef.current.contains(e.target as Node)
                            ) {
                              setOpen(false);
                            }
                          }
                          document.addEventListener("click", onDoc);
                          return () =>
                            document.removeEventListener("click", onDoc);
                        }, []);

                        function selectProduct(productId: string) {
                          field.onChange(productId);
                          setSelectedProductId(productId);
                          setQuery("");
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
                                    setSuggestions(mockProducts);
                                    setOpen(true);
                                  }}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setQuery(value);
                                    const filtered = mockProducts.filter((p) =>
                                      p.nombre
                                        .toLowerCase()
                                        .includes(value.toLowerCase())
                                    );
                                    setSuggestions(filtered);
                                    setOpen(true);
                                  }}
                                  onKeyDown={(
                                    e: React.KeyboardEvent<HTMLInputElement>
                                  ) => {
                                    if (!open) return;
                                    if (e.key === "ArrowDown") {
                                      e.preventDefault();
                                      setHighlightIndex((i) =>
                                        Math.min(i + 1, suggestions.length - 1)
                                      );
                                    } else if (e.key === "ArrowUp") {
                                      e.preventDefault();
                                      setHighlightIndex((i) =>
                                        Math.max(i - 1, 0)
                                      );
                                    } else if (e.key === "Enter") {
                                      e.preventDefault();
                                      if (
                                        highlightIndex >= 0 &&
                                        suggestions[highlightIndex]
                                      ) {
                                        selectProduct(
                                          suggestions[highlightIndex].id
                                        );
                                      }
                                    } else if (e.key === "Escape") {
                                      setOpen(false);
                                    }
                                  }}
                                />

                                {open && (
                                  <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-auto">
                                    {suggestions.map((p, idx) => (
                                      <div
                                        key={p.id}
                                        className={`px-3 py-2 cursor-pointer hover:bg-accent/30 ${
                                          idx === highlightIndex
                                            ? "bg-accent/40"
                                            : ""
                                        }`}
                                        onMouseDown={(ev) => {
                                          // prevent blur before click
                                          ev.preventDefault();
                                          selectProduct(p.id);
                                        }}
                                      >
                                        <div className="flex justify-between">
                                          <div className="font-medium">
                                            {p.nombre}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Stock: {p.stock}
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
                      }}
                    />

                    {selectedProduct && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border shadow-md">
                        <h3 className="text-lg font-semibold mb-2">
                          Producto seleccionado
                        </h3>
                        <p className="text-sm font-medium">
                          Nombre:{" "}
                          <span className="text-foreground">
                            {selectedProduct.nombre}
                          </span>
                        </p>
                        <p className="text-sm font-medium">
                          Stock actual:{" "}
                          <span className="text-foreground">
                            {selectedProduct.stock}
                          </span>
                        </p>
                        {selectedProduct.descripcion && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Descripción: {selectedProduct.descripcion}
                          </p>
                        )}
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="cantidad"
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
                      disabled={
                        isLocked ||
                        !selectedProduct ||
                        cantidad <= 0 ||
                        cantidad > (selectedProduct?.stock || 0)
                      }
                    >
                      Agregar Producto
                    </Button>

                    {/* Render selected products as cards */}
                    {selectedProducts.length > 0 && (
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo de salida *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Seleccione un motivo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover">
                              <SelectItem value="venta">Venta</SelectItem>
                              <SelectItem value="traslado">
                                Traslado interno
                              </SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />

                          {/* Render additional input field if 'Otro' is selected */}
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

                    <Button
                      type="submit"
                      className="w-full h-12"
                      disabled={hasStockError}
                    >
                      Registrar Salida
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Historial */}
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Historial de Movimientos
                </h2>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {historial.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay movimientos registrados
                    </p>
                  ) : (
                    historial.map((item) => {
                      const productos = JSON.parse(item.producto);
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-background/50 border border-border rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-destructive" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">
                                Productos:
                              </h4>
                              <ul className="list-disc pl-5">
                                {productos.map(
                                  (
                                    product: {
                                      nombre: string;
                                      cantidad: number;
                                    },
                                    index: number
                                  ) => (
                                    <li
                                      key={index}
                                      className="text-sm text-foreground"
                                    >
                                      {product.nombre}
                                      <p className="text-xs text-muted-foreground">
                                        Cantidad: {product.cantidad}
                                      </p>
                                    </li>
                                  )
                                )}
                              </ul>
                              <p className="text-xs text-muted-foreground mt-1">
                                Motivo: {item.motivo}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(item.fecha, "dd/MM/yyyy HH:mm")} -{" "}
                                {item.usuario}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="container mx-auto px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>La Espiga © 2025 - Sistema de gestión para abarrotes y postres</p>
      </footer>

      {confirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-center text-foreground mb-4">
              Producto ya agregado
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              El producto "
              <span className="font-medium">{confirmation.productName}</span>"
              ya está en la lista. ¿Desea actualizar la cantidad a{" "}
              <span className="font-medium">{confirmation.newQuantity}</span>?
            </p>
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                className="w-full py-2 text-sm"
                onClick={cancelUpdate}
              >
                Cancelar
              </Button>
              <Button
                variant="default" // Changed from "primary" to "default" to match valid variant types
                className="w-full py-2 text-sm"
                onClick={confirmUpdate}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterSalesOutput;
