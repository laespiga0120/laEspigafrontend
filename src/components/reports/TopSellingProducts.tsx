import { useState } from "react";
import { Button } from "@/components/ui/button";
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

interface TopProduct {
    ranking: number;
    producto: string;
    categoria: string;
    cantidadVendida: number;
}

const mockTopProducts: TopProduct[] = [
    { ranking: 1, producto: "Harina integral", categoria: "Harinas", cantidadVendida: 250 },
    { ranking: 2, producto: "Azúcar blanca", categoria: "Endulzantes", cantidadVendida: 180 },
    { ranking: 3, producto: "Aceite de oliva", categoria: "Aceites", cantidadVendida: 150 },
    { ranking: 4, producto: "Sal de mesa", categoria: "Condimentos", cantidadVendida: 120 },
    { ranking: 5, producto: "Pan dulce", categoria: "Panadería", cantidadVendida: 95 },
];

type SortField = "ranking" | "producto" | "categoria" | "cantidadVendida";

const TopSellingProducts = () => {
    const [dateFrom, setDateFrom] = useState<Date>();
    const [dateTo, setDateTo] = useState<Date>();
    const [reportGenerated, setReportGenerated] = useState(false);
    const [products, setProducts] = useState<TopProduct[]>([]);
    const [sortField, setSortField] = useState<SortField>("cantidadVendida");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const isFormValid = dateFrom && dateTo;

    const handleGenerateReport = () => {
        if (!isFormValid) return;

        // Simular generación de reporte
        setProducts(mockTopProducts);
        setReportGenerated(true);
        toast.success("Reporte generado exitosamente");
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection(field === "cantidadVendida" ? "desc" : "asc");
        }
    };

    const sortedProducts = [...products].sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1;
        if (sortField === "cantidadVendida" || sortField === "ranking") {
            return (a[sortField] - b[sortField]) * multiplier;
        }
        return a[sortField].localeCompare(b[sortField]) * multiplier;
    });

    const handleExportPDF = () => {
        if (!dateFrom || !dateTo) return;
        const filename = `TopVentas_${format(dateFrom, "yyyy-MM-dd")}_${format(dateTo, "yyyy-MM-dd")}.pdf`;
        toast.success(`Exportando ${filename}...`);
    };

    return (
        <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-normal h-10",
                                    !dateFrom && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFrom ? format(dateFrom, "PPP", { locale: es }) : "Fecha Desde"}
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

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-normal h-10",
                                    !dateTo && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateTo ? format(dateTo, "PPP", { locale: es }) : "Fecha Hasta"}
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

                <Button
                    onClick={handleGenerateReport}
                    disabled={!isFormValid}
                    className="sm:w-auto"
                >
                    Generar Reporte
                </Button>
            </div>

            {/* Área de resultados */}
            {!reportGenerated ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">
                        Seleccione un rango de fechas para ver los resultados
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
                                            onClick={() => handleSort("ranking")}
                                            className="font-semibold"
                                        >
                                            Ranking
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort("producto")}
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
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort("cantidadVendida")}
                                            className="font-semibold"
                                        >
                                            Cantidad Vendida
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedProducts.map((product) => (
                                    <TableRow key={product.ranking}>
                                        <TableCell className="font-medium">{product.ranking}</TableCell>
                                        <TableCell>{product.producto}</TableCell>
                                        <TableCell>{product.categoria}</TableCell>
                                        <TableCell className="font-semibold text-primary">
                                            {product.cantidadVendida}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </div>
    );
};


export default TopSellingProducts;
