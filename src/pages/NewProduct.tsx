import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { ProductService, ProductPayload } from "../api/productService";
import { CategoryService } from "../api/categoryService";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import AssignLocationButton from "../components/AssignLocationButton";

// Esquema de validación del formulario
const formSchema = z
  .object({
    nombreProducto: z
      .string()
      .min(1, { message: "Debe ingresar un nombre para el producto" }),
    precio: z.coerce
      .number()
      .positive({ message: "El precio debe ser mayor a cero" }),
    unidadMedida: z
      .string()
      .min(1, { message: "Debe seleccionar una unidad de medida" }),
    idCategoria: z
      .string()
      .min(1, { message: "Debe seleccionar una categoría" }),
    stock: z.coerce
      .number()
      .int()
      .min(0, { message: "El stock no puede ser negativo" })
      .default(0),
    stockMinimo: z.coerce
      .number()
      .int()
      .min(0, { message: "El stock mínimo no puede ser negativo" }),
    fechaVencimiento: z.date().optional(),
    noPerecible: z.boolean().optional().default(false),
    marca: z.string().optional(),
    descripcion: z.string().optional(),
  })
  .refine(
    (data) => {
      // Si el producto no es perecible, la validación pasa.
      if (data.noPerecible) return true;
      // Si es perecible, la fecha de vencimiento es obligatoria.
      return !!data.fechaVencimiento;
    },
    {
      message:
        "La fecha de vencimiento es obligatoria para productos perecibles.",
      path: ["fechaVencimiento"],
    }
  );

const NewProduct = () => {
  // Estado para la ubicación seleccionada
  const [idUbicacion, setIdUbicacion] = useState<number | null>(null);
  const [locationText, setLocationText] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombreProducto: "",
      precio: 0,
      unidadMedida: "",
      idCategoria: "",
      stock: 0,
      stockMinimo: 0,
      fechaVencimiento: undefined,
      noPerecible: false,
      marca: "",
      descripcion: "",
    },
  });

  const noPerecible = form.watch("noPerecible");
  const [categories, setCategories] = useState<
    { id: number; nombre: string }[]
  >([]);

  // Cargar categorías al montar el componente
  useEffect(() => {
    CategoryService.list()
      .then(setCategories)
      .catch((err) => {
        console.error("Error cargando categorías:", err);
        toast.error("No se pudieron cargar las categorías.");
      });
  }, []);

  // Función callback para recibir la ubicación desde el botón/modal
  const handleLocationSelect = (id: number, displayText: string) => {
    setIdUbicacion(id);
    setLocationText(displayText);
  };

  // Función para enviar el formulario al backend
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!idUbicacion) {
      toast.error("Debe asignar una ubicación al producto.");
      return;
    }

    try {
      const payload: ProductPayload = {
        nombreProducto: values.nombreProducto,
        precio: values.precio,
        unidadMedida: values.unidadMedida,
        stock: values.stock,
        stockMinimo: values.stockMinimo,
        marca: values.marca || "",
        descripcion: values.descripcion || "",
        idCategoria: parseInt(values.idCategoria),
        fechaVencimiento: values.fechaVencimiento
          ? values.fechaVencimiento.toISOString()
          : null,
        perecible: !values.noPerecible,
        idUbicacion: idUbicacion,
      };

      const responseMessage = await ProductService.create(payload);
      toast.success(responseMessage || "Producto registrado correctamente");

      // Limpiar todo
      form.reset();
      setIdUbicacion(null);
      setLocationText("");
    } catch (error: any) {
      // Manejo de errores mejorado
      try {
        const errorData = JSON.parse(error.message);
        toast.error(
          errorData.error ||
            errorData.message ||
            "No se pudo registrar el producto."
        );
      } catch (e) {
        toast.error(error.message || "No se pudo registrar el producto.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col">
      <div className="flex flex-1">
        <Sidebar activeSection="nuevo-producto" />
        <main className="flex-1 overflow-y-auto p-8 animate-fade-in">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Registrar Nuevo Producto
              </h1>
              <p className="text-muted-foreground">
                Complete el formulario para agregar un nuevo producto
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Campos del formulario */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="nombreProducto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del producto *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: Harina integral"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="precio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unidadMedida"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad de medida *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione una unidad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                              <SelectItem value="g">Gramo (g)</SelectItem>
                              <SelectItem value="l">Litro (l)</SelectItem>
                              <SelectItem value="ml">Mililitro (ml)</SelectItem>
                              <SelectItem value="unidad">Unidad</SelectItem>
                              <SelectItem value="paquete">Paquete</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="idCategoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione una categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              placeholder="0"
                              {...field}
                            />
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
                          <FormLabel>Stock mínimo *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="marca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marca (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: La Universal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name="fechaVencimiento"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              Fecha de vencimiento {!noPerecible && "*"}
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                      noPerecible &&
                                        "opacity-60 cursor-not-allowed"
                                    )}
                                    disabled={!!noPerecible}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Seleccione una fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date() || !!noPerecible
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex-shrink-0 mt-8">
                      <FormField
                        control={form.control}
                        name="noPerecible"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <label className="inline-flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!field.value}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    field.onChange(checked);
                                    if (checked) {
                                      form.resetField("fechaVencimiento");
                                      form.clearErrors("fechaVencimiento");
                                    }
                                  }}
                                  className="h-4 w-4 text-primary border"
                                />
                                <span className="text-sm">No perecible</span>
                              </label>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción adicional del producto"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Botón para asignar ubicación */}
                  <div className="mt-2">
                    <FormLabel>Ubicación *</FormLabel>
                    <AssignLocationButton
                      onLocationSelect={handleLocationSelect}
                      selectedText={locationText}
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full">
                      Registrar Producto
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </main>
      </div>
      <footer className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <p>La Espiga © 2025 - Sistema de gestión para abarrotes y postres</p>
      </footer>
    </div>
  );
};

export default NewProduct;
