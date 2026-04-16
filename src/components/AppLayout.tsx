import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bird, LayoutDashboard, Trophy, Heart, Egg, User, Search,
  ChevronLeft, ChevronRight, Menu, GitBranch, Instagram, LogOut, Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppState } from '@/context/AppContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/plantel', icon: Bird, label: 'Plantel' },
  { to: '/arvore', icon: GitBranch, label: 'Árvore Genealógica' },
  { to: '/bercario', icon: Egg, label: 'Berçário' },
  { to: '/torneios', icon: Trophy, label: 'Torneios' },
  { to: '/saude', icon: Heart, label: 'Saúde' },
  { to: '/perfil', icon: User, label: 'Perfil' },
];

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/plantel', icon: Bird, label: 'Plantel' },
  { to: '/arvore', icon: GitBranch, label: 'Árvore' },
  { to: '/bercario', icon: Egg, label: 'Berçário' },
  { to: '/torneios', icon: Trophy, label: 'Torneios' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 h-screen z-50 flex flex-col bg-sidebar border-r border-sidebar-border
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-56'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center">
            <Bird className="w-4 h-4 text-secondary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-sm text-sidebar-primary tracking-tight">Plantel Pro+</span>}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  }
                `}
              >
                <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-sidebar-primary' : ''}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Instagram link */}
        <div className="px-2 pb-1">
          <a
            href="https://www.instagram.com/tech_boxbr/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            <Instagram className="w-4.5 h-4.5 flex-shrink-0" />
            {!collapsed && <span>Seguir no Instagram</span>}
          </a>
        </div>

        {/* Logout */}
        <div className="px-2 pb-2">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 w-full"
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
          {!collapsed && user && (
            <p className="px-3 py-1 text-[10px] text-sidebar-foreground/40 truncate">{user.email}</p>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center p-3 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-4 md:px-6 h-14 flex items-center gap-4">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por anilha, nome, espécie..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-sidebar border-t border-sidebar-border safe-area-bottom">
        <div className="flex justify-around py-1.5">
          {mobileNavItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-0.5 py-1 px-1.5 min-w-0 ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground'}`}>
                <item.icon className="w-4.5 h-4.5" />
                <span className="text-[9px] sm:text-[10px] font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
