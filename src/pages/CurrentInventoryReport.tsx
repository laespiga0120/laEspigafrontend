import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, FileText, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Datos mock de productos con marca
const mockProducts = [
    { id: 1, nombre: "Arroz Blanco", categoria: "Granos", marca: "Costeño", stock: 150, stockMinimo: 50, ubicacion: { repisa: "A", fila: "1", nivel: "2" } },
    { id: 2, nombre: "Frijol Negro", categoria: "Granos", marca: "La Costeña", stock: 80, stockMinimo: 30, ubicacion: { repisa: "A", fila: "2", nivel: "1" } },
    { id: 3, nombre: "Aceite Vegetal", categoria: "Aceites", marca: "Primor", stock: 45, stockMinimo: 20, ubicacion: { repisa: "B", fila: "1", nivel: "3" } },
    { id: 4, nombre: "Azúcar Blanca", categoria: "Endulzantes", marca: "Cartavio", stock: 200, stockMinimo: 100, ubicacion: { repisa: "C", fila: "3", nivel: "1" } },
    { id: 5, nombre: "Sal de Mesa", categoria: "Condimentos", marca: "Emsal", stock: 120, stockMinimo: 40, ubicacion: { repisa: "C", fila: "2", nivel: "2" } },
    { id: 6, nombre: "Harina de Trigo", categoria: "Harinas", marca: "Blanca Flor", stock: 90, stockMinimo: 50, ubicacion: { repisa: "B", fila: "3", nivel: "1" } },
    { id: 7, nombre: "Pasta Corta", categoria: "Pastas", marca: "Don Vittorio", stock: 60, stockMinimo: 25, ubicacion: { repisa: "D", fila: "1", nivel: "2" } },
    { id: 8, nombre: "Leche Entera", categoria: "Lácteos", marca: "Gloria", stock: 15, stockMinimo: 20, ubicacion: { repisa: "E", fila: "2", nivel: "3" } },
];

const categorias = ["Todas", "Granos", "Aceites", "Endulzantes", "Condimentos", "Harinas", "Pastas", "Lácteos"];

type SortField = "nombre" | "categoria" | "marca" | "stock" | "stockMinimo" | "ubicacion";

