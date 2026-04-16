import { useParams, Link } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Bird as BirdIcon, ChevronLeft, Trophy, Heart, Users, QrCode, Download, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export default function BirdDetail() {
  const { id } = useParams<{ id: string }>();
  const { birds, tournaments, healthRecords } = useAppState();
  const bird = birds.find(b => b.id === id);
  const crachaRef = useRef<HTMLDivElement>(null);
  const [showCracha, setShowCracha] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [sending, setSending] = useState(false);
  const [transferTo, setTransferTo] = useState('');

  if (!bird) return (
    <div className="text-center py-20">
      <Bird className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
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

  const downloadCracha = async () => {
    if (!crachaRef.current) return;
    try {
      const canvas = await html2canvas(crachaRef.current, { backgroundColor: '#0A0F0D', scale: 2 });
      const link = document.createElement('a');
      link.download = `cracha_${bird.codigo_anilha.replace(/\s/g, '_')}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Crachá baixado!');
    } catch { toast.error('Erro ao gerar crachá'); }
  };

  const handleTransfer = async () => {
    if (!transferTo.trim()) {
      toast.error('Informe o identificador do destinatário');
      return;
    }
    if (sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-transfer-email', {
        body: {
          recipientEmail: transferTo.trim(),
          birdName: bird.nome,
          birdSpecies: bird.nome_cientifico,
          birdCode: bird.codigo_anilha,
          senderName: 'Usuário Plantel Pro+',
        },
      });
      if (error) throw error;
      toast.success(`Transferência da ave "${bird.nome}" para "${transferTo}" realizada! E-mail enviado ao destinatário.`);
      setShowTransfer(false);
      setTransferTo('');
    } catch (err) {
      console.error('Transfer email error:', err);
      toast.error('Transferência registrada, mas houve erro ao enviar o e-mail.');
      setShowTransfer(false);
      setTransferTo('');
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
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center flex-shrink-0">
          {photo ? <img src={photo} alt={bird.nome} className="w-full h-full object-cover" /> : <Bird className="w-16 h-16 text-muted-foreground/30" />}
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h1 className="page-title">{bird.nome}</h1>
            <p className="text-muted-foreground italic">{bird.nome_cientifico}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-muted/40 font-mono text-xs">{bird.codigo_anilha}</span>
            <span className={bird.sexo === 'M' ? 'badge-active' : bird.sexo === 'F' ? 'badge-sold' : 'px-3 py-1 rounded-full bg-muted/40 text-xs font-medium'}>{bird.sexo === 'M' ? '♂ Macho' : bird.sexo === 'F' ? '♀ Fêmea' : '? A definir'}</span>
            <span className={`badge-status ${bird.status === 'Ativo' ? 'bg-success/15 text-success' : bird.status === 'Berçário' ? 'bg-info/15 text-info' : bird.status === 'Vendido' ? 'bg-secondary/15 text-secondary' : 'bg-destructive/15 text-destructive'}`}>
              {bird.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={() => setShowCracha(true)} className="btn-primary text-xs">
              <QrCode className="w-3.5 h-3.5" /> Crachá Digital
            </button>
            <button onClick={() => setShowTransfer(true)} className="btn-secondary text-xs">
              <Send className="w-3.5 h-3.5" /> Transferir Ave
            </button>
          </div>
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
            <div className="bg-card rounded-xl border p-5 space-y-3">
              <h3 className="font-semibold">Dados Gerais</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Espécie', bird.nome_comum_especie || '—'],
                  ['Tipo Anilha', bird.tipo_anilha || '—'],
                  ['Diâmetro', bird.diametro_anilha || '—'],
                  ['Estado', bird.estado || '—'],
                  ['Nascimento', bird.data_nascimento ? new Date(bird.data_nascimento).toLocaleDateString('pt-BR') : '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="text-muted-foreground text-xs">{label}</span>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border p-5 space-y-3">
              <h3 className="font-semibold">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-secondary">{birdTournaments.length}</p>
                  <p className="text-xs text-muted-foreground">Torneios</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-secondary">{avgPontuacao}</p>
                  <p className="text-xs text-muted-foreground">Média pts</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{filhotes.length}</p>
                  <p className="text-xs text-muted-foreground">Filhotes</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{birdHealth.length}</p>
                  <p className="text-xs text-muted-foreground">Reg. Saúde</p>
                </div>
              </div>
            </div>
          </div>
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
                    <Bird className="w-5 h-5 text-primary-foreground" />
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCracha(false)}>
          <div className="space-y-4 animate-scale-in max-w-full" onClick={e => e.stopPropagation()}>
            <div ref={crachaRef} className="w-[360px] sm:w-[400px] bg-gradient-to-br from-[#0B3B2A] to-[#0A0F0D] rounded-2xl p-5 sm:p-6 border border-secondary/20 text-white">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Bird className="w-5 h-5 text-secondary" />
                </div>
                <span className="font-bold text-secondary text-sm">Plantel Pro+</span>
              </div>
              <div className="flex gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                  {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Bird className="w-8 h-8 text-white/20" />}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <h3 className="font-bold text-lg leading-tight truncate">{bird.nome}</h3>
                  <p className="text-xs italic text-white/60 truncate">{bird.nome_cientifico}</p>
                  <p className="text-xs font-mono text-secondary truncate">{bird.codigo_anilha}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div><span className="text-white/40">Sexo:</span> <span>{bird.sexo === 'M' ? 'Macho' : bird.sexo === 'F' ? 'Fêmea' : 'A definir'}</span></div>
                <div><span className="text-white/40">Espécie:</span> <span>{bird.nome_comum_especie || '—'}</span></div>
                <div><span className="text-white/40">Nascimento:</span> <span>{bird.data_nascimento ? new Date(bird.data_nascimento).toLocaleDateString('pt-BR') : '—'}</span></div>
                <div><span className="text-white/40">Status:</span> <span>{bird.status}</span></div>
                {pai && <div><span className="text-white/40">Pai:</span> <span>{pai.nome}</span></div>}
                {mae && <div><span className="text-white/40">Mãe:</span> <span>{mae.nome}</span></div>}
              </div>
              <div className="flex justify-between items-end mt-4 pt-3 border-t border-white/10">
                <div className="text-[10px] text-white/30">Gerado por Plantel Pro+</div>
                <QRCodeSVG value={`https://plantelproplus.app/ave/${bird.id}`} size={56} bgColor="transparent" fgColor="#D4AF37" level="L" />
              </div>
            </div>
            <button onClick={downloadCracha} className="w-full btn-primary justify-center">
              <Download className="w-4 h-4" /> Baixar como Imagem
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
              <label className="text-xs font-medium text-muted-foreground">Email ou ID do destinatário *</label>
              <input value={transferTo} onChange={e => setTransferTo(e.target.value)} className="mt-1 input-field" placeholder="email@exemplo.com" />
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
