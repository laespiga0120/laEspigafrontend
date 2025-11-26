import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { History, ArrowUpCircle, ArrowDownCircle, Edit, Plus, Trash2, ChevronDown, ChevronUp, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

interface ProductoMovimiento {
  producto: string;
  cantidad: number;
  precioCompra?: number; // Para Entradas
  precioVenta?: number;  // Para Salidas
}

interface Movement {
  id: string;
  tipo: "Entrada" | "Salida";
  productos: ProductoMovimiento[];
  fecha: string;
  hora: string;
  responsable: string;
}

const mockMovements: Movement[] = [
  {
    id: "1",
    tipo: "Entrada",
    productos: [
      { producto: "Laptop Dell XPS 15", cantidad: 10, precioCompra: 3500 },
      { producto: "Mouse Logitech MX Master", cantidad: 15, precioCompra: 250 },
    ],
    fecha: "2025-11-10",
    hora: "09:30",
    responsable: "Carlos Mendoza",
  },
  {
    id: "2",
    tipo: "Salida",
    productos: [
      { producto: "Mouse Logitech MX Master", cantidad: 5, precioVenta: 350 },
    ],
    fecha: "2025-11-10",
    hora: "11:45",
    responsable: "Ana García",
  },
  {
    id: "3",
    tipo: "Entrada",
    productos: [
      { producto: "Teclado Mecánico Corsair", cantidad: 15, precioCompra: 400 },
      { producto: "Cable HDMI 2.1", cantidad: 30, precioCompra: 45 },
      { producto: "Monitor Samsung 27\"", cantidad: 8, precioCompra: 800 },
    ],
    fecha: "2025-11-11",
    hora: "08:15",
    responsable: "Luis Rodríguez",
  },
  {
    id: "4",
    tipo: "Salida",
    productos: [
      { producto: "Monitor Samsung 27\"", cantidad: 3, precioVenta: 1200 },
    ],
    fecha: "2025-11-11",
    hora: "14:20",
    responsable: "María López",
  },
  {
    id: "5",
    tipo: "Entrada",
    productos: [
      { producto: "Cable HDMI 2.1", cantidad: 50, precioCompra: 40 },
    ],
    fecha: "2025-11-12",
    hora: "10:00",
    responsable: "Carlos Mendoza",
  },
  {
    id: "6",
    tipo: "Salida",
    productos: [
      { producto: "Laptop Dell XPS 15", cantidad: 2, precioVenta: 4500 },
      { producto: "Disco Duro Externo 2TB", cantidad: 5, precioVenta: 300 },
    ],
    fecha: "2025-11-12",
    hora: "16:30",
    responsable: "Ana García",
  },
  {
    id: "7",
    tipo: "Entrada",
    productos: [
      { producto: "Disco Duro Externo 2TB", cantidad: 20, precioCompra: 180 },
    ],
    fecha: "2025-11-13",
    hora: "09:00",
    responsable: "Luis Rodríguez",
  },
];

const mockProducts = [
  { name: "Laptop Dell XPS 15", price: 3500 },
  { name: "Mouse Logitech MX Master", price: 250 },
  { name: "Teclado Mecánico Corsair", price: 400 },
  { name: "Monitor Samsung 27\"", price: 800 },
  { name: "Cable HDMI 2.1", price: 45 },
  { name: "Disco Duro Externo 2TB", price: 180 },
];

const mockUsers = [
  { id: "1", name: "Carlos Mendoza", role: "ADMINISTRADOR" },
  { id: "2", name: "Ana García", role: "VENDEDOR" },
  { id: "3", name: "Luis Rodríguez", role: "ADMINISTRADOR" },
  { id: "4", name: "María López", role: "VENDEDOR" },
];

const Movements = () => {
  const { toast } = useToast();
  const [movements, setMovements] = useState<Movement[]>(mockMovements);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState<string>("todos");

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [editFormData, setEditFormData] = useState<Movement | null>(null);

  // New Product State for Edit Modal
  const [newProductSelection, setNewProductSelection] = useState<string>("");
  const [newProductQuantity, setNewProductQuantity] = useState<string>("");

  // Confirmation Dialogs State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<string | null>(null);
  
  const [saveConfirmationOpen, setSaveConfirmationOpen] = useState(false);
  
  const [removeProductConfirmationOpen, setRemoveProductConfirmationOpen] = useState(false);
  const [productIndexToRemove, setProductIndexToRemove] = useState<number | null>(null);

  const movimientosOrdenados = [...movements].sort((a, b) => {
    const dateA = new Date(`${a.fecha}T${a.hora}`);
    const dateB = new Date(`${b.fecha}T${b.hora}`);
    return dateB.getTime() - dateA.getTime();
  });

  const movimientosFiltrados = movimientosOrdenados.filter((mov) => {
    if (fechaDesde && mov.fecha < fechaDesde) return false;
    if (fechaHasta && mov.fecha > fechaHasta) return false;
    if (tipoMovimiento !== "todos" && mov.tipo !== tipoMovimiento) return false;

    return true;
  });

  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setTipoMovimiento("todos");

  };

  const toggleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleEditMovement = (movement: Movement) => {
    setEditingMovement(movement);
    setEditFormData(JSON.parse(JSON.stringify(movement)));
    setNewProductSelection("");
    setNewProductQuantity("");
    setEditDialogOpen(true);
  };

  const confirmSaveEdit = () => {
    setSaveConfirmationOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editFormData) return;

    setMovements(movements.map(m =>
      m.id === editFormData.id ? editFormData : m
    ));

    toast({
      title: "Movimiento actualizado",
      description: "El movimiento se ha modificado exitosamente",
    });

    setSaveConfirmationOpen(false);
    setEditDialogOpen(false);
    setEditingMovement(null);
    setEditFormData(null);
  };

  const handleAddNewProduct = () => {
    if (!editFormData || !newProductSelection || !newProductQuantity) return;

    const quantity = parseInt(newProductQuantity);
    if (isNaN(quantity) || quantity <= 0) return;

    const productData = mockProducts.find(p => p.name === newProductSelection);
    const price = productData ? productData.price : 0;

    const newProduct: ProductoMovimiento = {
      producto: newProductSelection,
      cantidad: quantity,
    };

    if (editFormData.tipo === "Entrada") {
      newProduct.precioCompra = price;
    } else {
      newProduct.precioVenta = price * 1.2; // Simulating a margin for sales
    }

    setEditFormData({
      ...editFormData,
      productos: [...editFormData.productos, newProduct]
    });

    setNewProductSelection("");
    setNewProductQuantity("");
  };

  const confirmRemoveProduct = (index: number) => {
    setProductIndexToRemove(index);
    setRemoveProductConfirmationOpen(true);
  };

  const handleRemoveProduct = () => {
    if (!editFormData || productIndexToRemove === null) return;

    setEditFormData({
      ...editFormData,
      productos: editFormData.productos.filter((_, i) => i !== productIndexToRemove)
    });

    setRemoveProductConfirmationOpen(false);
    setProductIndexToRemove(null);
  };

  const handleProductQuantityChange = (index: number, value: string) => {
    if (!editFormData) return;

    const quantity = parseInt(value);
    const newProductos = [...editFormData.productos];
    newProductos[index] = { ...newProductos[index], cantidad: isNaN(quantity) ? 0 : quantity };

    setEditFormData({
      ...editFormData,
      productos: newProductos
    });
  };

  const confirmDeleteMovement = (id: string) => {
    setMovementToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteMovement = () => {
    if (movementToDelete) {
      setMovements(movements.filter(m => m.id !== movementToDelete));
      toast({
        title: "Movimiento eliminado",
        description: "El movimiento ha sido eliminado exitosamente",
      });
      setDeleteDialogOpen(false);
      setMovementToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col">
      <div className="flex flex-1">
        <Sidebar activeSection="movimientos" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold mb-2 text-foreground">
                Historial de Movimientos
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Registro completo de entradas y salidas de inventario
              </p>
            </div>

            <div className="space-y-6 lg:ml-0 ml-14">
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                  <History className="h-5 w-5" />
                  Filtros de Búsqueda
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Fecha Desde</label>
                    <Input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Fecha Hasta</label>
                    <Input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tipo de Movimiento</label>
                    <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Entrada">Entradas</SelectItem>
                        <SelectItem value="Salida">Salidas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>


                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={limpiarFiltros}>
                    Limpiar Filtros
                  </Button>
                </div>
              </div>

              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold w-12"></TableHead>
                      <TableHead className="font-semibold">Tipo</TableHead>
                      <TableHead className="font-semibold">Productos</TableHead>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold">Hora</TableHead>
                      <TableHead className="font-semibold">Responsable</TableHead>
                      <TableHead className="text-center font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No se encontraron movimientos con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimientosFiltrados.map((movimiento) => {
                        const isExpanded = expandedRows.has(movimiento.id);
                        const hasMultipleProducts = movimiento.productos.length > 1;
                        
                        // Calculate total amount for the movement
                        const totalMonto = movimiento.productos.reduce((acc, prod) => {
                          const price = movimiento.tipo === "Entrada" ? (prod.precioCompra || 0) : (prod.precioVenta || 0);
                          return acc + (prod.cantidad * price);
                        }, 0);

                        return (
                          <>
                            <TableRow key={movimiento.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpandRow(movimiento.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {movimiento.tipo === "Entrada" ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <ArrowUpCircle className="w-4 h-4 text-primary" />
                                      </div>
                                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                        {movimiento.tipo}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                                        <ArrowDownCircle className="w-4 h-4 text-destructive" />
                                      </div>
                                      <Badge variant="destructive">
                                        {movimiento.tipo}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {hasMultipleProducts ? (
                                    <span className="text-primary">
                                      {movimiento.productos.length} productos
                                    </span>
                                  ) : (
                                    movimiento.productos[0].producto
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{new Date(movimiento.fecha).toLocaleDateString('es-ES')}</TableCell>
                              <TableCell className="text-muted-foreground">{movimiento.hora}</TableCell>
                              <TableCell className="text-muted-foreground">{movimiento.responsable}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditMovement(movimiento)}
                                    className="gap-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Modificar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => confirmDeleteMovement(movimiento.id)}
                                    className="gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Eliminar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={7} className="bg-muted/20 p-0">
                                  <div className="p-4 sm:p-6 space-y-4 animate-in fade-in-0 zoom-in-95 duration-200">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <History className="w-4 h-4 text-muted-foreground" />
                                        Detalle del Movimiento
                                      </h3>
                                      <div className="text-sm text-muted-foreground">
                                        Registrado por: <span className="font-medium text-foreground">{movimiento.responsable}</span>
                                      </div>
                                    </div>

                                    <div className="rounded-lg border border-border/50 overflow-hidden">
                                      <Table>
                                        <TableHeader className="bg-muted/50">
                                          <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">
                                              {movimiento.tipo === "Entrada" ? "Precio Compra" : "Precio Venta"}
                                            </TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody className="bg-card">
                                          {movimiento.productos.map((prod, idx) => {
                                            const price = movimiento.tipo === "Entrada" ? (prod.precioCompra || 0) : (prod.precioVenta || 0);
                                            const subtotal = prod.cantidad * price;
                                            
                                            return (
                                              <TableRow key={idx}>
                                                <TableCell className="font-medium">{prod.producto}</TableCell>
                                                <TableCell className="text-right">{prod.cantidad}</TableCell>
                                                <TableCell className="text-right">S/ {price.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-medium">S/ {subtotal.toFixed(2)}</TableCell>
                                              </TableRow>
                                            );
                                          })}
                                          <TableRow className="bg-muted/30 font-bold">
                                            <TableCell colSpan={3} className="text-right">Total General:</TableCell>
                                            <TableCell className="text-right text-primary">S/ {totalMonto.toFixed(2)}</TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <p>Total de movimientos: <span className="font-semibold text-foreground">{movimientosFiltrados.length}</span></p>
                <p>Mostrando datos de ejemplo</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Dialog para editar movimiento */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modificar Movimiento</DialogTitle>
          </DialogHeader>

          {editFormData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tipo">Tipo de Movimiento *</Label>
                  <Select
                    value={editFormData.tipo}
                    onValueChange={(value: "Entrada" | "Salida") =>
                      setEditFormData({ ...editFormData, tipo: value })
                    }
                  >
                    <SelectTrigger id="edit-tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrada">Entrada</SelectItem>
                      <SelectItem value="Salida">Salida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-responsable">Responsable *</Label>
                  <Select
                    value={editFormData.responsable}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, responsable: value })
                    }
                  >
                    <SelectTrigger id="edit-responsable">
                      <SelectValue placeholder="Seleccionar responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockUsers
                        .filter((user) => {
                          if (editFormData.tipo === "Entrada") {
                            return user.role === "ADMINISTRADOR";
                          }
                          return true; // Salida shows all (Admin + Vendedor)
                        })
                        .map((user) => (
                          <SelectItem key={user.id} value={user.name}>
                            {user.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-fecha">Fecha *</Label>
                  <Input
                    id="edit-fecha"
                    type="date"
                    value={editFormData.fecha}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, fecha: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-hora">Hora *</Label>
                  <Input
                    id="edit-hora"
                    type="time"
                    value={editFormData.hora}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, hora: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Agregar Producto</Label>
                <div className="flex gap-2 items-end bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs text-muted-foreground">Producto</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !newProductSelection && "text-muted-foreground"
                          )}
                        >
                          {newProductSelection
                            ? mockProducts.find(
                                (product) => product.name === newProductSelection
                              )?.name
                            : "Seleccionar producto"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar producto..." />
                          <CommandList>
                            <CommandEmpty>No se encontró el producto.</CommandEmpty>
                            <CommandGroup>
                              {mockProducts.map((product) => (
                                <CommandItem
                                  key={product.name}
                                  value={product.name}
                                  onSelect={(currentValue) => {
                                    setNewProductSelection(
                                      currentValue === newProductSelection ? "" : currentValue
                                    );
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newProductSelection === product.name
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {product.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="w-32 space-y-2">
                    <Label className="text-xs text-muted-foreground">Cantidad</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="1"
                      value={newProductQuantity}
                      onChange={(e) => setNewProductQuantity(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddNewProduct}
                    disabled={!newProductSelection || !newProductQuantity || parseInt(newProductQuantity) <= 0}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>

                <Label className="mt-4 block">Lista de Productos</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {editFormData.productos.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
                      No hay productos en este movimiento
                    </div>
                  ) : (
                    editFormData.productos.map((prod, index) => (
                      <div key={index} className="flex gap-2 items-center p-3 bg-card rounded-lg border border-border/50 shadow-sm">
                        <div className="flex-1">
                          <span className="font-medium text-sm">{prod.producto}</span>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            placeholder="Cantidad"
                            min="1"
                            value={prod.cantidad || ""}
                            onChange={(e) =>
                              handleProductQuantityChange(index, e.target.value)
                            }
                            className="h-9"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => confirmRemoveProduct(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmSaveEdit} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación de movimiento */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar el movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El movimiento será eliminado permanentemente del historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMovement} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmación de guardar cambios */}
      <AlertDialog open={saveConfirmationOpen} onOpenChange={setSaveConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Guardar cambios en el movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se actualizará la información del movimiento y sus productos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>
              Guardar Cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmación de eliminar producto de la lista */}
      <AlertDialog open={removeProductConfirmationOpen} onOpenChange={setRemoveProductConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto del movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              El producto será eliminado de la lista de este movimiento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="container mx-auto px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>La Espiga © 2025 - Sistema de gestión para abarrotes y postres</p>
      </footer>
    </div>
  );
};

export default Movements;
