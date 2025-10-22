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
import { CalendarIcon, ArrowUpCircle, Plus, Trash2, Package } from "lucide-react";
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
  fechaEntrada: z.date(),
  productos: z.array(productItemSchema).min(1, { message: "Agregue al menos un producto" }),
});

const mockProveedores = [
  { id: "1", nombre: "Distribuidora Norte" },
  { id: "2", nombre: "Alimentos del Sur" },
  { id: "3", nombre: "Proveedor Express" },
];

const mockProducts = [
  { id: "1", nombre: "Harina integral", codigo: "HAR001" },
  { id: "2", nombre: "Azúcar blanca", codigo: "AZU001" },
  { id: "3", nombre: "Aceite de oliva", codigo: "ACE001" },
  { id: "4", nombre: "Sal de mesa", codigo: "SAL001" },
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
  const [productRows, setProductRows] = useState([{ id: "1" }]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proveedor: "",
      fechaEntrada: new Date(),
      productos: [{ producto: "", cantidad: 0, precioUnitario: undefined }],
    },
  });

  const addProductRow = () => {
    const newId = (productRows.length + 1).toString();
    setProductRows([...productRows, { id: newId }]);
    const currentProducts = form.getValues("productos");
    form.setValue("productos", [...currentProducts, { producto: "", cantidad: 0, precioUnitario: undefined }]);
  };

  const removeProductRow = (index: number) => {
    if (productRows.length === 1) {
      toast.error("Debe haber al menos un producto");
      return;
    }
    setProductRows(productRows.filter((_, i) => i !== index));
    const currentProducts = form.getValues("productos");
    form.setValue("productos", currentProducts.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const proveedor = mockProveedores.find(p => p.id === values.proveedor);
      if (!proveedor) return;

      const productosConNombre = values.productos.map(p => {
        const product = mockProducts.find(mp => mp.id === p.producto);
        return {
          nombre: product?.nombre || "",
          cantidad: p.cantidad,
        };
      });

      const newHistorial: HistorialItem = {
        id: Date.now().toString(),
        proveedor: proveedor.nombre,
        productos: productosConNombre,
        fecha: values.fechaEntrada,
        usuario: "Administrador",
      };

      setHistorial([newHistorial, ...historial]);
      toast.success("Entrada registrada correctamente");
      
      // Reset
      form.reset({
        proveedor: "",
        fechaEntrada: new Date(),
        productos: [{ producto: "", cantidad: 0, precioUnitario: undefined }],
      });
      setProductRows([{ id: "1" }]);
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
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="proveedor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proveedor *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                              <SelectItem value="nuevo" className="text-primary font-medium">
                                + Agregar nuevo proveedor
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fechaEntrada"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de entrada *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full h-11 pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Seleccione fecha</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-popover" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <FormLabel>Productos *</FormLabel>
                        <Button type="button" size="sm" variant="outline" onClick={addProductRow}>
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {productRows.map((row, index) => (
                          <div key={row.id} className="grid grid-cols-12 gap-2 p-3 bg-background/50 border border-border rounded-lg">
                            <div className="col-span-5">
                              <FormField
                                control={form.control}
                                name={`productos.${index}.producto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="h-9 text-xs">
                                          <SelectValue placeholder="Producto" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-popover">
                                        {mockProducts.map((prod) => (
                                          <SelectItem key={prod.id} value={prod.id}>
                                            {prod.nombre}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-3">
                              <FormField
                                control={form.control}
                                name={`productos.${index}.cantidad`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="Cant." 
                                        className="h-9 text-xs"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-3">
                              <FormField
                                control={form.control}
                                name={`productos.${index}.precioUnitario`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="Precio" 
                                        className="h-9 text-xs"
                                        {...field}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-1 flex items-start justify-center">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-9 w-9 p-0"
                                onClick={() => removeProductRow(index)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-12">
                      Registrar Entrada
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Historial */}
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Historial de Entradas</h2>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {historial.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay entradas registradas
                    </p>
                  ) : (
                    historial.map((item) => (
                      <div key={item.id} className="p-3 bg-background/50 border border-border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">{item.proveedor}</h4>
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.productos.map((p, i) => (
                                <p key={i}>• {p.nombre}: {p.cantidad} unidades</p>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(item.fecha, "dd/MM/yyyy")} - {item.usuario}
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
