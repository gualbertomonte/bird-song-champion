import { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, CheckCheck } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useAppState();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unread = notifications.filter(n => !n.lida).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const fmtTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(d).toLocaleDateString('pt-BR');
  };

  const handleClick = (n: any) => {
    if (!n.lida) markNotificationRead(n.id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors text-foreground"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-card border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm">Notificações</h3>
            {unread > 0 && (
              <button onClick={markAllNotificationsRead} className="text-xs text-secondary hover:underline flex items-center gap-1">
                <CheckCheck className="w-3 h-3" /> Marcar todas
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nenhuma notificação
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`group p-3 border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/30 ${!n.lida ? 'bg-secondary/5' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex items-start gap-2">
                    {!n.lida && <span className="w-2 h-2 rounded-full bg-secondary mt-1.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{n.titulo}</p>
                      {n.mensagem && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.mensagem}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{fmtTime(n.created_at)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      aria-label="Excluir"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
