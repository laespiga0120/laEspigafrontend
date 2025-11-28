import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { ProductService, ProductoInventario, RepisaFiltro } from "@/api/productService";
import { MovimientoService, MovimientoHistorialDto } from "@/api/movimientoService";
import { format } from "date-fns";

const InventoryReview = () => {
    const [products, setProducts] = useState<ProductoInventario[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductoInventario[]>([]);
    const [stockReal, setStockReal] = useState<{ [key: number]: string }>({});
    const [adjustmentHistory, setAdjustmentHistory] = useState<MovimientoHistorialDto[]>([]);
    const [repisas, setRepisas] = useState<RepisaFiltro[]>([]);
    const [selectedShelf, setSelectedShelf] = useState<string>("all");
    const [pendingAdjustment, setPendingAdjustment] = useState<ProductoInventario | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        loadProducts();
        loadRepisas();
        loadHistory();
    }, []);

    // Filtrar productos cuando cambia la repisa o la lista de productos
    useEffect(() => {
        if (selectedShelf === "all") {
            setFilteredProducts(products);
        } else {
            // El formato de ubicación en ProductoInventario es "REPISA-F-C" (ej: A1-1-2)
            // Necesitamos filtrar si la ubicación empieza con el código de la repisa seleccionada
            setFilteredProducts(products.filter(p => 
                p.ubicacion && p.ubicacion.startsWith(selectedShelf)
            ));
        }
    }, [selectedShelf, products]);

    const loadProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const data = await ProductService.getInventario({});
            setProducts(data);
        } catch (error) {
            toast.error("Error al cargar inventario");
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const loadRepisas = async () => {
        try {
            const data = await ProductService.getFiltrosInventario();
            setRepisas(data.repisas);
        } catch (error) {
            console.error("Error cargando repisas");
        }
    };

    const loadHistory = async () => {
        try {
            const data = await MovimientoService.obtenerHistorialAjustes();
            setAdjustmentHistory(data);
        } catch (error) {
            console.error("Error cargando historial");
        }
    };

    const handleStockRealChange = (productId: number, value: string) => {
        setStockReal(prev => ({
            ...prev,
            [productId]: value
        }));
    };

    const initiateAdjustment = (product: ProductoInventario) => {
        const val = stockReal[product.idProducto];
        const newStock = parseInt(val || "");

        if (isNaN(newStock) || newStock < 0) {
            toast.error("Por favor ingrese un valor numérico válido (positivo o cero)");
            return;
        }

        if (newStock === product.stockDisponible) {
            toast.info("El stock real es igual al stock registrado. No se requieren cambios.");
            return;
        }

        setPendingAdjustment(product);
        setIsDialogOpen(true);
    };

    const handleConfirmAdjustment = async () => {
        if (!pendingAdjustment) return;

        const productId = pendingAdjustment.idProducto;
        const newStock = parseInt(stockReal[productId]);

        try {
            await MovimientoService.registrarAjuste({
                idProducto: productId,
                stockReal: newStock
            });

            toast.success(`Stock de "${pendingAdjustment.nombre}" actualizado a ${newStock}`);
            
            // Limpiar estado y recargar
            setPendingAdjustment(null);
            setIsDialogOpen(false);
            setStockReal(prev => {
                const next = { ...prev };
                delete next[productId];
                return next;
            });
            
            // Recargar datos para ver cambios reflejados
            loadProducts();
            loadHistory();

        } catch (error: any) {
            const msg = error.message || "Error al realizar el ajuste";
            toast.error(msg);
        }
    };

    // Función auxiliar para extraer la diferencia de la observación (hack temporal dado que no está en DTO limpio)
    // Lo ideal es que el backend mande "stockAnterior" y "stockNuevo" en el DTO.
    // Como solución rápida, parseamos el motivo o la observación, o calculamos si tenemos datos.
    // En esta implementación, el backend guarda en DetalleMovimiento la cantidad absoluta de diferencia.
    // Para mostrar la tabla como pide el usuario (Anterior, Nuevo, Diferencia), 
    // parsearemos la cadena de "motivo" del detalle que pusimos en el backend: "Stock Anterior: X -> Nuevo: Y"
    
    const parseAdjustmentDetails = (historyItem: MovimientoHistorialDto) => {
        // El item de historial tiene una lista de detalles. En un ajuste simple, suele ser 1 detalle.
        if (!historyItem.detalles || historyItem.detalles.length === 0) return null;
        const detalle = historyItem.detalles[0];
        
        // Aquí necesitamos que el backend nos mande esos datos o los inferimos.
        // Como el backend actual (MovimientoService) no manda la "observacionDetalle" en el DTO de historial (DetalleHistorialDto),
        // Solo tenemos cantidad (la diferencia absoluta).
        // Para cumplir con el requerimiento visual exacto, necesitaríamos modificar el DTO del backend 
        // para incluir 'observacionDetalle' o 'stockAnterior'.
        // POR AHORA: Mostraremos la diferencia y la fecha.
        
        // Nota: Si el backend se actualizó correctamente con mi propuesta anterior, 
        // falta agregar 'observacionDetalle' a DetalleHistorialDto. 
        // Asumiremos que se hizo o mostraremos datos básicos.
        
        return {
            producto: detalle.nombreProducto,
            diferencia: detalle.cantidad, // Es absoluto
            tipo: historyItem.motivo.includes("Sobrante") ? "positive" : "negative"
        };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col">
            <div className="flex flex-1">
                <Sidebar activeSection="revision-inventario" />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
                            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold mb-2 text-foreground">
                                Revisión Periódica de Inventario
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base">
                                Verifica y ajusta el stock físico para que coincida con el sistema
                            </p>
                        </div>

                        {/* Filtros */}
                        <div className="lg:ml-0 ml-14 mb-6 flex justify-end">
                            <div className="w-[250px]">
                                <Select value={selectedShelf} onValueChange={setSelectedShelf}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por repisa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las repisas</SelectItem>
                                        {repisas.map(r => (
                                            <SelectItem key={r.idRepisa} value={r.codigo}>
                                                Repisa {r.codigo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tabla de Productos */}
                        <div className="lg:ml-0 ml-14 bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl lg:rounded-2xl shadow-lg p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4 text-foreground">Productos en inventario</h2>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead>Ubicación</TableHead>
                                            <TableHead className="text-right">Stock Sistema</TableHead>
                                            <TableHead className="text-center">Stock Real</TableHead>
                                            <TableHead className="text-center">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingProducts ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredProducts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No se encontraron productos.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredProducts.map((product) => (
                                                <TableRow key={product.idProducto}>
                                                    <TableCell className="font-medium">{product.nombre}</TableCell>
                                                    <TableCell>{product.categoria}</TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-xs font-medium">
                                                            {product.ubicacion || "N/A"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {product.stockDisponible}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={stockReal[product.idProducto] || ""}
                                                            onChange={(e) => handleStockRealChange(product.idProducto, e.target.value)}
                                                            className="w-24 text-center mx-auto h-8"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {stockReal[product.idProducto] !== undefined && stockReal[product.idProducto] !== "" && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => initiateAdjustment(product)}
                                                                className="h-8 gap-2"
                                                            >
                                                                <Save className="w-3 h-3" />
                                                                Ajustar
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Historial de Ajustes */}
                        {adjustmentHistory.length > 0 && (
                            <div className="lg:ml-0 ml-14 bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl lg:rounded-2xl shadow-lg p-6">
                                <h2 className="text-lg font-semibold mb-4 text-foreground">Historial de últimos ajustes</h2>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-right">Diferencia</TableHead>
                                                <TableHead>Motivo / Detalle</TableHead>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Usuario</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {adjustmentHistory.map((hist, index) => {
                                                const info = parseAdjustmentDetails(hist);
                                                if (!info) return null;
                                                
                                                const isPositive = info.tipo === "positive";
                                                
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{info.producto}</TableCell>
                                                        <TableCell className={`text-right font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                            {isPositive ? '+' : '-'}{info.diferencia}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {hist.motivo}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {new Date(hist.fechaMovimiento).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {hist.nombreUsuario}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <footer className="container mx-auto px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
                <p>La Espiga © 2025 - Sistema de gestión para abarrotes y postres</p>
            </footer>

            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar ajuste de inventario?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se actualizará el stock de <strong>{pendingAdjustment?.nombre}</strong> de {" "}
                            <span className="font-bold text-foreground">{pendingAdjustment?.stockDisponible}</span> a {" "}
                            <span className="font-bold text-foreground">{pendingAdjustment && stockReal[pendingAdjustment.idProducto]}</span> unidades.
                            <br /><br />
                            Esta acción quedará registrada en el historial y afectará los lotes correspondientes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingAdjustment(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmAdjustment}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default InventoryReview;