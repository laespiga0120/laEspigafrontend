import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Product {
    id: string;
    nombre: string;
    categoria: string;
    stockRegistrado: number;
    ubicacion: string;
}

interface Adjustment {
    productoId: string;
    producto: string;
    stockAnterior: number;
    stockCorregido: number;
    fecha: string;
    hora: string;
    usuario: string;
}

const InventoryReview = () => {
    const [products, setProducts] = useState<Product[]>([
        { id: "1", nombre: "Harina de trigo", categoria: "Harinas", stockRegistrado: 50, ubicacion: "A1" },
        { id: "2", nombre: "Azúcar refinada", categoria: "Endulzantes", stockRegistrado: 30, ubicacion: "B2" },
        { id: "3", nombre: "Sal fina", categoria: "Condimentos", stockRegistrado: 25, ubicacion: "C1" },
        { id: "4", nombre: "Aceite vegetal", categoria: "Aceites", stockRegistrado: 40, ubicacion: "D3" },
        { id: "5", nombre: "Arroz blanco", categoria: "Granos", stockRegistrado: 60, ubicacion: "E1" },
        { id: "6", nombre: "Frijoles negros", categoria: "Granos", stockRegistrado: 35, ubicacion: "E2" },
        { id: "7", nombre: "Pasta corta", categoria: "Pastas", stockRegistrado: 45, ubicacion: "F1" },
        { id: "8", nombre: "Leche en polvo", categoria: "Lácteos", stockRegistrado: 20, ubicacion: "G2" },
    ]);

    const [stockReal, setStockReal] = useState<{ [key: string]: string }>({});
    const [adjustmentHistory, setAdjustmentHistory] = useState<Adjustment[]>([]);
    const [selectedShelf, setSelectedShelf] = useState<string>("all");

    // Get unique shelves
    const shelves = Array.from(new Set(products.map(p => p.ubicacion))).sort();

    // Filter products
    const filteredProducts = selectedShelf === "all"
        ? products
        : products.filter(p => p.ubicacion === selectedShelf);

    const handleStockRealChange = (productId: string, value: string) => {
        setStockReal(prev => ({
            ...prev,
            [productId]: value
        }));
    };

    const handleSaveAdjustment = (product: Product) => {
        const newStock = parseInt(stockReal[product.id] || "");

        if (isNaN(newStock)) {
            toast({
                title: "Error",
                description: "Por favor ingrese un valor numérico válido",
                variant: "destructive",
            });
            return;
        }

        if (newStock === product.stockRegistrado) {
            toast({
                title: "Sin cambios",
                description: "El stock real es igual al stock registrado",
            });
            return;
        }

        // Update product stock
        setProducts(prev => prev.map(p =>
            p.id === product.id ? { ...p, stockRegistrado: newStock } : p
        ));

        // Add to adjustment history
        const now = new Date();
        const adjustment: Adjustment = {
            productoId: product.id,
            producto: product.nombre,
            stockAnterior: product.stockRegistrado,
            stockCorregido: newStock,
            fecha: now.toLocaleDateString('es-MX'),
            hora: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            usuario: "Administrador"
        };

        setAdjustmentHistory(prev => [adjustment, ...prev]);

        // Clear the input for this product
        setStockReal(prev => ({
            ...prev,
            [product.id]: ""
        }));

        // Show success toast
        toast({
            title: "Ajuste realizado",
            description: `Stock de "${product.nombre}" actualizado de ${product.stockRegistrado} a ${newStock} unidades`,
        });
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

                        {/* Filters */}
                        <div className="lg:ml-0 ml-14 mb-6 flex justify-end">
                            <div className="w-[200px]">
                                <Select value={selectedShelf} onValueChange={setSelectedShelf}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por repisa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las repisas</SelectItem>
                                        {shelves.map(shelf => (
                                            <SelectItem key={shelf} value={shelf}>
                                                Repisa {shelf}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="lg:ml-0 ml-14 bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl lg:rounded-2xl shadow-lg p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4 text-foreground">Productos en inventario</h2>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead>Ubicación</TableHead>
                                            <TableHead className="text-right">Stock Registrado</TableHead>
                                            <TableHead className="text-right">Stock Real</TableHead>
                                            <TableHead className="text-center">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">{product.nombre}</TableCell>
                                                <TableCell>{product.categoria}</TableCell>
                                                <TableCell>{product.ubicacion}</TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {product.stockRegistrado}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        placeholder="Ingrese stock"
                                                        value={stockReal[product.id] || ""}
                                                        onChange={(e) => handleStockRealChange(product.id, e.target.value)}
                                                        className="w-32 text-right"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSaveAdjustment(product)}
                                                        disabled={!stockReal[product.id]}
                                                        className="gap-2"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        Ajustar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Adjustment History */}
                        {adjustmentHistory.length > 0 && (
                            <div className="lg:ml-0 ml-14 bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl lg:rounded-2xl shadow-lg p-6">
                                <h2 className="text-lg font-semibold mb-4 text-foreground">Historial de ajustes</h2>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-right">Stock Anterior</TableHead>
                                                <TableHead className="text-right">Stock Corregido</TableHead>
                                                <TableHead className="text-right">Diferencia</TableHead>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Hora</TableHead>
                                                <TableHead>Usuario</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {adjustmentHistory.map((adjustment, index) => {
                                                const difference = adjustment.stockCorregido - adjustment.stockAnterior;
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{adjustment.producto}</TableCell>
                                                        <TableCell className="text-right">{adjustment.stockAnterior}</TableCell>
                                                        <TableCell className="text-right font-semibold">{adjustment.stockCorregido}</TableCell>
                                                        <TableCell className={`text-right font-semibold ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {difference > 0 ? '+' : ''}{difference}
                                                        </TableCell>
                                                        <TableCell>{adjustment.fecha}</TableCell>
                                                        <TableCell>{adjustment.hora}</TableCell>
                                                        <TableCell>{adjustment.usuario}</TableCell>
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
        </div>
    );
};

export default InventoryReview;