import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

interface SupplierEntry {
    producto: string;
    lote: string;
    cantidadRecibida: number;
    fechaEntrada: Date;
}

const mockSuppliers = [
    "Proveedor ABC",
    "Distribuidora XYZ",
    "Comercial Los Andes",
    "Abastos del Sur",
];

const mockEntries: SupplierEntry[] = [
    { producto: "Harina integral", lote: "L-001", cantidadRecibida: 100, fechaEntrada: new Date(2025, 0, 15) },
    { producto: "Azúcar blanca", lote: "L-002", cantidadRecibida: 80, fechaEntrada: new Date(2025, 0, 20) },
    { producto: "Aceite de oliva", lote: "L-003", cantidadRecibida: 50, fechaEntrada: new Date(2025, 1, 5) },
    { producto: "Sal de mesa", lote: "L-004", cantidadRecibida: 120, fechaEntrada: new Date(2025, 1, 10) },
    { producto: "Harina integral", lote: "L-005", cantidadRecibida: 50, fechaEntrada: new Date(2025, 1, 12) },
];

type SortField = "producto" | "lote" | "cantidadRecibida" | "fechaEntrada";

const SupplierEntries = () => {
    const [supplier, setSupplier] = useState<string>("");
    const [dateFrom, setDateFrom] = useState<Date>();
    const [dateTo, setDateTo] = useState<Date>();
    const [reportGenerated, setReportGenerated] = useState(false);
    const [entries, setEntries] = useState<SupplierEntry[]>([]);
    const [sortField, setSortField] = useState<SortField>("fechaEntrada");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const isFormValid = supplier && dateFrom && dateTo;

    const handleGenerateReport = () => {
        if (!isFormValid) return;

        // Simular generación de reporte
        setEntries(mockEntries);
        setReportGenerated(true);
        toast.success("Reporte generado exitosamente");
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection(field === "fechaEntrada" ? "desc" : "asc");
        }
    };

    const sortedEntries = [...entries].sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1;
        if (sortField === "cantidadRecibida") {
            return (a.cantidadRecibida - b.cantidadRecibida) * multiplier;
        }
        if (sortField === "fechaEntrada") {
            return (a.fechaEntrada.getTime() - b.fechaEntrada.getTime()) * multiplier;
        }
        if (sortField === "lote") {
            return a.lote.localeCompare(b.lote) * multiplier;
        }
        return a.producto.localeCompare(b.producto) * multiplier;
    });

    const totalReceived = entries.reduce((sum, entry) => sum + entry.cantidadRecibida, 0);

    const handleExportPDF = () => {
        if (!dateFrom) return;
        
        const doc = new jsPDF();
        const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
        const timeStr = format(new Date(), "HH:mm");

        // Encabezado
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Reporte de Entradas por Proveedor", 14, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha de emisión: ${dateStr} - ${timeStr}`, 14, 28);
        doc.text(`Proveedor: ${supplier}`, 14, 34);
        doc.text(`Rango: ${format(dateFrom, "dd/MM/yyyy")} - ${format(dateTo!, "dd/MM/yyyy")}`, 14, 40);
        doc.text(`Total Recibido: ${totalReceived} unidades`, 14, 46);

        // Datos de la tabla
        const tableData = sortedEntries.map((entry) => [
            entry.producto,
            entry.lote,
            entry.cantidadRecibida.toString(),
            format(entry.fechaEntrada, "dd/MM/yyyy", { locale: es })
        ]);

        autoTable(doc, {
            startY: 52,
            head: [["Producto", "Lote", "Cantidad Recibida", "Fecha de Entrada"]],
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

        const filename = `reporte_entradas_proveedor_${format(dateFrom, "yyyy-MM-dd")}.pdf`;
        doc.save(filename);
        toast.success(`Exportando ${filename}...`);
    };

    return (
        <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
            {/* Filtros */}
            <div className="space-y-4 mb-6">
                <div className="space-y-2">
                    <Label htmlFor="supplier">Proveedor</Label>
                    <Select value={supplier} onValueChange={setSupplier}>
                        <SelectTrigger id="supplier" className="max-w-md">
                            <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                            {mockSuppliers.map((sup) => (
                                <SelectItem key={sup} value={sup}>
                                    {sup}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

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
                        Seleccione un proveedor y un rango de fechas para ver los resultados
                    </p>
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">
                        No se encontraron entradas para el proveedor y rango de fechas seleccionados
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

                    {/* Total acumulado */}
                    <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-sm text-muted-foreground mb-1">
                            Total acumulado recibido del proveedor en el rango:
                        </p>
                        <p className="text-2xl font-bold text-primary">{totalReceived} unidades</p>
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
                                            onClick={() => handleSort("lote")}
                                            className="font-semibold"
                                        >
                                            Lote
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort("cantidadRecibida")}
                                            className="font-semibold"
                                        >
                                            Cantidad recibida
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort("fechaEntrada")}
                                            className="font-semibold"
                                        >
                                            Fecha de entrada
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedEntries.map((entry, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{entry.producto}</TableCell>
                                        <TableCell>{entry.lote}</TableCell>
                                        <TableCell className="font-semibold text-primary">
                                            {entry.cantidadRecibida}
                                        </TableCell>
                                        <TableCell>
                                            {format(entry.fechaEntrada, "dd/MM/yyyy", { locale: es })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 text-sm text-muted-foreground">
                        Mostrando {sortedEntries.length} entrada{sortedEntries.length !== 1 ? "s" : ""}
                    </div>
                </>
            )}
        </div>
    );
};


export default SupplierEntries;
