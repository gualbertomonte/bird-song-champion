import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAmigos } from '@/hooks/useAmigos';
import { toast } from 'sonner';

interface Props {
  grupoId: string;
  membrosUserIds: string[];
  convitesUserIds: string[];
  onClose: () => void;
  onDone: () => void;
}

export default function ConvidarMembroModal({ grupoId, membrosUserIds, convitesUserIds, onClose, onDone }: Props) {
  const { amigos } = useAmigos();
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const disponiveis = amigos.filter(a =>
    a.other_user_id &&
    !membrosUserIds.includes(a.other_user_id) &&
    !convitesUserIds.includes(a.other_user_id)
  );

  const toggle = (uid: string) => {
    setSelecionados(s => s.includes(uid) ? s.filter(x => x !== uid) : [...s, uid]);
  };

  const enviar = async () => {
    if (!selecionados.length) return;
    setEnviando(true);
    try {
      let ok = 0;
      for (const uid of selecionados) {
        const { error } = await supabase.rpc('convidar_membro_grupo', { _grupo_id: grupoId, _user_id: uid });
        if (!error) ok++;
        else console.error(error);
      }
      toast.success(`${ok} convite(s) enviado(s)`);
      onDone();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-t-2xl md:rounded-2xl border border-border w-full md:max-w-md max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="heading-serif font-semibold">Convidar amigos</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {disponiveis.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum amigo disponível para convidar. {amigos.length === 0 && <><br/>Adicione amigos em /amigos primeiro.</>}
            </p>
          ) : disponiveis.map(a => {
            const sel = selecionados.includes(a.other_user_id!);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.other_user_id!)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  sel ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/40'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${sel ? 'border-secondary bg-secondary' : 'border-muted-foreground/40'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{a.other_nome_criadouro || a.other_email}</p>
                  {a.other_codigo_criadouro && (
                    <p className="text-[11px] text-muted-foreground font-mono">{a.other_codigo_criadouro}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-border bg-card">
          <button
            disabled={enviando || selecionados.length === 0}
            onClick={enviar}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Convidar ({selecionados.length})
          </button>
        </div>
      </div>
    </div>
  );
}
