import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import NewProduct from "./pages/NewProduct";
import ManageCategories from "./pages/ManageCategories";
import ManageProveedores from "./pages/ManageProveedores";
import RegisterSalesOutput from "./pages/RegisterSalesOutput";
import RegisterSupplierInput from "./pages/RegisterSupplierInput";
import InventoryReport from "./pages/InventoryReport";
import InventoryReview from "./pages/InventoryReview";
import Movements from "./pages/Movements";
import ManageUsers from "./pages/ManageUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/nuevo-producto" element={<NewProduct />} />
          <Route path="/salidas" element={<RegisterSalesOutput />} />
          <Route path="/entradas" element={<RegisterSupplierInput />} />
          {/* Asignar Ubicación moved to a modal in NewProduct; route removed */}
          <Route
            path="/administrar-categorias"
            element={<ManageCategories />}
          />
          <Route path="/revision-inventario" element={<InventoryReview />} />
          <Route
            path="/administrar-proveedores"
            element={<ManageProveedores />}
          />
          <Route path="/reportes" element={<InventoryReport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/movimientos" element={<Movements />} />
          <Route path="/administrar-usuarios" element={<ManageUsers />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
