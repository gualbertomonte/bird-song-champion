import { useEffect, useState } from 'react';
import { X, UserPlus, Link2, Mail, Users, Copy, Check, Send, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAmigos } from '@/hooks/useAmigos';
import { toast } from 'sonner';

interface Props {
  grupoId: string;
  grupoNome: string;
  conviteToken: string;
  membrosUserIds: string[];
  convitesUserIds: string[];
  initialTab?: TabKey;
  onClose: () => void;
  onDone: () => void;
}

type TabKey = 'link' | 'email' | 'amigos';

export default function ConvidarMembroModal({
  grupoId, grupoNome, conviteToken, membrosUserIds, convitesUserIds,
  initialTab = 'link', onClose, onDone,
}: Props) {
  const { amigos } = useAmigos();
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [copied, setCopied] = useState(false);
  const [busca, setBusca] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const link = `${window.location.origin}/entrar/grupo/${conviteToken}`;
  const msgWhatsapp = `Você foi convidado para o grupo "${grupoNome}" no Plantel Pro+. Entre por aqui: ${link}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const compartilharWhats = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(msgWhatsapp)}`, '_blank');
  };

  const compartilharNativo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Grupo ${grupoNome}`, text: msgWhatsapp, url: link });
      } catch {}
    } else {
      copiar();
    }
  };

  const enviarEmail = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Informe um e-mail válido');
      return;
    }
    setEnviandoEmail(true);
    try {
      const { data, error } = await supabase.rpc('convidar_por_email_grupo', {
        _grupo_id: grupoId, _email: email,
      });
      if (error) throw error;
      const res = data as any;
      if (res?.tipo === 'app') {
        toast.success(`${email} já tem conta — convite enviado dentro do app`);
      } else {
        toast.success(`Convite registrado para ${email}`);
      }
      setEmailInput('');
      onDone();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar convite');
    } finally {
      setEnviandoEmail(false);
    }
  };

  const disponiveis = amigos.filter(a =>
    a.other_user_id &&
    !membrosUserIds.includes(a.other_user_id) &&
    !convitesUserIds.includes(a.other_user_id)
  );
  const filtrados = disponiveis.filter(a => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (a.other_nome_criadouro || '').toLowerCase().includes(q)
      || (a.other_email || '').toLowerCase().includes(q)
      || (a.other_codigo_criadouro || '').toLowerCase().includes(q);
  });

  const toggle = (uid: string) => {
    setSelecionados(s => s.includes(uid) ? s.filter(x => x !== uid) : [...s, uid]);
  };

  const enviarAmigos = async () => {
    if (!selecionados.length) return;
    setEnviando(true);
    try {
      let ok = 0;
      for (const uid of selecionados) {
        const { error } = await supabase.rpc('convidar_membro_grupo', { _grupo_id: grupoId, _user_id: uid });
        if (!error) ok++;
      }
      toast.success(`${ok} convite(s) enviado(s)`);
      setSelecionados([]);
      onDone();
    } catch (e: any) { toast.error(e.message); } finally { setEnviando(false); }
  };

  const TabButton = ({ k, icon: Icon, label }: { k: TabKey; icon: any; label: string }) => (
    <button
      onClick={() => setTab(k)}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium border-b-2 transition-all ${
        tab === k ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-t-2xl md:rounded-2xl border border-border w-full md:max-w-md max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="heading-serif font-semibold">Convidar para o grupo</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex border-b border-border">
          <TabButton k="link" icon={Link2} label="Link" />
          <TabButton k="email" icon={Mail} label="Email" />
          <TabButton k="amigos" icon={Users} label="Amigos" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'link' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Compartilhe este link com qualquer pessoa. Quem ainda não tem conta poderá criar uma e entrar direto no grupo.
              </p>
              <div className="flex items-center gap-2 p-2 rounded-xl border border-border bg-muted/20">
                <input readOnly value={link} className="flex-1 bg-transparent text-xs text-foreground truncate outline-none" />
                <button onClick={copiar} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Copiar">
                  {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <button onClick={compartilharWhats} className="w-full btn-primary flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Compartilhar no WhatsApp
              </button>
              <button onClick={compartilharNativo} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border hover:border-secondary/40 text-sm font-medium">
                Outras opções
              </button>
            </div>
          )}

          {tab === 'email' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Informe o e-mail. Se a pessoa já tiver conta, recebe um convite no app. Se não, registramos o convite e ele será vinculado quando ela se cadastrar.
              </p>
              <div className="space-y-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="input-field"
                  onKeyDown={e => { if (e.key === 'Enter') enviarEmail(); }}
                />
                <button
                  disabled={enviandoEmail || !emailInput.trim()}
                  onClick={enviarEmail}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> {enviandoEmail ? 'Enviando…' : 'Enviar convite'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Dica: o link público da aba "Link" funciona melhor para grupos do WhatsApp.
              </p>
            </div>
          )}

          {tab === 'amigos' && (
            <div className="space-y-3">
              {disponiveis.length > 5 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    className="input-field pl-9"
                    placeholder="Buscar amigo…"
                  />
                </div>
              )}
              {filtrados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {disponiveis.length === 0
                    ? 'Nenhum amigo disponível para convidar. Use a aba "Link" ou "Email" para convidar quem ainda não está no app.'
                    : 'Nenhum amigo corresponde à busca.'}
                </p>
              ) : filtrados.map(a => {
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
          )}
        </div>

        {tab === 'amigos' && selecionados.length > 0 && (
          <div className="p-4 border-t border-border bg-card">
            <button
              disabled={enviando}
              onClick={enviarAmigos}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Convidar ({selecionados.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
