import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bird, LayoutDashboard, Trophy, Heart, Egg, User, Search,
  ChevronLeft, ChevronRight, Menu, Sprout, Instagram, LogOut, Loader2, Handshake, Users, Users2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppState, MobileNavKey } from '@/context/AppContext';
import NotificationBell from '@/components/NotificationBell';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/plantel', icon: Bird, label: 'Plantel' },
  { to: '/arvore', icon: Sprout, label: 'Árvore Genealógica' },
  { to: '/bercario', icon: Egg, label: 'Berçário' },
  { to: '/emprestimos', icon: Handshake, label: 'Empréstimos' },
  { to: '/torneios', icon: Trophy, label: 'Torneios' },
  { to: '/saude', icon: Heart, label: 'Saúde' },
  { to: '/amigos', icon: Users, label: 'Amigos' },
  { to: '/perfil', icon: User, label: 'Perfil' },
];

const ALL_MOBILE_ITEMS: Record<MobileNavKey, { to: string; icon: any; label: string }> = {
  dashboard: { to: '/', icon: LayoutDashboard, label: 'Home' },
  plantel: { to: '/plantel', icon: Bird, label: 'Plantel' },
  arvore: { to: '/arvore', icon: Sprout, label: 'Árvore' },
  bercario: { to: '/bercario', icon: Egg, label: 'Berçário' },
  emprestimos: { to: '/emprestimos', icon: Handshake, label: 'Emprést.' },
  torneios: { to: '/torneios', icon: Trophy, label: 'Torneios' },
  saude: { to: '/saude', icon: Heart, label: 'Saúde' },
  perfil: { to: '/perfil', icon: User, label: 'Perfil' },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { loading, mobileNavConfig } = useAppState();

  const mobileNavItems = mobileNavConfig
    .filter(c => c.visible)
    .map(c => ({ key: c.key, ...ALL_MOBILE_ITEMS[c.key] }))
    .filter(i => i.to);

  return (
    <div className="min-h-screen flex bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 h-screen z-50 flex flex-col bg-sidebar border-r border-sidebar-border
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg shadow-secondary/20">
            <Bird className="w-4 h-4 text-secondary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="heading-serif font-semibold text-[15px] text-sidebar-primary">Plantel Pro+</span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/50">Aviário Premium</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? 'sidebar-active'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                  }
                `}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-secondary' : ''}`} />
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
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            <Instagram className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Seguir no Instagram</span>}
          </a>
        </div>

        {/* User + Logout */}
        <div className="px-2 pb-3 pt-2 border-t border-sidebar-border/60">
          {!collapsed && user && (
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center text-[10px] font-semibold text-secondary uppercase">
                {(user.email || '?').charAt(0)}
              </div>
              <p className="text-[10px] text-sidebar-foreground/60 truncate flex-1">{user.email}</p>
            </div>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 w-full"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center p-3 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-secondary transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/60 px-4 md:px-6 h-16 flex items-center gap-4">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar uma ave, anilha ou espécie…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/40"
              />
            </div>
          </div>
          <NotificationBell />
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-12 h-12 text-secondary feather-spin" />
              <p className="text-sm text-muted-foreground heading-serif italic">Sincronizando seu plantel…</p>
            </div>
          ) : children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-sidebar/90 backdrop-blur-xl border-t border-sidebar-border safe-area-bottom">
        <div className="flex justify-between items-stretch py-1.5 px-1 overflow-x-auto no-scrollbar">
          {mobileNavItems.map(item => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 flex-1 min-w-[44px] rounded-xl transition-all ${
                  active ? 'text-secondary bg-secondary/10' : 'text-sidebar-foreground'
                }`}
              >
                <item.icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                <span className="text-[9px] sm:text-[10px] font-medium leading-tight truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
