import { useState, useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Handshake, ArrowDownToLine, ArrowUpFromLine, History, Send, Plus, X, Calendar, Loader2, AlertCircle, Check, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { generateLoanReceiptPDF } from '@/lib/pdf';

export default function Emprestimos() {
  const { birds, loans, profile, createLoan, requestLoanReturn, confirmLoanReturn, cancelLoan } = useAppState();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ birdId: '', codigoCriadouro: '', prazo: '', observacoes: '' });

  const lendableBirds = useMemo(
    () => birds.filter(b => b.loan_status === 'proprio' && b.status === 'Ativo'),
    [birds]
  );

  const outgoing = useMemo(
    () => loans.filter(l => l.owner_user_id === user?.id && l.status !== 'Devolvida'),
    [loans, user?.id]
  );
  const incoming = useMemo(
    () => loans.filter(l => l.borrower_user_id === user?.id && l.status !== 'Devolvida'),
    [loans, user?.id]
  );
  const history = useMemo(
    () => loans.filter(l => l.status === 'Devolvida'),
    [loans]
  );

  const submit = async () => {
    if (!form.birdId || !form.codigoCriadouro.trim()) {
      toast.error('Selecione a ave e digite o código do criadouro');
      return;
    }
    setSubmitting(true);
    try {
      await createLoan({
        birdId: form.birdId,
        codigoCriadouro: form.codigoCriadouro,
        prazo: form.prazo || undefined,
        observacoes: form.observacoes || undefined,
      });
      setShowForm(false);
      setForm({ birdId: '', codigoCriadouro: '', prazo: '', observacoes: '' });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao emprestar');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'Emprestada') return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 border-0">Emprestada</Badge>;
    if (status === 'Devolucao_Solicitada') return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/20 border-0">Devolução Solicitada</Badge>;
    return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-0">Devolvida</Badge>;
  };

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Handshake className="w-6 h-6 text-secondary" />
            Empréstimos para Reprodução
          </h1>
          <p className="page-subtitle">Empreste suas aves a outros criadores ou gerencie aves recebidas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Novo Empréstimo
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowUpFromLine className="w-3.5 h-3.5" /> Saída</div>
          <p className="text-2xl font-bold mt-1">{outgoing.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowDownToLine className="w-3.5 h-3.5" /> Entrada</div>
          <p className="text-2xl font-bold mt-1">{incoming.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><History className="w-3.5 h-3.5" /> Histórico</div>
          <p className="text-2xl font-bold mt-1">{history.length}</p>
        </div>
      </div>

      <Tabs defaultValue="saida" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="saida"><ArrowUpFromLine className="w-3.5 h-3.5 mr-1.5" />Saída</TabsTrigger>
          <TabsTrigger value="entrada"><ArrowDownToLine className="w-3.5 h-3.5 mr-1.5" />Entrada</TabsTrigger>
          <TabsTrigger value="historico"><History className="w-3.5 h-3.5 mr-1.5" />Histórico</TabsTrigger>
        </TabsList>

        {/* Saída — empréstimos que eu fiz */}
        <TabsContent value="saida" className="space-y-3 mt-4">
          {outgoing.length === 0 ? (
            <EmptyState icon={ArrowUpFromLine} text="Você não fez nenhum empréstimo ativo" />
          ) : outgoing.map(loan => (
            <LoanCard key={loan.id} loan={loan} statusBadge={statusBadge} fmtDate={fmtDate}>
              <div className="text-xs text-muted-foreground">
                Para: <span className="font-medium text-foreground">{loan.borrower_email}</span>
                {loan.borrower_codigo_criadouro && <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">{loan.borrower_codigo_criadouro}</span>}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {loan.status === 'Emprestada' && (
                  <button onClick={() => requestLoanReturn(loan.id)} className="btn-secondary text-xs">
                    <Send className="w-3.5 h-3.5" /> Solicitar Devolução
                  </button>
                )}
                {loan.status === 'Devolucao_Solicitada' && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Aguardando confirmação do recebedor
                  </span>
                )}
                <button onClick={() => { if (confirm('Cancelar este empréstimo? A ave voltará ao seu plantel.')) cancelLoan(loan.id); }} className="text-xs text-destructive hover:underline px-2">
                  Cancelar
                </button>
              </div>
            </LoanCard>
          ))}
        </TabsContent>

        {/* Entrada — empréstimos que recebi */}
        <TabsContent value="entrada" className="space-y-3 mt-4">
          {incoming.length === 0 ? (
            <EmptyState icon={ArrowDownToLine} text="Você não recebeu nenhuma ave por empréstimo" />
          ) : incoming.map(loan => (
            <LoanCard key={loan.id} loan={loan} statusBadge={statusBadge} fmtDate={fmtDate}>
              <div className="text-xs text-muted-foreground">
                De: <span className="font-medium text-foreground">{loan.owner_email}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {loan.status === 'Devolucao_Solicitada' && (
                  <button onClick={() => { if (confirm('Confirmar devolução? A ave sairá do seu plantel.')) confirmLoanReturn(loan.id); }} className="btn-primary text-xs">
                    <Check className="w-3.5 h-3.5" /> Confirmar Devolução
                  </button>
                )}
                {loan.status === 'Emprestada' && (
                  <span className="text-xs text-muted-foreground">Use a ave normalmente no Berçário. Filhotes ficam em seu cadastro.</span>
                )}
              </div>
            </LoanCard>
          ))}
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="space-y-3 mt-4">
          {history.length === 0 ? (
            <EmptyState icon={History} text="Nenhum histórico ainda" />
          ) : history.map(loan => (
            <LoanCard key={loan.id} loan={loan} statusBadge={statusBadge} fmtDate={fmtDate}>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>Dono: <span className="font-medium text-foreground">{loan.owner_email}</span></div>
                <div>Recebedor: <span className="font-medium text-foreground">{loan.borrower_email}</span></div>
                <div>Devolvida em: {fmtDate(loan.data_devolucao)}</div>
                {loan.filhotes_gerados > 0 && <div>Filhotes gerados: {loan.filhotes_gerados}</div>}
              </div>
            </LoanCard>
          ))}
        </TabsContent>
      </Tabs>

      {/* Modal Novo Empréstimo */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Novo Empréstimo</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Ave a emprestar *</label>
              <select
                value={form.birdId}
                onChange={e => setForm({ ...form, birdId: e.target.value })}
                className="input-field mt-1"
              >
                <option value="">Selecione uma ave...</option>
                {lendableBirds.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nome} — {b.codigo_anilha} ({b.sexo === 'M' ? '♂' : b.sexo === 'F' ? '♀' : '?'})
                  </option>
                ))}
              </select>
              {lendableBirds.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Nenhuma ave própria disponível para empréstimo</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Código do Criadouro do Recebedor *</label>
              <input
                type="text"
                value={form.codigoCriadouro}
                onChange={e => setForm({ ...form, codigoCriadouro: e.target.value.toUpperCase() })}
                placeholder="Ex: A1B2C3"
                maxLength={6}
                className="input-field mt-1 font-mono uppercase tracking-wider"
              />
              <p className="text-[10px] text-muted-foreground mt-1">O recebedor encontra o código dele no Perfil</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Prazo Previsto (opcional)
              </label>
              <input
                type="date"
                value={form.prazo}
                onChange={e => setForm({ ...form, prazo: e.target.value })}
                className="input-field mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Observações (opcional)</label>
              <textarea
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                rows={2}
                className="input-field mt-1"
                placeholder="Combinações, finalidade, etc."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
              <button onClick={submit} disabled={submitting} className="btn-primary disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Enviando...' : 'Emprestar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function LoanCard({ loan, statusBadge, fmtDate, children }: any) {
  const snap = loan.bird_snapshot || {};
  return (
    <div className="bg-card rounded-xl border p-4 hover:border-secondary/30 transition-colors animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          {snap.foto_url ? (
            <img src={snap.foto_url} alt={snap.nome} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Handshake className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{snap.nome}</h3>
            <p className="text-xs text-muted-foreground font-mono">{snap.codigo_anilha}</p>
          </div>
        </div>
        {statusBadge(loan.status)}
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        Emprestada em {fmtDate(loan.data_emprestimo)}
        {loan.prazo_devolucao && <span> · Prazo: {fmtDate(loan.prazo_devolucao)}</span>}
      </div>
      {children}
    </div>
  );
}
