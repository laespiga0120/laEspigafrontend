import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, ArrowUpDown } from "lucide-react";

// Datos mock de productos
const mockProducts = [
  {
    id: 1,
    nombre: "Arroz Blanco",
    categoria: "Granos",
    descripcion: "Arroz blanco de grano largo, bolsa 1kg",
    stock: 150,
    stockMinimo: 50,
    precio: 3.5,
    marca: "La Espiga",
    ubicacion: { repisa: "A", fila: "1", nivel: "2" },
    perecible: false,
    lotes: [
      { loteId: "L-AR-001", cantidad: 80 },
      { loteId: "L-AR-002", cantidad: 70 },
    ],
  },
  {
    id: 2,
    nombre: "Frijol Negro",
    categoria: "Granos",
    descripcion: "Frijol negro seleccionado, bolsa 1kg",
    stock: 80,
    stockMinimo: 30,
    precio: 4.2,
    marca: "Buen Grano",
    ubicacion: { repisa: "A", fila: "2", nivel: "1" },
    perecible: false,
    lotes: [{ loteId: "L-FN-010", cantidad: 80 }],
  },
  {
    id: 3,
    nombre: "Aceite Vegetal",
    categoria: "Aceites",
    descripcion: "Aceite vegetal 900ml",
    stock: 45,
    stockMinimo: 20,
    precio: 7.9,
    marca: "Sol Dorado",
    ubicacion: { repisa: "B", fila: "1", nivel: "3" },
    perecible: false,
    lotes: [{ loteId: "L-AV-021", cantidad: 45 }],
  },
  {
    id: 4,
    nombre: "Azúcar Blanca",
    categoria: "Endulzantes",
    descripcion: "Azúcar blanca refinada, bolsa 1kg",
    stock: 200,
    stockMinimo: 100,
    precio: 2.8,
    marca: "Dulce Vida",
    ubicacion: { repisa: "C", fila: "3", nivel: "1" },
    perecible: false,
    lotes: [{ loteId: "L-AZ-105", cantidad: 200 }],
  },
  {
    id: 5,
    nombre: "Sal de Mesa",
    categoria: "Condimentos",
    descripcion: "Sal de mesa yodada 1kg",
    stock: 120,
    stockMinimo: 40,
    precio: 1.5,
    marca: "Marina",
    ubicacion: { repisa: "C", fila: "2", nivel: "2" },
    perecible: false,
    lotes: [{ loteId: "L-SM-201", cantidad: 120 }],
  },
  {
    id: 6,
    nombre: "Harina de Trigo",
    categoria: "Harinas",
    descripcion: "Harina de trigo fortificada 1kg",
    stock: 90,
    stockMinimo: 50,
    precio: 3.0,
    marca: "Trigal",
    ubicacion: { repisa: "B", fila: "3", nivel: "1" },
    perecible: false,
    lotes: [{ loteId: "L-HT-081", cantidad: 90 }],
  },
  {
    id: 7,
    nombre: "Pasta Corta",
    categoria: "Pastas",
    descripcion: "Pasta corta 500g",
    stock: 60,
    stockMinimo: 25,
    precio: 2.2,
    marca: "Italiana",
    ubicacion: { repisa: "D", fila: "1", nivel: "2" },
    perecible: false,
    lotes: [{ loteId: "L-PC-141", cantidad: 60 }],
  },
  {
    id: 8,
    nombre: "Leche Entera",
    categoria: "Lácteos",
    descripcion: "Leche entera UHT 1L",
    stock: 35,
    stockMinimo: 20,
    precio: 4.8,
    marca: "La Vaca",
    ubicacion: { repisa: "E", fila: "2", nivel: "3" },
    perecible: true,
    fechaVencimiento: "2026-03-15",
    lotes: [
      { loteId: "L-LE-301", cantidad: 20, fechaVencimiento: "2026-02-28" },
      { loteId: "L-LE-302", cantidad: 15, fechaVencimiento: "2026-03-15" },
    ],
  },
];

