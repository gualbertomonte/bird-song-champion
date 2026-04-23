import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Trophy, Calendar, Users, Shuffle, Lock, Check, X,
  Plus, Trash2, Mail, Link as LinkIcon, Medal, FileText, Loader2, Download, UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useAppState } from '@/context/AppContext';
import { useTorneioDetalhe } from '@/hooks/useTorneios';
import { useAmigos } from '@/hooks/useAmigos';
import { calcularClassificacao } from '@/types/torneio';
import { gerarRelatorioTorneio } from '@/lib/pdf';

type TabKey = 'visao' | 'inscricoes' | 'sorteio' | 'pontuacao' | 'classificacao' | 'auditoria';

export default function TorneioDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { birds, profile } = useAppState();
  const { torneio, inscricoes, pontuacoes, convites, auditLog, criadores, loading, refresh } = useTorneioDetalhe(id);
  const [tab, setTab] = useState<TabKey>('visao');
  const [convidarOpen, setConvidarOpen] = useState(false);
  const [inscreverOpen, setInscreverOpen] = useState(false);

  const isOrganizer = !!torneio && torneio.organizer_user_id === user?.id;
  const minhasAves = inscricoes.filter(i => i.participante_user_id === user?.id);

  const classificacao = useMemo(() => calcularClassificacao(inscricoes, pontuacoes), [inscricoes, pontuacoes]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>;
  }
  if (!torneio) {
    return <p className="text-center py-20 text-muted-foreground">Torneio não encontrado</p>;
  }

  const tabs: { key: TabKey; label: string; show: boolean }[] = [
    { key: 'visao', label: 'Visão Geral', show: true },
    { key: 'inscricoes', label: 'Inscrições', show: true },
    { key: 'sorteio', label: 'Sorteio', show: torneio.status !== 'Rascunho' },
    { key: 'pontuacao', label: 'Pontuação', show: isOrganizer },
    { key: 'classificacao', label: 'Classificação', show: true },
    { key: 'auditoria', label: 'Auditoria', show: isOrganizer },
  ];

  const sortear = async () => {
    if (!confirm('Sortear estacas? Isto vai redistribuir todas as aves aprovadas.')) return;
    const { error } = await supabase.rpc('sortear_estacoes', { _torneio_id: torneio.id });
    if (error) toast.error(error.message);
    else toast.success('Sorteio realizado!');
    refresh();
  };

  const encerrar = async () => {
    if (!confirm('Encerrar o torneio? Pontuações ficarão bloqueadas.')) return;
    const { error } = await supabase.rpc('encerrar_torneio', { _torneio_id: torneio.id });
    if (error) toast.error(error.message);
    else toast.success('Torneio encerrado.');
    refresh();
  };

  const baixarPDF = () => {
    try {
      gerarRelatorioTorneio(torneio, classificacao, profile, criadores);
    } catch (e: any) {
      toast.error('Erro ao gerar PDF: ' + e.message);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <button onClick={() => navigate('/torneios')} className="btn-ghost text-xs">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </button>

      {/* Header */}
      <div className="card-premium p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-secondary" />
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary/15 text-secondary font-semibold">
                {torneio.status}
              </span>
              {isOrganizer && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Você é organizador</span>}
            </div>
            <h1 className="heading-serif text-2xl font-semibold">{torneio.nome}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(torneio.data).toLocaleDateString('pt-BR')}</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{torneio.numero_estacoes} estacas</span>
              <span>{torneio.numero_baterias} {torneio.numero_baterias === 1 ? 'evento' : 'eventos'}</span>
            </div>
          </div>
          {isOrganizer && (
            <div className="flex flex-wrap gap-2">
              {torneio.status === 'Encerrado' && (
                <button onClick={baixarPDF} className="btn-ghost text-xs"><Download className="w-3.5 h-3.5" /> PDF</button>
              )}
              {(torneio.status === 'Inscricoes' || torneio.status === 'Sorteado') && (
                <button onClick={sortear} className="btn-primary text-xs"><Shuffle className="w-3.5 h-3.5" /> Sortear</button>
              )}
              {torneio.status !== 'Encerrado' && torneio.status !== 'Rascunho' && (
                <button onClick={encerrar} className="btn-ghost text-xs text-destructive"><Lock className="w-3.5 h-3.5" /> Encerrar</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {tabs.filter(t => t.show).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Visão Geral */}
      {tab === 'visao' && (
        <div className="space-y-4">
          <div className="card-premium p-5">
            <h2 className="heading-serif font-semibold text-base mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-secondary" /> Regulamento</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{torneio.regulamento || 'Sem regulamento definido.'}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Inscritas" value={inscricoes.length} />
            <Stat label="Aprovadas" value={inscricoes.filter(i => i.status === 'Aprovada').length} />
            <Stat label="Pendentes" value={inscricoes.filter(i => i.status === 'Pendente').length} />
            <Stat label="Convites" value={convites.length} />
          </div>
          {isOrganizer && (
            <div className="card-premium p-5 space-y-3">
              <h2 className="heading-serif font-semibold text-base">Convidar participantes</h2>
              <button onClick={() => setConvidarOpen(true)} className="btn-primary text-sm"><Mail className="w-4 h-4" /> Convidar</button>
              {convites.length > 0 && (
                <ul className="space-y-1 text-xs text-muted-foreground mt-2">
                  {convites.map(c => (
                    <li key={c.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <span className="flex items-center gap-2">
                        {c.tipo === 'email' ? <Mail className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                        {c.tipo === 'email' ? c.email_convidado : 'Link aberto'}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase ${c.status === 'Aceito' ? 'text-secondary' : 'text-muted-foreground'}`}>{c.status}</span>
                        <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/torneio/convite/${c.token}`).then(() => toast.success('Link copiado!'))}
                          className="text-secondary hover:underline"><LinkIcon className="w-3 h-3" /></button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="card-premium p-5 space-y-3">
            <h2 className="heading-serif font-semibold text-base">
              {isOrganizer ? 'Inscrever minhas aves (organizador)' : 'Inscrever minhas aves'}
            </h2>
            {isOrganizer && (
              <p className="text-xs text-muted-foreground">Como organizador, você também pode inscrever suas próprias aves no torneio.</p>
            )}
            <button onClick={() => setInscreverOpen(true)} className="btn-primary text-sm" disabled={!['Rascunho','Inscricoes'].includes(torneio.status)}>
              <Plus className="w-4 h-4" /> Inscrever ave
            </button>
          </div>
          {isOrganizer && torneio.status !== 'Rascunho' && (
            <AcoesAdministrativasTorneio torneio={torneio} pontuacoes={pontuacoes} onChange={refresh} />
          )}
        </div>
      )}

      {/* Inscrições */}
      {tab === 'inscricoes' && (
        <InscricoesTab
          isOrganizer={isOrganizer}
          inscricoes={inscricoes}
          torneio={torneio}
          userId={user?.id}
          onInscrever={() => setInscreverOpen(true)}
          onChange={refresh}
        />
      )}

      {/* Sorteio */}
      {tab === 'sorteio' && (
        <SorteioTab inscricoes={inscricoes} torneio={torneio} />
      )}

      {/* Pontuação */}
      {tab === 'pontuacao' && isOrganizer && (
        <PontuacaoTab torneio={torneio} inscricoes={inscricoes} pontuacoes={pontuacoes} onChange={refresh} />
      )}

      {/* Classificação */}
      {tab === 'classificacao' && (
        <ClassificacaoTab classificacao={classificacao} torneio={torneio} userId={user?.id} criadores={criadores} />
      )}

      {/* Auditoria */}
      {tab === 'auditoria' && isOrganizer && (
        <AuditoriaTab logs={auditLog} inscricoes={inscricoes} />
      )}

      {convidarOpen && (
        <ConvidarModal torneioId={torneio.id} onClose={() => { setConvidarOpen(false); refresh(); }} />
      )}
      {inscreverOpen && (
        <InscreverModal
          torneioId={torneio.id}
          birds={birds.filter(b => b.sexo === 'M' && !inscricoes.some(i => i.bird_id === b.id))}
          onClose={() => { setInscreverOpen(false); refresh(); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-premium p-4 text-center">
      <p className="text-2xl font-bold heading-serif text-secondary">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function InscricoesTab({ isOrganizer, inscricoes, torneio, userId, onInscrever, onChange }: any) {
  const aprovar = async (id: string, aprovar: boolean) => {
    let motivo: string | null = null;
    if (!aprovar) motivo = prompt('Motivo da rejeição (opcional):') || null;
    const { error } = await supabase.rpc('aprovar_inscricao', { _inscricao_id: id, _aprovar: aprovar, _motivo: motivo });
    if (error) toast.error(error.message);
    else { toast.success(aprovar ? 'Aprovada' : 'Rejeitada'); onChange(); }
  };
  const remover = async (id: string) => {
    if (!confirm('Remover inscrição?')) return;
    const { error } = await supabase.from('torneio_inscricoes').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Removida'); onChange(); }
  };

  return (
    <div className="card-premium overflow-hidden">
      {['Rascunho','Inscricoes'].includes(torneio.status) && (
        <div className="p-3 border-b">
          <button onClick={onInscrever} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" /> Inscrever ave</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead className="bg-muted/20">
            <tr>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Ave</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Anilha</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {inscricoes.map((ins: any) => {
              const minha = ins.participante_user_id === userId;
              return (
                <tr key={ins.id} className={`border-t border-border/30 ${minha ? 'bg-secondary/5' : ''}`}>
                  <td className="p-3">{ins.bird_snapshot?.nome || '—'}</td>
                  <td className="p-3 text-muted-foreground text-xs">{ins.bird_snapshot?.codigo_anilha || '—'}</td>
                  <td className="p-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold ${
                      ins.status === 'Aprovada' ? 'bg-secondary/15 text-secondary' :
                      ins.status === 'Rejeitada' ? 'bg-destructive/15 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>{ins.status}</span>
                    {ins.motivo_rejeicao && <p className="text-[10px] text-muted-foreground mt-1">{ins.motivo_rejeicao}</p>}
                  </td>
                  <td className="p-3 text-right">
                    {isOrganizer && ins.status === 'Pendente' && (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => aprovar(ins.id, true)} className="btn-ghost p-1.5 text-secondary"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => aprovar(ins.id, false)} className="btn-ghost p-1.5 text-destructive"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                    {!isOrganizer && minha && ins.status === 'Pendente' && (
                      <button onClick={() => remover(ins.id)} className="btn-ghost p-1.5 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </td>
                </tr>
              );
            })}
            {inscricoes.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">Nenhuma inscrição ainda</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SorteioTab({ inscricoes, torneio }: any) {
  const sorteadas = inscricoes.filter((i: any) => i.estacao !== null).sort((a: any, b: any) => (a.estacao || 0) - (b.estacao || 0));
  if (sorteadas.length === 0) {
    return <div className="card-premium p-10 text-center text-sm text-muted-foreground">Sorteio ainda não realizado</div>;
  }
  return (
    <div className="card-premium overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead className="bg-muted/20">
            <tr>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground w-24">Estaca</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Ave</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Anilha</th>
            </tr>
          </thead>
          <tbody>
            {sorteadas.map((ins: any) => (
              <tr key={ins.id} className="border-t border-border/30">
                <td className="p-3 font-bold text-secondary text-lg">#{ins.estacao}</td>
                <td className="p-3">{ins.bird_snapshot?.nome}</td>
                <td className="p-3 text-muted-foreground text-xs">{ins.bird_snapshot?.codigo_anilha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PontuacaoTab({ torneio, inscricoes, pontuacoes, onChange }: any) {
  const aprovadas = inscricoes.filter((i: any) => i.status === 'Aprovada').sort((a: any, b: any) => (a.estacao || 999) - (b.estacao || 999));
  const baterias = Array.from({ length: torneio.numero_baterias }, (_, i) => i + 1);

  const getPts = (insId: string, bat: number) => {
    const p = pontuacoes.find((p: any) => p.inscricao_id === insId && p.bateria === bat);
    return p?.pontos ?? '';
  };

  const salvar = async (insId: string, bat: number, valor: string) => {
    const num = Number(valor);
    if (isNaN(num)) { toast.error('Valor inválido'); return; }
    const { error } = await supabase.rpc('registrar_pontuacao', { _inscricao_id: insId, _bateria: bat, _pontos: num });
    if (error) toast.error(error.message); else { toast.success('Salvo'); onChange(); }
  };

  if (torneio.status === 'Encerrado') {
    return <div className="card-premium p-6 text-center text-sm text-muted-foreground">Torneio encerrado — pontuação bloqueada</div>;
  }
  if (aprovadas.length === 0) {
    return <div className="card-premium p-6 text-center text-sm text-muted-foreground">Nenhuma ave aprovada para pontuar</div>;
  }

  return (
    <div className="card-premium overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/20">
          <tr>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Estaca</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Ave</th>
            {baterias.map(b => <th key={b} className="text-center p-3 text-xs font-medium text-muted-foreground">B{b}</th>)}
            <th className="text-right p-3 text-xs font-medium text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {aprovadas.map((ins: any) => {
            const total = baterias.reduce((s, b) => s + (Number(getPts(ins.id, b)) || 0), 0);
            return (
              <tr key={ins.id} className="border-t border-border/30">
                <td className="p-3 font-bold text-secondary">#{ins.estacao || '—'}</td>
                <td className="p-3">{ins.bird_snapshot?.nome}</td>
                {baterias.map(b => (
                  <td key={b} className="p-2 text-center">
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={getPts(ins.id, b)}
                      onBlur={e => {
                        const v = e.target.value;
                        if (v === '' || v === String(getPts(ins.id, b))) return;
                        salvar(ins.id, b, v);
                      }}
                      className="w-20 px-2 py-1 rounded border bg-background text-sm text-center"
                    />
                  </td>
                ))}
                <td className="p-3 text-right font-bold text-secondary">{total.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ClassificacaoTab({ classificacao, torneio, userId, criadores }: any) {
  if (classificacao.length === 0) {
    return <div className="card-premium p-10 text-center text-sm text-muted-foreground">Sem aves aprovadas ainda</div>;
  }
  const medal = (i: number) => i === 1 ? '🥇' : i === 2 ? '🥈' : i === 3 ? '🥉' : '';
  return (
    <div className="card-premium overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead className="bg-muted/20">
            <tr>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground w-16">Pos.</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Ave</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Proprietário</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Anilha</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            {classificacao.map((c: any) => {
              const minha = c.inscricao.participante_user_id === userId;
              const dono = criadores?.[c.inscricao.participante_user_id] || '—';
              return (
                <tr key={c.inscricao.id} className={`border-t border-border/30 ${minha ? 'bg-secondary/10 ring-1 ring-secondary/30' : ''}`}>
                  <td className="p-3 font-bold whitespace-nowrap">{medal(c.posicao)} {c.posicao}º</td>
                  <td className="p-3">
                    <p className="truncate max-w-[140px] sm:max-w-none">{c.inscricao.bird_snapshot?.nome}</p>
                    <p className="text-[10px] text-muted-foreground sm:hidden">{c.inscricao.bird_snapshot?.codigo_anilha}</p>
                    {minha && <span className="text-[10px] text-secondary uppercase">minha ave</span>}
                  </td>
                  <td className="p-3 text-xs truncate max-w-[140px]">{dono}</td>
                  <td className="p-3 text-muted-foreground text-xs hidden sm:table-cell">{c.inscricao.bird_snapshot?.codigo_anilha}</td>
                  <td className="p-3 text-right font-bold text-secondary text-base whitespace-nowrap">{c.totalPontos.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditoriaTab({ logs, inscricoes }: any) {
  if (logs.length === 0) return <div className="card-premium p-6 text-center text-sm text-muted-foreground">Sem alterações registradas</div>;
  const nome = (insId: string) => inscricoes.find((i: any) => i.id === insId)?.bird_snapshot?.nome || '—';
  return (
    <div className="card-premium overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/20">
          <tr>
            <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Ação</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Ave</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Evento</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l: any) => (
            <tr key={l.id} className="border-t border-border/30">
              <td className="p-2 text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-BR')}</td>
              <td className="p-2 capitalize">{l.acao}</td>
              <td className="p-2">{l.inscricao_id ? nome(l.inscricao_id) : '—'}</td>
              <td className="p-2">B{l.bateria || '—'}</td>
              <td className="p-2 text-right">
                {l.pontos_anterior !== null && <span className="text-muted-foreground line-through mr-1">{l.pontos_anterior}</span>}
                <span className="font-semibold">{l.pontos_novo ?? '—'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConvidarModal({ torneioId, onClose }: { torneioId: string; onClose: () => void }) {
  const [tipo, setTipo] = useState<'amigos' | 'email' | 'link_aberto'>('amigos');
  const [emails, setEmails] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkGerado, setLinkGerado] = useState<string | null>(null);
  const { amigos } = useAmigos();
  const [selectedAmigos, setSelectedAmigos] = useState<Set<string>>(new Set());

  const toggleAmigo = (email: string) => {
    const n = new Set(selectedAmigos);
    n.has(email) ? n.delete(email) : n.add(email);
    setSelectedAmigos(n);
  };

  const gerar = async () => {
    setSaving(true);
    try {
      if (tipo === 'link_aberto') {
        const { data, error } = await supabase.from('torneio_convites')
          .insert({ torneio_id: torneioId, tipo: 'link_aberto' })
          .select().single();
        if (error) throw error;
        setLinkGerado(`${window.location.origin}/torneio/convite/${data.token}`);
      } else if (tipo === 'amigos') {
        const lista = Array.from(selectedAmigos);
        if (lista.length === 0) { toast.error('Selecione ao menos um amigo'); setSaving(false); return; }
        const rows = lista.map(e => ({ torneio_id: torneioId, tipo: 'email' as const, email_convidado: e.toLowerCase() }));
        const { error } = await supabase.from('torneio_convites').insert(rows);
        if (error) throw error;
        toast.success(`${lista.length} convite(s) criado(s).`);
        onClose();
      } else {
        const lista = emails.split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean);
        if (lista.length === 0) { toast.error('Informe ao menos um e-mail'); setSaving(false); return; }
        const rows = lista.map(e => ({ torneio_id: torneioId, tipo: 'email' as const, email_convidado: e }));
        const { error } = await supabase.from('torneio_convites').insert(rows);
        if (error) throw error;
        toast.success(`${lista.length} convite(s) criado(s). Compartilhe os links na aba Visão Geral.`);
        onClose();
      }
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border shadow-xl w-full max-w-md max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 pb-3 flex justify-between items-center flex-shrink-0">
          <h2 className="font-bold text-xl">Convidar participantes</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="px-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setTipo('amigos')} className={`py-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 ${tipo === 'amigos' ? 'bg-secondary text-secondary-foreground' : 'bg-muted/30'}`}>
              <UserPlus className="w-4 h-4" /> Amigos
            </button>
            <button onClick={() => setTipo('email')} className={`py-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 ${tipo === 'email' ? 'bg-secondary text-secondary-foreground' : 'bg-muted/30'}`}>
              <Mail className="w-4 h-4" /> E-mail
            </button>
            <button onClick={() => setTipo('link_aberto')} className={`py-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 ${tipo === 'link_aberto' ? 'bg-secondary text-secondary-foreground' : 'bg-muted/30'}`}>
              <LinkIcon className="w-4 h-4" /> Link
            </button>
          </div>

          {tipo === 'amigos' ? (
            amigos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Você ainda não tem amigos. Adicione amigos na aba <strong>Amigos</strong> para convidá-los rapidamente.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {amigos.map(a => {
                  const email = a.other_email || '';
                  const checked = selectedAmigos.has(email);
                  return (
                    <label key={a.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${checked ? 'bg-secondary/10 border-secondary' : 'hover:bg-muted/50'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleAmigo(email)} disabled={!email} className="rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.other_nome_criadouro || email}</p>
                        <p className="text-xs text-muted-foreground truncate">{email}{a.other_codigo_criadouro ? ` · ${a.other_codigo_criadouro}` : ''}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )
          ) : tipo === 'email' ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground">E-mails (vírgula ou linha)</label>
              <textarea value={emails} onChange={e => setEmails(e.target.value)} rows={5} className="mt-1 input-field" placeholder="joao@exemplo.com, maria@exemplo.com" />
            </div>
          ) : linkGerado ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Link de convite (qualquer pessoa logada pode aceitar):</p>
              <div className="flex gap-2">
                <input readOnly value={linkGerado} className="input-field text-xs flex-1" />
                <button onClick={() => navigator.clipboard.writeText(linkGerado).then(() => toast.success('Copiado!'))} className="btn-primary text-xs">Copiar</button>
              </div>
              <a target="_blank" rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent('Você foi convidado(a) para um torneio: ' + linkGerado)}`}
                className="btn-ghost text-xs w-full justify-center">Compartilhar via WhatsApp</a>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Clique em "Gerar link" para criar um link público que qualquer pessoa logada pode usar.</p>
          )}
        </div>

        <div className="p-6 pt-3 flex justify-end gap-2 border-t flex-shrink-0 bg-card">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted">Fechar</button>
          {!linkGerado && (
            <button onClick={gerar} disabled={saving} className="btn-primary">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {tipo === 'amigos' ? `Convidar ${selectedAmigos.size > 0 ? `(${selectedAmigos.size})` : ''}` : tipo === 'email' ? 'Enviar convites' : 'Gerar link'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InscreverModal({ torneioId, birds, onClose }: { torneioId: string; birds: any[]; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const inscrever = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    for (const birdId of selected) {
      const { error } = await supabase.rpc('inscrever_ave_torneio', { _torneio_id: torneioId, _bird_id: birdId });
      if (error) toast.error(`${birdId}: ${error.message}`);
    }
    toast.success(`${selected.size} ave(s) inscrita(s) — aguardando aprovação`);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border shadow-xl w-full max-w-md max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 pb-3 flex justify-between items-center flex-shrink-0">
          <h2 className="font-bold text-xl">Inscrever aves</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="px-6 space-y-3 overflow-y-auto flex-1">
          <p className="text-xs text-muted-foreground">Apenas machos podem participar de torneios.</p>
          <div className="space-y-1">
            {birds.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum macho disponível para inscrição.</p>}
            {birds.map(b => (
              <label key={b.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer">
                <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggle(b.id)} />
                <span className="text-sm flex-1">{b.nome}</span>
                <span className="text-xs text-muted-foreground">{b.codigo_anilha}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-6 pt-3 flex justify-end gap-2 border-t flex-shrink-0 bg-card">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted">Cancelar</button>
          <button onClick={inscrever} disabled={saving || selected.size === 0} className="btn-primary">
            <Check className="w-4 h-4" /> Inscrever ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
