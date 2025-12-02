import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CalendarIcon, FileDown, FileSpreadsheet, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LowRotationProduct {
    producto: string;
    stockActual: number;
    cantidadVendida: number;
}

const mockLowRotationProducts: LowRotationProduct[] = [
    { producto: "Vinagre balsámico", stockActual: 45, cantidadVendida: 3 },
    { producto: "Pimienta negra molida", stockActual: 32, cantidadVendida: 5 },
    { producto: "Orégano seco", stockActual: 28, cantidadVendida: 7 },
    { producto: "Aceite de coco", stockActual: 50, cantidadVendida: 8 },
];

type SortField = "producto" | "stockActual" | "cantidadVendida";

const LowRotationProducts = () => {
    const [dateFrom, setDateFrom] = useState<Date>();
    const [dateTo, setDateTo] = useState<Date>();
    const [threshold, setThreshold] = useState<string>("");
    const [reportGenerated, setReportGenerated] = useState(false);
    const [products, setProducts] = useState<LowRotationProduct[]>([]);
    const [sortField, setSortField] = useState<SortField>("cantidadVendida");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const isFormValid = dateFrom && dateTo && threshold && Number(threshold) > 0;

    const handleGenerateReport = () => {
        if (!isFormValid) return;

        // Simular generación de reporte filtrado por umbral
        const thresholdNum = Number(threshold);
        const filtered = mockLowRotationProducts.filter(p => p.cantidadVendida <= thresholdNum);

        if (filtered.length === 0) {
            toast.info("No se encontraron productos que cumplan con el umbral especificado");
            setProducts([]);
            setReportGenerated(true);
            return;
        }

        setProducts(filtered);
        setReportGenerated(true);
        toast.success("Reporte generado exitosamente");
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection(field === "cantidadVendida" ? "asc" : "desc");
        }
    };

    const sortedProducts = [...products].sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1;
        if (sortField === "stockActual" || sortField === "cantidadVendida") {
            return (a[sortField] - b[sortField]) * multiplier;
        }
        return a[sortField].localeCompare(b[sortField]) * multiplier;
    });

    const handleExportPDF = () => {
        if (!dateFrom) return;
        
        const doc = new jsPDF();
        const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
        const timeStr = format(new Date(), "HH:mm");

        // Encabezado
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Reporte de Productos con Baja Rotación", 14, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha de emisión: ${dateStr} - ${timeStr}`, 14, 28);
        doc.text(`Desde: ${format(dateFrom, "dd/MM/yyyy")}`, 14, 34);
        if (dateTo) {
            doc.text(`Hasta: ${format(dateTo, "dd/MM/yyyy")}`, 14, 40);
        }
        doc.text(`Umbral de ventas: ${threshold} unidades`, 14, dateTo ? 46 : 40);

        // Datos de la tabla
        const tableData = sortedProducts.map((product) => [
            product.producto,
            product.stockActual.toString(),
            product.cantidadVendida.toString()
        ]);

        autoTable(doc, {
            startY: dateTo ? 52 : 46,
            head: [["Producto", "Stock Actual", "Cantidad Vendida"]],
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

        const filename = `Productos_BajaRotacion_${format(dateFrom, "yyyy-MM-dd")}.pdf`;
        doc.save(filename);
        toast.success(`Exportando ${filename}...`);
    };

    return (
        <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
            {/* Filtros */}
            <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date-from">Fecha Desde</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date-from"
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dateFrom && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateFrom ? format(dateFrom, "PPP", { locale: es }) : "Seleccionar fecha"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateFrom}
                                    onSelect={setDateFrom}
                                    initialFocus
                                    className="pointer-events-auto"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date-to">Fecha Hasta</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date-to"
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dateTo && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateTo ? format(dateTo, "PPP", { locale: es }) : "Seleccionar fecha"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateTo}
                                    onSelect={setDateTo}
                                    initialFocus
                                    className="pointer-events-auto"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="threshold">Umbral de baja rotación (unidades vendidas)</Label>
                    <Input
                        id="threshold"
                        type="number"
                        min="0"
                        placeholder="Ej: 10"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        className="max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                        Se mostrarán productos con ventas menores o iguales a este número
                    </p>
                </div>

                <Button
                    onClick={handleGenerateReport}
                    disabled={!isFormValid}
                >
                    Generar Reporte
                </Button>
            </div>

            {/* Área de resultados */}
            {!reportGenerated ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">
                        Complete los filtros obligatorios para ver los resultados
                    </p>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">
                        No se encontraron productos con baja rotación según el umbral especificado
                    </p>
                </div>
            ) : (
                <>
                    {/* Botones de exportación */}
                    <div className="flex justify-end gap-2 mb-4">
                        <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                            <FileDown className="w-4 h-4" />
                            Exportar PDF
                        </Button>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort("producto")}
                                            className="font-semibold"
                                        >
                                            Nombre del producto
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort("stockActual")}
                                            className="font-semibold"
                                        >
                                            Stock actual
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort("cantidadVendida")}
                                            className="font-semibold"
                                        >
                                            Cantidad vendida en el rango
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedProducts.map((product, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{product.producto}</TableCell>
                                        <TableCell>{product.stockActual}</TableCell>
                                        <TableCell className="text-destructive font-semibold">
                                            {product.cantidadVendida}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 text-sm text-muted-foreground">
                        Mostrando {sortedProducts.length} producto{sortedProducts.length !== 1 ? "s" : ""} con baja rotación
                    </div>
                </>
            )}
        </div>
    );
};


export default LowRotationProducts;
