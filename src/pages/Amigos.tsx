import { useState } from 'react';
import { useAmigos } from '@/hooks/useAmigos';
import { UserPlus, Users, Inbox, Send, Check, X, Trash2, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function Amigos() {
  const { amigos, pedidosRecebidos, pedidosEnviados, loading, enviarPedido, responderPedido, removerAmizade } = useAmigos();
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const send = async () => {
    if (!input.trim()) {
      toast.error('Informe e-mail ou código do criadouro');
      return;
    }
    setSubmitting(true);
    try {
      await enviarPedido(input.trim());
      setInput('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 md:pb-6">
      <div>
        <p className="label-eyebrow mb-1">Rede</p>
        <h1 className="page-title flex items-center gap-2">
          <Users className="w-6 h-6 text-secondary" /> Amigos
        </h1>
        <p className="page-subtitle">Conecte-se com outros criadores para facilitar empréstimos, transferências e torneios.</p>
      </div>

      {/* Adicionar amigo */}
      <div className="card-premium p-4 sm:p-5 space-y-3">
        <h2 className="heading-serif font-semibold text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-secondary" /> Adicionar amigo
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="email@exemplo.com ou CÓDIGO do criadouro"
            className="input-field flex-1"
          />
          <button onClick={send} disabled={submitting} className="btn-primary justify-center disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar pedido
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Use o e-mail cadastrado ou o código de 6 caracteres do criadouro (visto no Perfil).
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
      ) : (
        <>
          {/* Pedidos recebidos */}
          {pedidosRecebidos.length > 0 && (
            <Section icon={Inbox} title="Pedidos recebidos" count={pedidosRecebidos.length}>
              {pedidosRecebidos.map(f => (
                <FriendCard key={f.id} friend={f}>
                  <button
                    onClick={() => responderPedido(f.id, true).catch(e => toast.error(e.message))}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    <Check className="w-3.5 h-3.5" /> Aceitar
                  </button>
                  <button
                    onClick={() => responderPedido(f.id, false).catch(e => toast.error(e.message))}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <X className="w-3.5 h-3.5" /> Recusar
                  </button>
                </FriendCard>
              ))}
            </Section>
          )}

          {/* Amigos */}
          <Section icon={Users} title="Meus amigos" count={amigos.length}>
            {amigos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum amigo ainda. Envie um pedido acima.
              </p>
            ) : amigos.map(f => (
              <FriendCard key={f.id} friend={f}>
                <button
                  onClick={() => { if (confirm('Remover este amigo?')) removerAmizade(f.id).catch(e => toast.error(e.message)); }}
                  className="btn-ghost text-xs text-destructive py-1.5 px-3"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </FriendCard>
            ))}
          </Section>

          {/* Pedidos enviados */}
          {pedidosEnviados.length > 0 && (
            <Section icon={Send} title="Pedidos enviados" count={pedidosEnviados.length}>
              {pedidosEnviados.map(f => (
                <FriendCard key={f.id} friend={f}>
                  <span className="text-[11px] text-muted-foreground">Aguardando…</span>
                  <button
                    onClick={() => removerAmizade(f.id).catch(e => toast.error(e.message))}
                    className="btn-ghost text-xs text-destructive py-1.5 px-2"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </FriendCard>
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, count, children }: any) {
  return (
    <div className="card-premium overflow-hidden">
      <div className="p-3 border-b border-border/60 bg-muted/10 flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="divide-y divide-border/40">{children}</div>
    </div>
  );
}

function FriendCard({ friend, children }: any) {
  return (
    <div className="flex items-center gap-3 p-3 sm:p-4">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center text-sm font-semibold text-secondary uppercase flex-shrink-0">
        {(friend.other_nome_criadouro || friend.other_email || '?').charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{friend.other_nome_criadouro || friend.other_email}</p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
          <Mail className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{friend.other_email}</span>
          {friend.other_codigo_criadouro && (
            <span className="font-mono px-1.5 py-0.5 bg-muted rounded text-[10px] flex-shrink-0">
              {friend.other_codigo_criadouro}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">{children}</div>
    </div>
  );
}
