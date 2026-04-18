import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Plantel from "@/pages/Plantel";
import BirdDetail from "@/pages/BirdDetail";
import Torneios from "@/pages/Torneios";
import TorneioNovo from "@/pages/TorneioNovo";
import TorneioDetalhe from "@/pages/TorneioDetalhe";
import ConviteTorneio from "@/pages/ConviteTorneio";
import EntrarGrupo from "@/pages/EntrarGrupo";
import HistoricoTorneios from "@/pages/HistoricoTorneios";
import Grupos from "@/pages/Grupos";
import GrupoNovo from "@/pages/GrupoNovo";
import GrupoDetalhe from "@/pages/GrupoDetalhe";
import BateriaDetalhe from "@/pages/BateriaDetalhe";
import PontuarBateria from "@/pages/PontuarBateria";
import BateriaPublica from "@/pages/BateriaPublica";
import Saude from "@/pages/Saude";
import Bercario from "@/pages/Bercario";
import Perfil from "@/pages/Perfil";
import ArvoreGenealogica from "@/pages/ArvoreGenealogica";
import Emprestimos from "@/pages/Emprestimos";
import Amigos from "@/pages/Amigos";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "./pages/NotFound.tsx";
import { Bird } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Bird className="w-10 h-10 mx-auto text-secondary animate-pulse" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    return <Navigate to={redirect && redirect.startsWith('/') ? redirect : '/'} replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/torneio/convite/:token" element={<ConviteTorneio />} />
            <Route path="/entrar/grupo/:token" element={<EntrarGrupo />} />
            <Route path="/p/bateria/:id" element={<BateriaPublica />} />

            {/* Protected routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <AppProvider>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/plantel" element={<Plantel />} />
                      <Route path="/ave/:id" element={<BirdDetail />} />
                      <Route path="/arvore" element={<ArvoreGenealogica />} />
                      <Route path="/torneios" element={<Torneios />} />
                      <Route path="/torneios/novo" element={<TorneioNovo />} />
                      <Route path="/torneios/:id" element={<TorneioDetalhe />} />
                      <Route path="/historico-torneios" element={<HistoricoTorneios />} />
                      <Route path="/grupos" element={<Grupos />} />
                      <Route path="/grupos/novo" element={<GrupoNovo />} />
                      <Route path="/grupos/:id" element={<GrupoDetalhe />} />
                      <Route path="/grupos/:id/baterias/:bateriaId" element={<BateriaDetalhe />} />
                      <Route path="/grupos/:id/eventos/:bateriaId" element={<BateriaDetalhe />} />
                      <Route path="/grupos/:id/baterias/:bateriaId/pontuar" element={<PontuarBateria />} />
                      <Route path="/grupos/:id/eventos/:bateriaId/pontuar" element={<PontuarBateria />} />
                      <Route path="/saude" element={<Saude />} />
                      <Route path="/bercario" element={<Bercario />} />
                      <Route path="/emprestimos" element={<Emprestimos />} />
                      <Route path="/amigos" element={<Amigos />} />
                      <Route path="/perfil" element={<Perfil />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </AppProvider>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
