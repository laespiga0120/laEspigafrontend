import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NewProduct from "./pages/NewProduct";
import ManageCategories from "./pages/ManageCategories";
import RegisterSalesOutput from "./pages/RegisterSalesOutput";
import RegisterSupplierInput from "./pages/RegisterSupplierInput";
import InventoryReport from "./pages/InventoryReport";
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
          <Route path="/nuevo-producto" element={<NewProduct />} />
          <Route path="/salidas" element={<RegisterSalesOutput />} />
          <Route path="/entradas" element={<RegisterSupplierInput />} />
          {/* Asignar Ubicación moved to a modal in NewProduct; route removed */}
          <Route path="/administrar-categorias" element={<ManageCategories />} />
          <Route path="/reportes" element={<InventoryReport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
