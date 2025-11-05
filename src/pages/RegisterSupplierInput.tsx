import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  ArrowUpCircle,
  Plus,
  Trash2,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";

const productItemSchema = z.object({
  producto: z.string().min(1, { message: "Seleccione un producto" }),
  cantidad: z.coerce.number().positive({ message: "Mayor a cero" }).int(),
  precioUnitario: z.coerce.number().min(0).optional(),
});

const formSchema = z.object({
  proveedor: z.string().min(1, { message: "Debe seleccionar un proveedor" }),
});

const mockProveedores = [
  { id: "1", nombre: "Distribuidora Norte" },
  { id: "2", nombre: "Alimentos del Sur" },
  { id: "3", nombre: "Proveedor Express" },
];

const mockProducts = [
  { id: "1", nombre: "Harina integral", codigo: "HAR001", perecible: true },
  { id: "2", nombre: "Azúcar blanca", codigo: "AZU001", perecible: false },
  { id: "3", nombre: "Aceite de oliva", codigo: "ACE001", perecible: false },
  { id: "4", nombre: "Sal de mesa", codigo: "SAL001", perecible: false },
  // Example perishable product
  { id: "5", nombre: "Leche fresca", codigo: "LEC001", perecible: true },
];

interface HistorialItem {
  id: string;
  proveedor: string;
  productos: Array<{ nombre: string; cantidad: number }>;
  fecha: Date;
  usuario: string;
}