const categorias = [
  "Todas",
  "Granos",
  "Aceites",
  "Endulzantes",
  "Condimentos",
  "Harinas",
  "Pastas",
  "Lácteos",
];

type SortField =
  | "nombre"
  | "categoria"
  | "precio"
  | "stock"
  | "stockMinimo"
  | "ubicacion";

const Index = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchRepisa, setSearchRepisa] = useState("");
  const [searchFila, setSearchFila] = useState("");
  const [searchColumna, setSearchColumna] = useState("");
  const [sortField, setSortField] = useState<SortField>("nombre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
    } else {
      const userData = JSON.parse(user);
      setUserName(userData.name);
    }
  }, [navigate]);

  // Opciones dinámicas para filtros dependientes
  const repisas = Array.from(
    new Set(mockProducts.map((p) => p.ubicacion.repisa))
  ).sort();
  const filas = searchRepisa
    ? Array.from(
        new Set(
          mockProducts
            .filter((p) => p.ubicacion.repisa === searchRepisa)
            .map((p) => p.ubicacion.fila)
        )
      ).sort()
    : [];
  const columnas =
    searchRepisa && searchFila
      ? Array.from(
          new Set(
            mockProducts
              .filter(
                (p) =>
                  p.ubicacion.repisa === searchRepisa &&
                  p.ubicacion.fila === searchFila
              )
              .map((p) => p.ubicacion.nivel)
          )
        ).sort()
      : [];

  // Filtrar productos
  const filteredProducts = mockProducts.filter((product) => {
    const matchesName = product.nombre
      .toLowerCase()
      .includes(searchName.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todas" || product.categoria === selectedCategory;
    const matchesRepisa =
      searchRepisa === "" || product.ubicacion.repisa === searchRepisa;
    const matchesFila =
      searchFila === "" || product.ubicacion.fila === searchFila;
    const matchesColumna =
      searchColumna === "" || product.ubicacion.nivel === searchColumna;
    return (
      matchesName &&
      matchesCategory &&
      matchesRepisa &&
      matchesFila &&
      matchesColumna
    );
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

  const handleClearFilters = () => {
    setSearchName("");
    setSelectedCategory("Todas");
    setSearchRepisa("");
    setSearchFila("");
    setSearchColumna("");
    setSortField("nombre");
    setSortDirection("asc");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col">
      {/* Layout con Sidebar */}
      <div className="flex flex-1">
        <Sidebar activeSection="panel-principal" />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto animate-fade-in">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            {/* Encabezado */}
            <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Inventario de Productos
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                Busca y filtra productos por nombre, categoría o ubicación
              </p>
            </div>

            {/* Filtros de búsqueda */}
            <div className="mb-6 lg:ml-0 ml-14">
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Búsqueda por nombre */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Buscar por nombre
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nombre del producto..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  {/* Filtro por categoría */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Categoría
                    </label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
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

                  {/* Filtro por repisa */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Repisa
                    </label>
                    <Select
                      value={searchRepisa}
                      onValueChange={(v) => {
                        if (v === "__all__") {
                          setSearchRepisa("");
                        } else {
                          setSearchRepisa(v);
                        }
                        setSearchFila("");
                        setSearchColumna("");
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar repisa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        {repisas.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por fila (depende de repisa) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Fila
                    </label>
                    <Select
                      value={searchFila}
                      onValueChange={(v) => {
                        if (v === "__all__") {
                          setSearchFila("");
                        } else {
                          setSearchFila(v);
                        }
                        setSearchColumna("");
                      }}
                    >
                      <SelectTrigger className="h-11" disabled={!searchRepisa}>
                        <SelectValue placeholder="Seleccionar fila" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        {filas.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por columna (nivel) depende de repisa y fila */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Columna
                    </label>
                    <Select
                      value={searchColumna}
                      onValueChange={(v) => {
                        if (v === "__all__") {
                          setSearchColumna("");
                        } else {
                          setSearchColumna(v);
                        }
                      }}
                    >
                      <SelectTrigger
                        className="h-11"
                        disabled={!searchRepisa || !searchFila}
                      >
                        <SelectValue placeholder="Seleccionar columna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        {columnas.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Acciones de filtros */}
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpiar filtros
                  </Button>
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
                            Nombre
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
                            onClick={() => handleSort("precio")}
                            className="flex items-center gap-2 hover:bg-accent/60 h-auto p-2"
                          >
                            Precio
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-bold">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("stock")}
                            className="flex items-center gap-2 hover:bg-accent/60 h-auto p-2"
                          >
                            Stock Disponible
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
                        <TableHead className="font-bold text-right">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedProducts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No se encontraron productos que coincidan con los
                            filtros
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedProducts.map((product) => (
                          <TableRow
                            key={product.id}
                            className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                          >
                            <TableCell className="font-medium">
                              {product.nombre}
                            </TableCell>
                            <TableCell>{product.categoria}</TableCell>
                            <TableCell>
                              {product.precio?.toLocaleString("es-PE", {
                                style: "currency",
                                currency: "PEN",
                              })}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-semibold ${
                                  product.stock < product.stockMinimo
                                    ? "text-destructive"
                                    : "text-foreground"
                                }`}
                              >
                                {product.stock}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {product.stockMinimo}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
                                {product.ubicacion.repisa}-
                                {product.ubicacion.fila}-
                                {product.ubicacion.nivel}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="secondary">
                                    Ver detalles
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px]">
                                  <DialogHeader>
                                    <DialogTitle>{product.nombre}</DialogTitle>
                                    <DialogDescription>
                                      Información detallada del producto
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Categoría
                                      </p>
                                      <p className="font-medium">
                                        {product.categoria ?? "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Marca
                                      </p>
                                      <p className="font-medium">
                                        {product.marca ?? "N/A"}
                                      </p>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <p className="text-xs text-muted-foreground">
                                        Descripción
                                      </p>
                                      <p className="font-medium">
                                        {product.descripcion ?? "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Precio
                                      </p>
                                      <p className="font-medium">
                                        {product.precio?.toLocaleString(
                                          "es-PE",
                                          {
                                            style: "currency",
                                            currency: "PEN",
                                          }
                                        ) ?? "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Stock disponible
                                      </p>
                                      <p className="font-medium">
                                        {product.stock}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Stock mínimo
                                      </p>
                                      <p className="font-medium">
                                        {product.stockMinimo}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Ubicación
                                      </p>
                                      <p className="font-medium">
                                        {product.ubicacion.repisa}-
                                        {product.ubicacion.fila}-
                                        {product.ubicacion.nivel}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Perecible
                                      </p>
                                      <p className="font-medium">
                                        {product.perecible ? "Sí" : "No"}
                                      </p>
                                    </div>
                                    {product.perecible && (
                                      <div>
                                        <p className="text-xs text-muted-foreground">
                                          Fecha de vencimiento
                                        </p>
                                        <p className="font-medium">
                                          {product.fechaVencimiento ?? "N/A"}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold mt-2">
                                      Lotes
                                    </p>
                                    {product.lotes &&
                                    product.lotes.length > 0 ? (
                                      <div className="mt-2 border rounded-md divide-y">
                                        {product.lotes.map((l: any) => (
                                          <div
                                            key={l.loteId}
                                            className="p-2 text-sm flex items-center justify-between"
                                          >
                                            <span className="text-muted-foreground">
                                              {l.loteId}
                                            </span>
                                            <span>Cant.: {l.cantidad}</span>
                                            {product.perecible && (
                                              <span className="text-muted-foreground">
                                                Vence:{" "}
                                                {l.fechaVencimiento ?? "-"}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">
                                        Sin lotes registrados
                                      </p>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>La Espiga © 2025 - Sistema de gestión para abarrotes y postres</p>
      </footer>
    </div>
  );
};

export default Index;
