import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, UserPlus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface NewSignup {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

const STORAGE_KEY_LAST_SEEN = 'admin_signups_last_seen';

export default function AdminNotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<NewSignup[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [open, setOpen] = useState(false);
  const lastSeenRef = useRef<string>(localStorage.getItem(STORAGE_KEY_LAST_SEEN) || new Date(0).toISOString());

  // Carrega últimos 10 cadastros + calcula não-vistos
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id,user_id,email,display_name,created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!alive || !data) return;
      setItems(data as NewSignup[]);
      const lastSeen = lastSeenRef.current;
      const novos = data.filter((p: any) => p.created_at > lastSeen).length;
      setUnseen(novos);
    })();
    return () => { alive = false; };
  }, [user]);

  // Realtime — escuta INSERTs em profiles
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('admin-new-signups')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const novo = payload.new as NewSignup;
          setItems((prev) => [novo, ...prev].slice(0, 10));
          setUnseen((c) => c + 1);
          toast.success(`Novo cadastro: ${novo.display_name || novo.email}`, {
            description: 'Clique no sino para ver',
            duration: 5000,
          });
          // Beep curto opcional (só funciona após interação do usuário com a página)
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 880; gain.gain.value = 0.05;
            osc.start(); osc.stop(ctx.currentTime + 0.15);
          } catch {}
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsSeen = () => {
    const now = new Date().toISOString();
    lastSeenRef.current = now;
    localStorage.setItem(STORAGE_KEY_LAST_SEEN, now);
    setUnseen(0);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o && unseen > 0) markAsSeen(); }}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/60 transition-colors"
          aria-label="Novos cadastros"
        >
          <Bell className={`w-4 h-4 ${unseen > 0 ? 'text-secondary' : 'text-muted-foreground'}`} />
          {unseen > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unseen > 9 ? '9+' : unseen}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-secondary" />
            Novos cadastros
          </h3>
          {unseen > 0 && (
            <button onClick={markAsSeen} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Check className="w-3 h-3" /> Marcar lido
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-6 text-center">Nenhum cadastro ainda.</p>
          ) : (
            items.map((p) => (
              <Link
                key={p.id}
                to={`/admin/usuarios/${p.user_id}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 border-b border-border/40 hover:bg-muted/40 transition-colors"
              >
                <p className="text-sm font-medium text-foreground truncate">
                  {p.display_name || p.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