const RegisterSupplierInput = () => {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [filteredProducts, setFilteredProducts] = useState<typeof mockProducts>(
    []
  );
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    nombre: string;
    codigo?: string;
    perecible?: boolean;
  } | null>(null);
  const [quantity, setQuantity] = useState<number | "">("");
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [addedProducts, setAddedProducts] = useState<
    Array<{
      id: string;
      nombre: string;
      cantidad: number;
      fechaVencimiento: Date | null;
      perecible?: boolean;
    }>
  >([]);
  const [duplicateConfirmation, setDuplicateConfirmation] = useState<{
    productId: string;
    productName: string;
    newQuantity: number;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proveedor: "",
    },
  });

  const handleSupplierChange = (supplierId: string) => {
    // Prevent changing supplier after products have been added
    if (addedProducts.length > 0) return;
    setSelectedSupplier(supplierId);
    setFilteredProducts(
      mockProducts.filter((p) => p.id.startsWith(supplierId))
    ); // Example filter logic
    setSelectedProduct(null);
  };

  const handleProductSelect = (productId: string) => {
    const product = filteredProducts.find((p) => p.id === productId);
    setSelectedProduct(
      product
        ? {
            id: product.id,
            nombre: product.nombre,
            codigo: product.codigo,
            perecible: (product as any).perecible,
          }
        : null
    );
    setQuantity("");
    setExpirationDate(null);
  };

  const addProduct = () => {
    if (!selectedProduct || !quantity || quantity <= 0) {
      toast.error("Debe seleccionar un producto y una cantidad válida");
      return;
    }
    const newProduct = {
      id: selectedProduct.id,
      nombre: selectedProduct.nombre,
      cantidad: Number(quantity),
      fechaVencimiento: expirationDate || null,
      perecible: selectedProduct.perecible || false,
    };

    // If product already added, show in-page confirmation to update quantity
    const existingIndex = addedProducts.findIndex(
      (p) => p.id === newProduct.id
    );
    if (existingIndex !== -1) {
      setDuplicateConfirmation({
        productId: newProduct.id,
        productName: newProduct.nombre,
        newQuantity: newProduct.cantidad,
      });
      return;
    }

    setAddedProducts((prev) => [...prev, newProduct]);
    setSelectedProduct(null);
    setQuantity("");
    setExpirationDate(null);
    toast.success("Producto agregado");
  };

  function confirmDuplicateUpdate() {
    if (!duplicateConfirmation) return;
    setAddedProducts((prev) =>
      prev.map((p) =>
        p.id === duplicateConfirmation.productId
          ? { ...p, cantidad: duplicateConfirmation.newQuantity }
          : p
      )
    );
    toast.success("Cantidad del producto actualizada");
    setDuplicateConfirmation(null);
    // reset selection
    setSelectedProduct(null);
    setQuantity("");
    setExpirationDate(null);
  }

  function cancelDuplicateUpdate() {
    setDuplicateConfirmation(null);
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const proveedor = mockProveedores.find((p) => p.id === values.proveedor);
      if (!proveedor) {
        toast.error("Proveedor no válido");
        return;
      }

      if (addedProducts.length === 0) {
        toast.error("Debe agregar al menos un producto");
        return;
      }

      const newHistorial: HistorialItem = {
        id: Date.now().toString(),
        proveedor: proveedor.nombre,
        productos: addedProducts.map((product) => ({
          nombre: product.nombre,
          cantidad: product.cantidad,
        })),
        fecha: new Date(), // Automatically set the current date and time
        usuario: "Administrador",
      };

      setHistorial((prev) => [newHistorial, ...prev]);
      toast.success("Entrada registrada correctamente");

      // Reset
      form.reset({
        proveedor: "",
      });
      setAddedProducts([]);
      setSelectedSupplier("");
    } catch (error) {
      toast.error("Error al registrar la entrada");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col">
      <div className="flex flex-1">
        <Sidebar activeSection="entradas" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold mb-2 text-foreground">
                Registrar Entrada por Proveedor
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Registre la mercadería recibida de proveedores
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 lg:ml-0 ml-14">
              {/* Formulario */}
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-primary" />
                  Registro de Entrada
                </h2>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <FormField
                      control={form.control}
                      name="proveedor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proveedor *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleSupplierChange(value);
                            }}
                            value={field.value}
                            disabled={addedProducts.length > 0}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Seleccione un proveedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover">
                              {mockProveedores.map((prov) => (
                                <SelectItem key={prov.id} value={prov.id}>
                                  {prov.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedSupplier && (
                      <div>
                        <FormLabel>Buscar Producto</FormLabel>
                        <Select
                          onValueChange={handleProductSelect}
                          value={selectedProduct?.id || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Seleccione un producto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover">
                            {filteredProducts.map((prod) => (
                              <SelectItem key={prod.id} value={prod.id}>
                                {prod.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedProduct && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border shadow-md mt-4">
                        <h3 className="text-lg font-semibold mb-2">
                          Producto seleccionado
                        </h3>
                        <p className="text-sm font-medium">
                          Nombre:{" "}
                          <span className="text-foreground">
                            {selectedProduct.nombre}
                          </span>
                        </p>
                        <FormLabel className="mt-4">Cantidad *</FormLabel>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="h-11"
                        />
                        <FormLabel className="mt-4">
                          Fecha de vencimiento (opcional)
                        </FormLabel>
                        {selectedProduct?.perecible ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-11 pl-3 text-left font-normal mt-2"
                              >
                                {expirationDate
                                  ? format(expirationDate, "PPP")
                                  : "Seleccione fecha"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 bg-popover"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={expirationDate}
                                onSelect={(date) =>
                                  setExpirationDate(date as Date)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              className="w-full h-11 pl-3 text-left font-normal mt-0"
                              disabled
                            >
                              No aplica
                            </Button>
                          </div>
                        )}
                        <Button
                          type="button"
                          className="w-full mt-4"
                          onClick={addProduct}
                        >
                          Agregar Producto
                        </Button>
                      </div>
                    )}

                    {addedProducts.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Productos Agregados
                        </h3>
                        <div className="space-y-3">
                          {addedProducts.map((product, index) => (
                            <div
                              key={index}
                              className="p-3 bg-muted/50 rounded-lg border border-border shadow-md"
                            >
                              <p className="text-sm font-medium">
                                Producto:{" "}
                                <span className="text-foreground">
                                  {product.nombre}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Cantidad: {product.cantidad}
                              </p>
                              {product.perecible ? (
                                product.fechaVencimiento ? (
                                  <p className="text-sm text-muted-foreground">
                                    Fecha de vencimiento:{" "}
                                    {format(
                                      product.fechaVencimiento as Date,
                                      "PPP"
                                    )}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Fecha de vencimiento: --
                                  </p>
                                )
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Fecha de vencimiento: No aplica
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-12">
                      Registrar Entrada
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Historial */}
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Historial de Entradas
                </h2>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {historial.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay entradas registradas
                    </p>
                  ) : (
                    historial.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-background/50 border border-border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">
                              {item.proveedor}
                            </h4>
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.productos.map((p, i) => (
                                <p key={i}>
                                  • {p.nombre}: {p.cantidad} unidades
                                </p>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(item.fecha, "dd/MM/yyyy HH:mm")} -{" "}
                              {item.usuario}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
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
    </div>
  );
};

export default RegisterSupplierInput;
