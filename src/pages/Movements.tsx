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
import { History, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface Movement {
  id: string;
  tipo: "Entrada" | "Salida";
  producto: string;
  cantidad: number;
  fecha: string;
  hora: string;
  responsable: string;
}

const mockMovements: Movement[] = [
  {
    id: "1",
    tipo: "Entrada",
    producto: "Laptop Dell XPS 15",
    cantidad: 10,
    fecha: "2025-11-10",
    hora: "09:30",
    responsable: "Carlos Mendoza",
  },
  {
    id: "2",
    tipo: "Salida",
    producto: "Mouse Logitech MX Master",
    cantidad: 5,
    fecha: "2025-11-10",
    hora: "11:45",
    responsable: "Ana García",
  },
  {
    id: "3",
    tipo: "Entrada",
    producto: "Teclado Mecánico Corsair",
    cantidad: 15,
    fecha: "2025-11-11",
    hora: "08:15",
    responsable: "Luis Rodríguez",
  },
  {
    id: "4",
    tipo: "Salida",
    producto: "Monitor Samsung 27\"",
    cantidad: 3,
    fecha: "2025-11-11",
    hora: "14:20",
    responsable: "María López",
  },
  {
    id: "5",
    tipo: "Entrada",
    producto: "Cable HDMI 2.1",
    cantidad: 50,
    fecha: "2025-11-12",
    hora: "10:00",
    responsable: "Carlos Mendoza",
  },
  {
    id: "6",
    tipo: "Salida",
    producto: "Laptop Dell XPS 15",
    cantidad: 2,
    fecha: "2025-11-12",
    hora: "16:30",
    responsable: "Ana García",
  },
  {
    id: "7",
    tipo: "Entrada",
    producto: "Disco Duro Externo 2TB",
    cantidad: 20,
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
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState<string>("todos");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>("todos");

  const movimientosOrdenados = [...mockMovements].sort((a, b) => {
    const dateA = new Date(`${a.fecha}T${a.hora}`);
    const dateB = new Date(`${b.fecha}T${b.hora}`);
    return dateB.getTime() - dateA.getTime();
  });

  const movimientosFiltrados = movimientosOrdenados.filter((mov) => {
    if (fechaDesde && mov.fecha < fechaDesde) return false;
    if (fechaHasta && mov.fecha > fechaHasta) return false;
    if (tipoMovimiento !== "todos" && mov.tipo !== tipoMovimiento) return false;
    if (productoSeleccionado !== "todos" && mov.producto !== productoSeleccionado) return false;
    return true;
  });

  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setTipoMovimiento("todos");
    setProductoSeleccionado("todos");
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
                      <TableHead className="font-semibold">Tipo</TableHead>
                      <TableHead className="font-semibold">Producto</TableHead>
                      <TableHead className="text-center font-semibold">Cantidad</TableHead>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold">Hora</TableHead>
                      <TableHead className="font-semibold">Responsable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          No se encontraron movimientos con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimientosFiltrados.map((movimiento) => (
                        <TableRow key={movimiento.id} className="hover:bg-muted/30 transition-colors">
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
                          <TableCell className="font-medium">{movimiento.producto}</TableCell>
                          <TableCell className="text-center font-semibold">{movimiento.cantidad}</TableCell>
                          <TableCell>{new Date(movimiento.fecha).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell className="text-muted-foreground">{movimiento.hora}</TableCell>
                          <TableCell className="text-muted-foreground">{movimiento.responsable}</TableCell>
                        </TableRow>
                      ))
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
      
      <footer className="container mx-auto px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>La Espiga © 2025 - Sistema de gestión para abarrotes y postres</p>
      </footer>
    </div>
  );
};

export default Movements;