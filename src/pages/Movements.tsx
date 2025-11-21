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
import { Label } from "@/components/ui/label";
import { History, ArrowUpCircle, ArrowDownCircle, Edit, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductoMovimiento {
  producto: string;
  cantidad: number;
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
      { producto: "Laptop Dell XPS 15", cantidad: 10 },
      { producto: "Mouse Logitech MX Master", cantidad: 15 },
    ],
    fecha: "2025-11-10",
    hora: "09:30",
    responsable: "Carlos Mendoza",
  },
  {
    id: "2",
    tipo: "Salida",
    productos: [
      { producto: "Mouse Logitech MX Master", cantidad: 5 },
    ],
    fecha: "2025-11-10",
    hora: "11:45",
    responsable: "Ana García",
  },
  {
    id: "3",
    tipo: "Entrada",
    productos: [
      { producto: "Teclado Mecánico Corsair", cantidad: 15 },
      { producto: "Cable HDMI 2.1", cantidad: 30 },
      { producto: "Monitor Samsung 27\"", cantidad: 8 },
    ],
    fecha: "2025-11-11",
    hora: "08:15",
    responsable: "Luis Rodríguez",
  },
  {
    id: "4",
    tipo: "Salida",
    productos: [
      { producto: "Monitor Samsung 27\"", cantidad: 3 },
    ],
    fecha: "2025-11-11",
    hora: "14:20",
    responsable: "María López",
  },
  {
    id: "5",
    tipo: "Entrada",
    productos: [
      { producto: "Cable HDMI 2.1", cantidad: 50 },
    ],
    fecha: "2025-11-12",
    hora: "10:00",
    responsable: "Carlos Mendoza",
  },
  {
    id: "6",
    tipo: "Salida",
    productos: [
      { producto: "Laptop Dell XPS 15", cantidad: 2 },
      { producto: "Disco Duro Externo 2TB", cantidad: 5 },
    ],
    fecha: "2025-11-12",
    hora: "16:30",
    responsable: "Ana García",
  },
  {
    id: "7",
    tipo: "Entrada",
    productos: [
      { producto: "Disco Duro Externo 2TB", cantidad: 20 },
    ],
    fecha: "2025-11-13",
    hora: "09:00",
    responsable: "Luis Rodríguez",
  },
];

const mockProducts = [
  "Laptop Dell XPS 15",
  "Mouse Logitech MX Master",
  "Teclado Mecánico Corsair",
  "Monitor Samsung 27\"",
  "Cable HDMI 2.1",
  "Disco Duro Externo 2TB",
];

const Movements = () => {
  const { toast } = useToast();
  const [movements, setMovements] = useState<Movement[]>(mockMovements);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState<string>("todos");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>("todos");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [editFormData, setEditFormData] = useState<Movement | null>(null);

  const movimientosOrdenados = [...movements].sort((a, b) => {
    const dateA = new Date(`${a.fecha}T${a.hora}`);
    const dateB = new Date(`${b.fecha}T${b.hora}`);
    return dateB.getTime() - dateA.getTime();
  });

  const movimientosFiltrados = movimientosOrdenados.filter((mov) => {
    if (fechaDesde && mov.fecha < fechaDesde) return false;
    if (fechaHasta && mov.fecha > fechaHasta) return false;
    if (tipoMovimiento !== "todos" && mov.tipo !== tipoMovimiento) return false;
    if (productoSeleccionado !== "todos" && !mov.productos.some(p => p.producto === productoSeleccionado)) return false;
    return true;
  });

  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setTipoMovimiento("todos");
    setProductoSeleccionado("todos");
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
    setEditDialogOpen(true);
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
    
    setEditDialogOpen(false);
    setEditingMovement(null);
    setEditFormData(null);
  };

  const handleAddProduct = () => {
    if (!editFormData) return;
    
    setEditFormData({
      ...editFormData,
      productos: [...editFormData.productos, { producto: "", cantidad: 0 }]
    });
  };

  const handleRemoveProduct = (index: number) => {
    if (!editFormData) return;
    
    setEditFormData({
      ...editFormData,
      productos: editFormData.productos.filter((_, i) => i !== index)
    });
  };

  const handleProductChange = (index: number, field: 'producto' | 'cantidad', value: string | number) => {
    if (!editFormData) return;
    
    const newProductos = [...editFormData.productos];
    newProductos[index] = { ...newProductos[index], [field]: value };
    
    setEditFormData({
      ...editFormData,
      productos: newProductos
    });
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Producto</label>
                    <Select value={productoSeleccionado} onValueChange={setProductoSeleccionado}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="todos">Todos</SelectItem>
                        {mockProducts.map((producto) => (
                          <SelectItem key={producto} value={producto}>
                            {producto}
                          </SelectItem>
                        ))}
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
                      <TableHead className="text-center font-semibold">Cantidad Total</TableHead>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold">Hora</TableHead>
                      <TableHead className="font-semibold">Responsable</TableHead>
                      <TableHead className="text-center font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          No se encontraron movimientos con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimientosFiltrados.map((movimiento) => {
                        const isExpanded = expandedRows.has(movimiento.id);
                        const totalCantidad = movimiento.productos.reduce((sum, p) => sum + p.cantidad, 0);
                        const hasMultipleProducts = movimiento.productos.length > 1;
                        
                        return (
                          <>
                            <TableRow key={movimiento.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell>
                                {hasMultipleProducts && (
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
                                )}
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
                              <TableCell className="text-center font-semibold">{totalCantidad}</TableCell>
                              <TableCell>{new Date(movimiento.fecha).toLocaleDateString('es-ES')}</TableCell>
                              <TableCell className="text-muted-foreground">{movimiento.hora}</TableCell>
                              <TableCell className="text-muted-foreground">{movimiento.responsable}</TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditMovement(movimiento)}
                                  className="gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Modificar
                                </Button>
                              </TableCell>
                            </TableRow>
                            {hasMultipleProducts && isExpanded && (
                              <TableRow>
                                <TableCell colSpan={8} className="bg-muted/20">
                                  <div className="p-4 space-y-2">
                                    <p className="text-sm font-semibold text-foreground mb-3">Detalle de productos:</p>
                                    <div className="grid gap-2">
                                      {movimiento.productos.map((prod, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-card p-3 rounded-lg border border-border/50">
                                          <span className="font-medium">{prod.producto}</span>
                                          <Badge variant="outline" className="ml-2">
                                            Cantidad: {prod.cantidad}
                                          </Badge>
                                        </div>
                                      ))}
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
                  <Input
                    id="edit-responsable"
                    value={editFormData.responsable}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, responsable: e.target.value })
                    }
                  />
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
                <div className="flex items-center justify-between">
                  <Label>Productos *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddProduct}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Producto
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {editFormData.productos.map((prod, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 bg-muted/20 rounded-lg border border-border/50">
                      <div className="flex-1 space-y-2">
                        <Select
                          value={prod.producto}
                          onValueChange={(value) => handleProductChange(index, 'producto', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockProducts.map((producto) => (
                              <SelectItem key={producto} value={producto}>
                                {producto}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          placeholder="Cantidad"
                          min="1"
                          value={prod.cantidad || ""}
                          onChange={(e) =>
                            handleProductChange(index, 'cantidad', parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveProduct(index)}
                        disabled={editFormData.productos.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="container mx-auto px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>La Espiga © 2025 - Sistema de gestión para abarrotes y postres</p>
      </footer>
    </div>
  );
};

export default Movements;
