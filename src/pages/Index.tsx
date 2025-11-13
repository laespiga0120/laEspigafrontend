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
import { Search, ArrowUpDown } from "lucide-react";

// Datos mock de productos
const mockProducts = [
  {
    id: 1,
    nombre: "Arroz Blanco",
    categoria: "Granos",
    stock: 150,
    stockMinimo: 50,
    ubicacion: { repisa: "A", fila: "1", nivel: "2" },
  },
  {
    id: 2,
    nombre: "Frijol Negro",
    categoria: "Granos",
    stock: 80,
    stockMinimo: 30,
    ubicacion: { repisa: "A", fila: "2", nivel: "1" },
  },
  {
    id: 3,
    nombre: "Aceite Vegetal",
    categoria: "Aceites",
    stock: 45,
    stockMinimo: 20,
    ubicacion: { repisa: "B", fila: "1", nivel: "3" },
  },
  {
    id: 4,
    nombre: "Azúcar Blanca",
    categoria: "Endulzantes",
    stock: 200,
    stockMinimo: 100,
    ubicacion: { repisa: "C", fila: "3", nivel: "1" },
  },
  {
    id: 5,
    nombre: "Sal de Mesa",
    categoria: "Condimentos",
    stock: 120,
    stockMinimo: 40,
    ubicacion: { repisa: "C", fila: "2", nivel: "2" },
  },
  {
    id: 6,
    nombre: "Harina de Trigo",
    categoria: "Harinas",
    stock: 90,
    stockMinimo: 50,
    ubicacion: { repisa: "B", fila: "3", nivel: "1" },
  },
  {
    id: 7,
    nombre: "Pasta Corta",
    categoria: "Pastas",
    stock: 60,
    stockMinimo: 25,
    ubicacion: { repisa: "D", fila: "1", nivel: "2" },
  },
  {
    id: 8,
    nombre: "Leche Entera",
    categoria: "Lácteos",
    stock: 35,
    stockMinimo: 20,
    ubicacion: { repisa: "E", fila: "2", nivel: "3" },
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

type SortField = "nombre" | "categoria" | "stock" | "stockMinimo" | "ubicacion";

const Index = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchRepisa, setSearchRepisa] = useState("");
  const [searchFila, setSearchFila] = useState("");
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

  // Filtrar productos
  const filteredProducts = mockProducts.filter((product) => {
    const matchesName = product.nombre
      .toLowerCase()
      .includes(searchName.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todas" || product.categoria === selectedCategory;
    const matchesRepisa =
      searchRepisa === "" ||
      product.ubicacion.repisa
        .toLowerCase()
        .includes(searchRepisa.toLowerCase());
    const matchesFila =
      searchFila === "" ||
      product.ubicacion.fila.toLowerCase().includes(searchFila.toLowerCase());

    return matchesName && matchesCategory && matchesRepisa && matchesFila;
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <Input
                      placeholder="Ej: A, B, C..."
                      value={searchRepisa}
                      onChange={(e) => setSearchRepisa(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Filtro por fila */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Fila
                    </label>
                    <Input
                      placeholder="Ej: 1, 2, 3..."
                      value={searchFila}
                      onChange={(e) => setSearchFila(e.target.value)}
                      className="h-11"
                    />
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedProducts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
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
