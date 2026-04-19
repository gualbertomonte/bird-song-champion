import { lazy, Suspense, forwardRef, ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";
import { Bird } from "lucide-react";

// Helper: lazy + forwardRef wrapper to silence dev-only "Function components cannot be given refs" warning
function lazyPage(loader: () => Promise<{ default: ComponentType<any> }>) {
  const Lazy = lazy(loader);
  const Wrapped = forwardRef<unknown, any>((props, _ref) => <Lazy {...props} />);
  Wrapped.displayName = "LazyPage";
  return Wrapped;
}

// Lazy-loaded pages — code-splitting por rota
const Dashboard = lazyPage(() => import("@/pages/Dashboard"));
const Plantel = lazyPage(() => import("@/pages/Plantel"));
const BirdDetail = lazyPage(() => import("@/pages/BirdDetail"));
const Torneios = lazyPage(() => import("@/pages/Torneios"));
const TorneioNovo = lazyPage(() => import("@/pages/TorneioNovo"));
const TorneioDetalhe = lazyPage(() => import("@/pages/TorneioDetalhe"));
const ConviteTorneio = lazyPage(() => import("@/pages/ConviteTorneio"));
const EntrarGrupo = lazyPage(() => import("@/pages/EntrarGrupo"));
const HistoricoTorneios = lazyPage(() => import("@/pages/HistoricoTorneios"));
const Grupos = lazyPage(() => import("@/pages/Grupos"));
const GrupoNovo = lazyPage(() => import("@/pages/GrupoNovo"));
const GrupoDetalhe = lazyPage(() => import("@/pages/GrupoDetalhe"));
const BateriaDetalhe = lazyPage(() => import("@/pages/BateriaDetalhe"));
const PontuarBateria = lazyPage(() => import("@/pages/PontuarBateria"));
const BateriaPublica = lazyPage(() => import("@/pages/BateriaPublica"));
const Saude = lazyPage(() => import("@/pages/Saude"));
const Bercario = lazyPage(() => import("@/pages/Bercario"));
const Perfil = lazyPage(() => import("@/pages/Perfil"));
const ArvoreGenealogica = lazyPage(() => import("@/pages/ArvoreGenealogica"));
const Emprestimos = lazyPage(() => import("@/pages/Emprestimos"));
const Amigos = lazyPage(() => import("@/pages/Amigos"));
const Login = lazyPage(() => import("@/pages/Login"));
const Signup = lazyPage(() => import("@/pages/Signup"));
const ForgotPassword = lazyPage(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazyPage(() => import("@/pages/ResetPassword"));
const NotFound = lazyPage(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <Bird className="w-10 h-10 mx-auto text-secondary animate-pulse" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Bird className="w-8 h-8 text-secondary animate-pulse" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

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
          <Suspense fallback={<FullScreenLoader />}>
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
                      <Suspense fallback={<PageLoader />}>
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
                      </Suspense>
                    </AppLayout>
                  </AppProvider>
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