const CurrentInventoryReport = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState("Todas");
    const [searchMarca, setSearchMarca] = useState("");
    const [showLowStock, setShowLowStock] = useState(false);
    const [sortField, setSortField] = useState<SortField>("nombre");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // Filtrar productos
    const filteredProducts = mockProducts.filter((product) => {
        const matchesCategory = selectedCategory === "Todas" || product.categoria === selectedCategory;
        const matchesMarca = searchMarca === "" || product.marca.toLowerCase().includes(searchMarca.toLowerCase());
        const matchesLowStock = !showLowStock || product.stock <= product.stockMinimo;

        return matchesCategory && matchesMarca && matchesLowStock;
    });

    // Ordenar productos
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortField === "ubicacion") {
            aValue = `${a.ubicacion.repisa}${a.ubicacion.fila}${a.ubicacion.nivel}`;
            bValue = `${b.ubicacion.repisa}${b.ubicacion.fila}${b.ubicacion.nivel}`;
        } else {
            aValue = a[sortField];
            bValue = b[sortField];
        }

        if (typeof aValue === "string") {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (sortDirection === "asc") {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const now = new Date();
        const dateStr = now.toLocaleDateString("es-PE", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const timeStr = now.toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
        });

        // Encabezado
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Reporte de Inventario Actual", 14, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha de emisión: ${dateStr} - ${timeStr}`, 14, 28);
        doc.text("La Espiga - Sistema de Gestión de Inventario", 14, 34);

        // Tabla
        const tableData = sortedProducts.map((product) => [
            product.nombre,
            product.categoria,
            product.marca,
            `${product.ubicacion.repisa}-${product.ubicacion.fila}-${product.ubicacion.nivel}`,
            product.stock.toString(),
            product.stockMinimo.toString(),
        ]);

        autoTable(doc, {
            startY: 42,
            head: [["Producto", "Categoría", "Marca", "Ubicación", "Stock Actual", "Stock Mínimo"]],
            body: tableData,
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: 255,
                fontStyle: "bold",
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250],
            },
            didParseCell: (data) => {
                // Resaltar stock bajo
                if (data.column.index === 4 && data.section === "body") {
                    const rowIndex = data.row.index;
                    const product = sortedProducts[rowIndex];
                    if (product && product.stock <= product.stockMinimo) {
                        data.cell.styles.textColor = [220, 38, 38];
                        data.cell.styles.fontStyle = "bold";
                    }
                }
            },
        });

        // Pie de página
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128);
            doc.text(
                `Página ${i} de ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: "center" }
            );
        }

        doc.save(`reporte_inventario_${now.toISOString().split("T")[0]}.pdf`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col">
            <div className="flex flex-1">
                <Sidebar activeSection="panel-principal" />

                <main className="flex-1 overflow-y-auto animate-fade-in">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                        {/* Encabezado */}
                        <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
                            <div className="flex items-center gap-4 mb-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate("/")}
                                    className="flex items-center gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Volver
                                </Button>
                            </div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                                Reporte de Inventario Actual
                            </h2>
                            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                                Visualiza el estado actual del inventario con filtros avanzados
                            </p>
                        </div>

                        {/* Barra de herramientas */}
                        <div className="mb-6 lg:ml-0 ml-14">
                            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6 shadow-lg">
                                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                                    {/* Filtros */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                                        {/* Filtro por categoría */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Categoría</label>
                                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Seleccionar categoría" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categorias.map((cat) => (
                                                        <SelectItem key={cat} value={cat}>
                                                            {cat}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Filtro por marca */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Marca</label>
                                            <Input
                                                placeholder="Buscar por marca..."
                                                value={searchMarca}
                                                onChange={(e) => setSearchMarca(e.target.value)}
                                                className="h-11"
                                            />
                                        </div>

                                        {/* Switch Stock Bajo */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Stock Bajo</label>
                                            <div className="flex items-center space-x-3 h-11 px-3 bg-background border border-input rounded-md">
                                                <Switch
                                                    id="low-stock"
                                                    checked={showLowStock}
                                                    onCheckedChange={setShowLowStock}
                                                />
                                                <Label htmlFor="low-stock" className="text-sm text-muted-foreground cursor-pointer">
                                                    Mostrar solo productos con stock bajo
                                                </Label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botón de exportación */}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={exportToPDF}
                                            className="flex items-center gap-2"
                                            variant="default"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Exportar PDF
                                        </Button>
                                    </div>
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
                                                        Producto
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
                                                        onClick={() => handleSort("marca")}
                                                        className="flex items-center gap-2 hover:bg-accent/60 h-auto p-2"
                                                    >
                                                        Marca
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
                                                <TableHead className="font-bold">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleSort("stock")}
                                                        className="flex items-center gap-2 hover:bg-accent/60 h-auto p-2"
                                                    >
                                                        Stock Actual
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
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sortedProducts.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                        No se encontraron productos que coincidan con los filtros
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                sortedProducts.map((product) => (
                                                    <TableRow key={product.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                                                        <TableCell className="font-medium">{product.nombre}</TableCell>
                                                        <TableCell>{product.categoria}</TableCell>
                                                        <TableCell>{product.marca}</TableCell>
                                                        <TableCell>
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
                                                                {product.ubicacion.repisa}-{product.ubicacion.fila}-{product.ubicacion.nivel}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={`font-semibold ${product.stock <= product.stockMinimo ? "text-destructive" : "text-foreground"}`}>
                                                                {product.stock}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{product.stockMinimo}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="mt-6 lg:ml-0 ml-14">
                            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg">
                                <div className="flex flex-wrap gap-6 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Total productos mostrados:</span>{" "}
                                        <span className="font-semibold">{sortedProducts.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Productos con stock bajo:</span>{" "}
                                        <span className="font-semibold text-destructive">
                                            {sortedProducts.filter((p) => p.stock <= p.stockMinimo).length}
                                        </span>
                                    </div>
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

export default CurrentInventoryReport;
