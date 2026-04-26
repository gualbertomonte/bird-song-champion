import { NavLink, Outlet } from 'react-router-dom';
import { Shield, LayoutDashboard, Users, ScrollText, FileText, Settings, LogOut, Bird, Link2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SystemBanner from '@/components/SystemBanner';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';

const items = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuários' },
  { to: '/admin/leads', icon: MessageCircle, label: 'Mensagens' },
  { to: '/admin/links', icon: Link2, label: 'Links' },
  { to: '/admin/logs', icon: ScrollText, label: 'Logs' },
  { to: '/admin/relatorios', icon: FileText, label: 'Relatórios' },
  { to: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SystemBanner />

      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg shadow-secondary/20">
              <Bird className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="heading-serif font-semibold text-[15px] text-foreground">MeuPlantelPro</span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Modo Administrador</span>
            </div>
          </div>

          <div className="flex-1" />

          <AdminNotificationBell />

          {user?.email && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center text-[10px] font-semibold text-secondary uppercase">
                {user.email.charAt(0)}
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</span>
            </div>
          )}

          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h1 className="heading-serif text-2xl font-semibold text-foreground">Painel de Controle</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Administração MeuPlantelPro</p>
              </div>
            </div>
            <nav className="flex gap-1 bg-muted/40 p-1 rounded-xl overflow-x-auto">
              {items.map(it => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-card text-secondary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  <it.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{it.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
