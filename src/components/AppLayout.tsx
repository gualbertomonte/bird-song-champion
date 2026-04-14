import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bird, LayoutDashboard, Trophy, Stethoscope, Search,
  ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import logo from '@/assets/logo.png';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/plantel', icon: Bird, label: 'Plantel' },
  { to: '/torneios', icon: Trophy, label: 'Torneios' },
  { to: '/saude', icon: Stethoscope, label: 'Saúde' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 h-screen z-50 flex flex-col bg-sidebar text-sidebar-foreground
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
          <img src={logo} alt="Aves de Fibra" className="w-8 h-8 object-contain" />
          {!collapsed && <span className="font-heading font-bold text-lg text-sidebar-primary">Aves de Fibra</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(item => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center p-3 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b px-4 md:px-6 h-14 flex items-center gap-4">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por anilha, nome..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted/50 border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
