import { NavLink, Outlet } from 'react-router-dom';
import { Shield, LayoutDashboard, Users, ScrollText } from 'lucide-react';

const items = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuários' },
  { to: '/admin/logs', icon: ScrollText, label: 'Logs' },
];

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h1 className="heading-serif text-2xl font-semibold text-foreground">Modo Administrador</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Painel de Controle PlantelPro</p>
          </div>
        </div>
        <nav className="flex gap-1 bg-muted/40 p-1 rounded-xl">
          {items.map(it => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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
  );
}
