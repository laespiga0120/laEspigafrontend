import { useState } from "react";
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
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { FileDown, FileSpreadsheet, ArrowUpDown, AlertTriangle } from "lucide-react";

interface Product {
  id: string;
  nombre: string;
  categoria: string;
  marca: string;
  ubicacion: { repisa: string; fila: string; nivel: string } | null;
  stock: number;
  stockMinimo: number;
}

const mockInventory: Product[] = [
  {
    id: "1",
    nombre: "Harina integral",
    categoria: "Harinas",
    marca: "La Universal",
    ubicacion: { repisa: "A", fila: "1", nivel: "2" },
    stock: 50,
    stockMinimo: 20,
  },
  {
    id: "2",
    nombre: "Azúcar blanca",
    categoria: "Endulzantes",
    marca: "Dulce Vida",
    ubicacion: { repisa: "B", fila: "3", nivel: "1" },
    stock: 15,
    stockMinimo: 25,
  },
  {
    id: "3",
    nombre: "Aceite de oliva",
    categoria: "Aceites",
    marca: "Premium",
    ubicacion: { repisa: "C", fila: "2", nivel: "3" },
    stock: 30,
    stockMinimo: 10,
  },
  {
    id: "4",
    nombre: "Sal de mesa",
    categoria: "Condimentos",
    marca: "Marina",
    ubicacion: null,
    stock: 100,
    stockMinimo: 30,
  },
];

const categorias = ["Todas", ...Array.from(new Set(mockInventory.map(p => p.categoria)))];
const marcas = ["Todas", ...Array.from(new Set(mockInventory.map(p => p.marca)))];

type SortField = "nombre" | "stock" | "categoria";

const InventoryReport = () => {
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todas");
  const [filtroMarca, setFiltroMarca] = useState<string>("Todas");
  const [filtroStockBajo, setFiltroStockBajo] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>("nombre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredInventory = mockInventory
    .filter((product) => {
      if (filtroCategoria !== "Todas" && product.categoria !== filtroCategoria) return false;
      if (filtroMarca !== "Todas" && product.marca !== filtroMarca) return false;
      if (filtroStockBajo && product.stock >= product.stockMinimo) return false;
      return true;
    })
    .sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;
      if (sortField === "stock") {
        return (a.stock - b.stock) * multiplier;
      }
      return a[sortField].localeCompare(b[sortField]) * multiplier;
    });

  const handleExportPDF = () => {
    toast.success("Exportando reporte en PDF...");
    console.log("Exportar PDF");
  };

  const handleExportExcel = () => {
    toast.success("Exportando reporte en Excel...");
    console.log("Exportar Excel");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col">
      <div className="flex flex-1">
        <Sidebar activeSection="reportes" />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold mb-2 text-foreground">
                Reporte de Inventario Actual
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Consulte el estado actual del inventario con filtros y opciones de exportación
              </p>
            </div>

            <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 lg:ml-0 ml-14">
              {/* Filtros y Exportación */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroMarca} onValueChange={setFiltroMarca}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Marca" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {marcas.map((marca) => (
                        <SelectItem key={marca} value={marca}>
                          {marca}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant={filtroStockBajo ? "default" : "outline"}
                    onClick={() => setFiltroStockBajo(!filtroStockBajo)}
                    className="h-10"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Stock bajo mínimo
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                    <FileDown className="w-4 h-4" />
                    PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportExcel} className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </Button>
                </div>
              </div>

              {/* Tabla */}
              {filteredInventory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No se encontraron productos en el inventario</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("nombre")}
                            className="font-semibold"
                          >
                            Producto
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("categoria")}
                            className="font-semibold"
                          >
                            Categoría
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("stock")}
                            className="font-semibold"
                          >
                            Stock
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>Stock Mínimo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((product) => {
                        const isBelowMin = product.stock < product.stockMinimo;
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.nombre}</TableCell>
                            <TableCell>{product.categoria}</TableCell>
                            <TableCell>{product.marca}</TableCell>
                            <TableCell>
                              {product.ubicacion ? (
                                <span className="text-sm">
                                  R{product.ubicacion.repisa}-F{product.ubicacion.fila}-N{product.ubicacion.nivel}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Sin asignar</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={isBelowMin ? "text-destructive font-semibold" : ""}>
                                {product.stock}
                              </span>
                            </TableCell>
                            <TableCell>{product.stockMinimo}</TableCell>
                            <TableCell>
                              {isBelowMin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                                  <AlertTriangle className="w-3 h-3" />
                                  Bajo
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  Normal
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-4 text-sm text-muted-foreground">
                Mostrando {filteredInventory.length} de {mockInventory.length} productos
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

export default InventoryReport;
