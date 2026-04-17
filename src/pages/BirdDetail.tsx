import { useParams, Link } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Bird as BirdIcon, ChevronLeft, Trophy, Heart, Users, QrCode, Download, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import LoanBadge from '@/components/LoanBadge';
import { generateLoanReceiptPDF } from '@/lib/pdf';
import { FileDown } from 'lucide-react';

export default function BirdDetail() {
  const { id } = useParams<{ id: string }>();
  const { birds, tournaments, healthRecords, loans, profile, deleteBird } = useAppState();
  const { user } = useAuth();
  const bird = birds.find(b => b.id === id);
  const crachaRef = useRef<HTMLDivElement>(null);
  const [showCracha, setShowCracha] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [sending, setSending] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [downloadingCracha, setDownloadingCracha] = useState(false);

  if (!bird) return (
    <div className="text-center py-20">
      <BirdIcon className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
      <p className="text-muted-foreground">Ave não encontrada</p>
      <Link to="/plantel" className="text-secondary text-sm hover:underline mt-2 inline-block">Voltar ao plantel</Link>
    </div>
  );

  const pai = birds.find(b => b.id === bird.pai_id);
  const mae = birds.find(b => b.id === bird.mae_id);
  const filhotes = birds.filter(b => b.pai_id === bird.id || b.mae_id === bird.id);
  const birdTournaments = tournaments.filter(t => t.bird_id === bird.id).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const birdHealth = healthRecords.filter(h => h.bird_id === bird.id).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const photo = bird.foto_url || bird.fotos?.[0];

  const chartData = birdTournaments.map(t => ({
    data: new Date(t.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    pontuacao: t.pontuacao,
  }));

  const avgPontuacao = birdTournaments.length > 0
    ? Math.round(birdTournaments.reduce((s, t) => s + t.pontuacao, 0) / birdTournaments.length)
    : 0;

  // Converte a foto para data URL para evitar problemas CORS no html2canvas
  const openCracha = async () => {
    setShowCracha(true);
    if (photo && !photoDataUrl) {
      try {
        const res = await fetch(photo, { mode: 'cors' });
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => setPhotoDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
      } catch {
        // Fallback: usa URL direta (pode funcionar se CORS estiver habilitado no bucket)
        setPhotoDataUrl(photo);
      }
    }
  };

  const downloadCracha = async () => {
    if (!crachaRef.current) return;
    setDownloadingCracha(true);
    try {
      const el = crachaRef.current;
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: el.offsetWidth,
        height: el.scrollHeight,
        windowWidth: el.offsetWidth,
        windowHeight: el.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = `cracha_${bird.codigo_anilha.replace(/\s/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Crachá baixado!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar crachá');
    } finally {
      setDownloadingCracha(false);
    }
  };

  const handleTransfer = async () => {
    const input = transferTo.trim();
    if (!input) {
      toast.error('Informe o e-mail ou código do criadouro');
      return;
    }
    if (sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase.rpc('transfer_bird', {
        _bird_id: bird.id,
        _destinatario: input,
      });
      if (error) {
        console.error('Transfer RPC error:', error);
        toast.error(error.message || 'Erro ao transferir ave.');
        setSending(false);
        return;
      }

      const result = (data || {}) as { recipient_email?: string; recipient_nome?: string };
      const recipientEmail = result.recipient_email || input;
      const recipientNome = result.recipient_nome || '';

      // Send email notification (non-blocking — transfer is already saved)
      supabase.functions.invoke('send-transfer-email', {
        body: {
          recipientEmail,
          birdName: bird.nome,
          birdSpecies: bird.nome_cientifico,
          birdCode: bird.codigo_anilha,
          senderName: user?.email || 'Usuário Plantel Pro+',
        },
      }).catch(err => console.error('Email error:', err));

      // Remove from local state (DB delete already done by RPC)
      deleteBird(bird.id);
      const destino = recipientNome ? `${recipientNome} (${recipientEmail})` : recipientEmail;
      toast.success(`Ave "${bird.nome}" transferida para ${destino}!`);
      setShowTransfer(false);
      setTransferTo('');
    } catch (err: any) {
      console.error('Transfer error:', err);
      toast.error(err?.message || 'Erro ao processar transferência.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <Link to="/plantel" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" /> Voltar ao plantel
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 card-premium p-5">
        <div className="w-full md:w-56 h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-muted/40 to-card flex items-center justify-center flex-shrink-0 ring-gold">
          {photo ? <img src={photo} alt={bird.nome} className="w-full h-full object-cover" /> : <BirdIcon className="w-20 h-20 text-secondary/20" />}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="label-eyebrow mb-1">Ficha da ave</p>
            <h1 className="page-title">{bird.nome}</h1>
            <p className="text-muted-foreground italic heading-serif">{bird.nome_cientifico}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm items-center">
            <span className="px-3 py-1 rounded-full bg-muted/40 font-mono text-xs">{bird.codigo_anilha}</span>
            <span className={bird.sexo === 'M' ? 'badge-active' : bird.sexo === 'F' ? 'badge-sold' : 'px-3 py-1 rounded-full bg-muted/40 text-xs font-medium'}>{bird.sexo === 'M' ? '♂ Macho' : bird.sexo === 'F' ? '♀ Fêmea' : '? A definir'}</span>
            <span className={`badge-status ${bird.status === 'Ativo' ? 'bg-success/15 text-success' : bird.status === 'Berçário' ? 'bg-info/15 text-info' : bird.status === 'Vendido' ? 'bg-secondary/15 text-secondary' : 'bg-destructive/15 text-destructive'}`}>
              {bird.status}
            </span>
            <LoanBadge status={bird.loan_status} size="sm" />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={openCracha} className="btn-primary text-xs">
              <QrCode className="w-3.5 h-3.5" /> Crachá Digital
            </button>
            <button
              onClick={() => setShowTransfer(true)}
              disabled={bird.loan_status === 'emprestada_entrada'}
              title={bird.loan_status === 'emprestada_entrada' ? 'Aves recebidas em empréstimo não podem ser transferidas' : ''}
              className="btn-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" /> Transferir Ave
            </button>
          </div>
          {bird.loan_status === 'emprestada_entrada' && (
            <div className="mt-3 p-3 rounded-lg bg-info/10 border border-info/30 text-xs text-info flex items-start gap-2">
              <BirdIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Ave recebida em empréstimo para reprodução</p>
                <p className="text-info/80 mt-0.5">
                  Esta ave pertence a <span className="font-medium">{bird.original_owner_email || 'outro criador'}</span> e está sob seus cuidados temporariamente.
                  Você não pode editar, excluir ou transferir o cadastro. Filhotes gerados pertencem a você.
                </p>
              </div>
            </div>
          )}
          {bird.loan_status === 'emprestada_saida' && (
            <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30 text-xs text-warning flex items-start gap-2">
              <Send className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Ave emprestada para outro criador</p>
                <p className="text-warning/80 mt-0.5">Acompanhe o empréstimo em <Link to="/emprestimos" className="underline">Empréstimos</Link>.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/30 border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="genealogy" className="text-xs sm:text-sm">Genealogia</TabsTrigger>
          <TabsTrigger value="tournaments" className="text-xs sm:text-sm">Torneios ({birdTournaments.length})</TabsTrigger>
          <TabsTrigger value="health" className="text-xs sm:text-sm">Saúde ({birdHealth.length})</TabsTrigger>
          <TabsTrigger value="offspring" className="text-xs sm:text-sm">Filhotes ({filhotes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-premium p-5 space-y-3">
              <h3 className="heading-serif font-semibold text-base">Dados Gerais</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Espécie', bird.nome_comum_especie || '—'],
                  ['Tipo Anilha', bird.tipo_anilha || '—'],
                  ['Diâmetro', bird.diametro_anilha || '—'],
                  ['Estado', bird.estado || '—'],
                  ['Nascimento', bird.data_nascimento ? new Date(bird.data_nascimento).toLocaleDateString('pt-BR') : '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="label-eyebrow">{label}</span>
                    <p className="font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-premium p-5 space-y-3">
              <h3 className="heading-serif font-semibold text-base">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl bg-secondary/5 border border-secondary/15">
                  <p className="number-serif text-3xl font-semibold text-secondary">{birdTournaments.length}</p>
                  <p className="label-eyebrow mt-1">Torneios</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/5 border border-secondary/15">
                  <p className="number-serif text-3xl font-semibold text-secondary">{avgPontuacao}</p>
                  <p className="label-eyebrow mt-1">Média pts</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/40">
                  <p className="number-serif text-3xl font-semibold">{filhotes.length}</p>
                  <p className="label-eyebrow mt-1">Filhotes</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/40">
                  <p className="number-serif text-3xl font-semibold">{birdHealth.length}</p>
                  <p className="label-eyebrow mt-1">Reg. Saúde</p>
                </div>
              </div>
            </div>
          </div>
          {(bird.transferido_por_email || loans.some(l => l.bird_id === bird.id || l.borrower_bird_id === bird.id)) && (
            <div className="bg-card rounded-xl border p-5 mt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Send className="w-4 h-4 text-secondary" /> Histórico de Movimentações
              </h3>
              <ul className="space-y-2.5 text-sm">
                {bird.transferido_por_email && (
                  <li className="flex items-start gap-2 pb-2 border-b border-border/40">
                    <span className="mt-0.5 w-2 h-2 rounded-full bg-info shrink-0" />
                    <div className="flex-1">
                      <p>
                        Transferida por <span className="font-medium text-foreground">{bird.transferido_por_email}</span>
                        {bird.transferido_em && <> em <span className="font-medium">{new Date(bird.transferido_em).toLocaleString('pt-BR')}</span></>}
                      </p>
                    </div>
                  </li>
                )}
                {loans
                  .filter(l => l.bird_id === bird.id || l.borrower_bird_id === bird.id)
                  .sort((a, b) => new Date(b.data_emprestimo).getTime() - new Date(a.data_emprestimo).getTime())
                  .map(l => (
                    <li key={l.id} className="flex items-start gap-2 pb-2 last:border-0 border-b border-border/40">
                      <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${l.status === 'Devolvida' ? 'bg-success' : 'bg-warning'}`} />
                      <div className="flex-1 space-y-0.5">
                        <p>
                          <span className="font-medium">Empréstimo</span> · {l.status === 'Devolvida' ? 'Devolvida' : l.status === 'Devolucao_Solicitada' ? 'Devolução solicitada' : 'Em curso'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          De {l.owner_email || '—'} para {l.borrower_email} · {new Date(l.data_emprestimo).toLocaleDateString('pt-BR')}
                          {l.data_devolucao && <> · devolvida em {new Date(l.data_devolucao).toLocaleDateString('pt-BR')}</>}
                        </p>
                        <button onClick={() => generateLoanReceiptPDF(l, profile)} className="text-xs text-secondary hover:underline inline-flex items-center gap-1 mt-0.5">
                          <FileDown className="w-3 h-3" /> Baixar recibo
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {bird.observacoes && (
            <div className="bg-card rounded-xl border p-5 mt-4">
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-sm text-muted-foreground">{bird.observacoes}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="genealogy" className="animate-fade-in">
          <div className="bg-card rounded-xl border p-6 overflow-x-auto">
            <h3 className="font-semibold mb-6">Árvore Genealógica</h3>
            <div className="flex flex-col items-center gap-4 min-w-[500px]">
              <div className="flex gap-8 flex-wrap justify-center">
                {[pai?.pai_id, pai?.mae_id, mae?.pai_id, mae?.mae_id].map((gId, i) => {
                  const g = gId ? birds.find(b => b.id === gId) : null;
                  return (
                    <div key={i} className="w-32 p-2 rounded-lg bg-muted/20 border border-border/50 text-center text-xs">
                      <p className="font-medium truncate">{g?.nome || '—'}</p>
                      <p className="text-muted-foreground truncate">{g?.codigo_anilha || 'Desconhecido'}</p>
                    </div>
                  );
                })}
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex gap-12 flex-wrap justify-center">
                {[{ label: 'Pai', b: pai }, { label: 'Mãe', b: mae }].map(({ label, b }) => (
                  <div key={label} className="w-40 p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold text-sm mt-1">{b?.nome || '—'}</p>
                    <p className="text-xs text-muted-foreground italic">{b?.nome_cientifico || ''}</p>
                    <p className="text-xs font-mono mt-1">{b?.codigo_anilha || 'Não cadastrado'}</p>
                  </div>
                ))}
              </div>
              <div className="w-px h-6 bg-secondary" />
              <div className="w-48 p-4 rounded-xl bg-secondary/10 border-2 border-secondary/30 text-center">
                <p className="font-bold">{bird.nome}</p>
                <p className="text-xs italic text-muted-foreground">{bird.nome_cientifico}</p>
                <p className="text-xs font-mono mt-1">{bird.codigo_anilha}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tournaments" className="animate-fade-in space-y-4">
          {chartData.length > 1 && (
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Evolução de Pontuação</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 10%, 16%)" />
                  <XAxis dataKey="data" tick={{ fontSize: 11, fill: 'hsl(150, 8%, 50%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(150, 8%, 50%)' }} domain={[0, 1000]} />
                  <Tooltip contentStyle={{ background: 'hsl(150, 15%, 10%)', border: '1px solid hsl(150, 10%, 16%)', borderRadius: '8px', color: 'hsl(120, 5%, 92%)' }} />
                  <Line type="monotone" dataKey="pontuacao" stroke="hsl(43, 74%, 52%)" strokeWidth={2} dot={{ fill: 'hsl(43, 74%, 52%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Torneio</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Clube</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Pontuação</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Classificação</th>
                  </tr>
                </thead>
                <tbody>
                  {birdTournaments.map(t => (
                    <tr key={t.id} className="border-b border-border/30">
                      <td className="p-3 text-muted-foreground">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 font-medium">{t.nome_torneio}</td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{t.clube || '—'}</td>
                      <td className="p-3 font-bold text-secondary">{t.pontuacao}</td>
                      <td className="p-3 hidden sm:table-cell">{t.classificacao || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {birdTournaments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum torneio registrado</p>}
          </div>
        </TabsContent>

        <TabsContent value="health" className="animate-fade-in">
          <div className="bg-card rounded-xl border p-5 space-y-3">
            <h3 className="font-semibold">Linha do Tempo</h3>
            {birdHealth.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro de saúde.</p>}
            <div className="relative space-y-4 pl-6 border-l-2 border-border/50">
              {birdHealth.map(h => (
                <div key={h.id} className="relative">
                  <div className="absolute -left-[27px] w-3 h-3 rounded-full bg-secondary border-2 border-card" />
                  <div className="p-3 rounded-lg bg-muted/20">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-1">
                      <div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">{h.tipo}</span>
                        <p className="text-sm mt-1">{h.descricao || '—'}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(h.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {h.proxima_dose && (
                      <p className="text-xs text-info mt-1">Próxima dose: {new Date(h.proxima_dose).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="offspring" className="animate-fade-in">
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Filhotes</h3>
            {filhotes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum filhote registrado.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filhotes.map(f => (
                <Link to={`/ave/${f.id}`} key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <BirdIcon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">{f.codigo_anilha} · {f.sexo === 'M' ? '♂' : '♀'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Crachá Modal */}
      {showCracha && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowCracha(false)}>
          <div className="space-y-4 animate-scale-in max-w-full my-auto" onClick={e => e.stopPropagation()}>
            {/* Crachá premium — frente */}
            <div
              ref={crachaRef}
              className="relative w-[360px] sm:w-[400px] rounded-2xl overflow-hidden text-white shadow-2xl"
              style={{
                background: 'linear-gradient(140deg, #0A2E22 0%, #0F3A2C 50%, #082118 100%)',
                border: '1px solid rgba(201,169,97,0.4)',
              }}
            >
              {/* Marca d'água */}
              <BirdIcon
                className="absolute -right-8 -bottom-8 w-56 h-56 pointer-events-none"
                style={{ color: 'rgba(201,169,97,0.06)' }}
              />
              {/* Faixa dourada superior */}
              <div
                className="h-1.5 w-full"
                style={{ background: 'linear-gradient(90deg, transparent, #C9A961, transparent)' }}
              />

              <div className="relative p-5 sm:p-6">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid rgba(201,169,97,0.18)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,169,97,0.18)', border: '1px solid rgba(201,169,97,0.4)' }}>
                      <BirdIcon className="w-5 h-5" style={{ color: '#C9A961' }} />
                    </div>
                    <div className="leading-tight">
                      <div className="font-bold text-[13px]" style={{ color: '#C9A961', fontFamily: 'Fraunces, Georgia, serif', letterSpacing: '-0.01em' }}>{profile.nome_criadouro || 'Plantel Pro+'}</div>
                      {profile.codigo_criadouro && (
                        <div className="text-[9px] font-mono" style={{ color: 'rgba(245,241,232,0.55)' }}>COD {profile.codigo_criadouro}</div>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider"
                    style={{
                      background: bird.status === 'Ativo' ? 'rgba(74,139,111,0.25)' : bird.status === 'Berçário' ? 'rgba(96,165,250,0.2)' : bird.status === 'Vendido' ? 'rgba(201,169,97,0.22)' : 'rgba(199,84,80,0.22)',
                      color: bird.status === 'Ativo' ? '#7BC4A0' : bird.status === 'Berçário' ? '#7FB6F5' : bird.status === 'Vendido' ? '#D4B97A' : '#E58885',
                    }}
                  >
                    {bird.status}
                  </span>
                </div>

                {/* Foto + nome */}
                <div className="flex gap-4">
                  <div
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(245,241,232,0.04)', boxShadow: '0 0 0 2px rgba(201,169,97,0.5), 0 0 0 5px rgba(10,46,34,1), 0 0 0 6px rgba(201,169,97,0.3)' }}
                  >
                    {photoDataUrl ? (
                      <img src={photoDataUrl} alt={bird.nome} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : photo ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : (
                      <BirdIcon className="w-10 h-10" style={{ color: 'rgba(201,169,97,0.25)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-bold text-2xl break-words" style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em', lineHeight: 1.15, paddingBottom: '2px' }}>{bird.nome}</h3>
                    <p className="text-[11px] italic break-words" style={{ color: 'rgba(245,241,232,0.6)', fontFamily: 'Fraunces, Georgia, serif', lineHeight: 1.4, paddingBottom: '2px' }}>{bird.nome_cientifico || '—'}</p>
                    <div className="inline-block px-2.5 py-1 rounded-md font-mono text-xs font-bold mt-1.5" style={{ background: 'rgba(201,169,97,0.15)', color: '#C9A961', border: '1px dashed rgba(201,169,97,0.45)', letterSpacing: '0.1em', lineHeight: 1.3 }}>
                      {bird.codigo_anilha}
                    </div>
                  </div>
                </div>

                {/* Dados */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-5 text-[11px]">
                  <Field label="Sexo" value={bird.sexo === 'M' ? '♂ Macho' : bird.sexo === 'F' ? '♀ Fêmea' : 'A definir'} />
                  <Field label="Nascimento" value={bird.data_nascimento ? new Date(bird.data_nascimento).toLocaleDateString('pt-BR') : '—'} />
                  <Field label="Espécie" value={bird.nome_comum_especie || '—'} />
                  <Field label="Estado" value={bird.estado || '—'} />
                  {pai && <Field label="Pai" value={pai.nome} />}
                  {mae && <Field label="Mãe" value={mae.nome} />}
                </div>

                {/* Rodapé com QR */}
                <div className="flex justify-between items-end mt-5 pt-3" style={{ borderTop: '1px solid rgba(201,169,97,0.18)' }}>
                  <div className="space-y-0.5">
                    <div className="text-[9px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'rgba(201,169,97,0.7)' }}>Verificado · Plantel Pro+</div>
                    <div className="text-[9px]" style={{ color: 'rgba(245,241,232,0.4)' }}>ID: {bird.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-[9px]" style={{ color: 'rgba(245,241,232,0.4)' }}>Emitido em {new Date().toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div className="p-1.5 rounded-lg" style={{ background: '#FFFFFF', boxShadow: '0 0 0 1px rgba(201,169,97,0.4)' }}>
                    <QRCodeSVG value={`https://plantelpro.lovable.app/ave/${bird.id}`} size={60} bgColor="#FFFFFF" fgColor="#0A2E22" level="M" />
                  </div>
                </div>
              </div>

              {/* Faixa dourada inferior */}
              <div
                className="h-1.5 w-full"
                style={{ background: 'linear-gradient(90deg, transparent, #C9A961, transparent)' }}
              />
            </div>

            <button onClick={downloadCracha} disabled={downloadingCracha} className="w-full btn-primary justify-center disabled:opacity-50">
              {downloadingCracha ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloadingCracha ? 'Gerando...' : 'Baixar como Imagem'}
            </button>
            <button onClick={() => setShowCracha(false)} className="w-full px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors text-center">Fechar</button>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTransfer(false)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-sm p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg">Transferir Ave</h2>
            <p className="text-sm text-muted-foreground">
              Ao transferir, todos os dados da ave (histórico de saúde, torneios, observações) serão enviados ao novo proprietário.
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground">E-mail ou Código do Criadouro *</label>
              <input
                value={transferTo}
                onChange={e => setTransferTo(e.target.value)}
                className="mt-1 input-field"
                placeholder="email@exemplo.com  ou  ABC123"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Informe o e-mail OU o código de 6 caracteres do criadouro destinatário.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowTransfer(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleTransfer} disabled={sending} className="btn-primary text-sm disabled:opacity-50"><Send className="w-3.5 h-3.5" /> {sending ? 'Enviando...' : 'Transferir'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[9px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'rgba(201,169,97,0.7)' }}>{label}</span>
      <span className="text-[12px] font-medium truncate mt-0.5" style={{ color: 'rgba(245,241,232,0.95)' }}>{value}</span>
    </div>
  );
}
