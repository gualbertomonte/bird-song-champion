import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Plantel from "@/pages/Plantel";
import BirdDetail from "@/pages/BirdDetail";
import Torneios from "@/pages/Torneios";
import Saude from "@/pages/Saude";
import Bercario from "@/pages/Bercario";
import Perfil from "@/pages/Perfil";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/plantel" element={<Plantel />} />
              <Route path="/ave/:id" element={<BirdDetail />} />
              <Route path="/torneios" element={<Torneios />} />
              <Route path="/saude" element={<Saude />} />
              <Route path="/bercario" element={<Bercario />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
