import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Medal, Award, Share2, Bird, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClassificacaoItem {
  inscricao_id: string;
  bird_nome: string;
  codigo_anilha: string;
  estacao: number | null;
  pontos: number;
}

interface BateriaPublica {
  bateria: { id: string; nome: string; data: string; numero_estacoes: number; status: string };
  grupo: { id: string; nome: string };
  classificacao: ClassificacaoItem[];
}

export default function BateriaPublica() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BateriaPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    const load = async () => {
      const { data: r, error } = await supabase.rpc('get_bateria_publica', { _bateria_id: id });
      if (!alive) return;
      if (error || !r) { setErro(true); setLoading(false); return; }
      setData(r as unknown as BateriaPublica);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`pub-bateria-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bateria_pontuacoes', filter: `bateria_id=eq.${id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torneio_baterias', filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [id]);

  const compartilhar = async () => {
    if (!data) return;
    const url = window.location.href;
    const top = data.classificacao.slice(0, 3).map((c, i) =>
      `${['🥇','🥈','🥉'][i]} ${c.bird_nome} — ${Number(c.pontos).toFixed(1)} pts`
    ).join('\n');
    const texto = `🏆 ${data.bateria.nome} — ${data.grupo.nome}\n\n${top || 'Aguardando pontuação...'}\n\nVer classificação completa:\n${url}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    if (navigator.share) {
      try { await navigator.share({ title: data.bateria.nome, text: texto, url }); return; } catch {}
    }
    window.open(wa, '_blank');
  };

  const copiarLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success('Link copiado!'); }
    catch { toast.error('Não foi possível copiar'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Bird className="w-10 h-10 text-secondary animate-pulse" />
      </div>
    );
  }
  if (erro || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">Evento não encontrado ou link inválido.</p>
        <Link to="/" className="text-secondary text-sm hover:underline">Ir para início</Link>
      </div>
    );
  }

  const { bateria, grupo, classificacao } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5">
        {/* Header */}
        <header className="text-center space-y-2 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20">
            <Bird className="w-3.5 h-3.5 text-secondary" />
            <span className="text-[11px] font-semibold text-secondary tracking-wider uppercase">Classificação ao vivo</span>
          </div>
          <h1 className="heading-serif text-3xl md:text-4xl font-bold">{bateria.nome}</h1>
          <p className="text-sm text-muted-foreground">{grupo.nome}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(bateria.data + 'T00:00').toLocaleDateString('pt-BR')} · {bateria.numero_estacoes} estacas · {bateria.status}
          </p>
        </header>

        {/* Compartilhar */}
        <div className="flex gap-2 justify-center">
          <button onClick={compartilhar} className="btn-primary text-sm">
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
          <button onClick={copiarLink} className="btn-secondary text-sm">
            <ExternalLink className="w-4 h-4" /> Copiar link
          </button>
        </div>

        {/* Pódio */}
        {classificacao.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[1, 0, 2].map(i => {
              const c = classificacao[i];
              if (!c) return <div key={i} />;
              const isWinner = i === 0;
              const heights = ['h-32', 'h-40', 'h-24'];
              const h = heights[[1,0,2].indexOf(i)];
              const colors = ['text-secondary', 'text-muted-foreground', 'text-accent'];
              const color = colors[i === 0 ? 0 : i === 1 ? 1 : 2];
              const Icon = i === 0 ? Trophy : i === 1 ? Medal : Award;
              return (
                <div key={i} className="flex flex-col items-center justify-end">
                  <Icon className={`w-7 h-7 ${color} mb-1 ${isWinner ? 'animate-pulse' : ''}`} />
                  <p className="text-xs font-medium truncate max-w-full text-center">{c.bird_nome}</p>
                  <p className="number-serif text-lg font-bold">{Number(c.pontos).toFixed(1)}</p>
                  <div className={`w-full ${h} mt-1 rounded-t-xl bg-gradient-to-t from-card to-card/40 border border-border flex items-start justify-center pt-2`}>
                    <span className="number-serif text-2xl font-bold opacity-50">{i + 1}º</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabela */}
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 w-10">#</th>
                <th className="text-left px-3 py-2">Ave</th>
                <th className="text-center px-3 py-2 w-14">Estaca</th>
                <th className="text-right px-3 py-2 w-16">Pts</th>
              </tr>
            </thead>
            <tbody>
              {classificacao.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Sem inscrições aprovadas ainda</td></tr>
              ) : classificacao.map((c, i) => (
                <tr key={c.inscricao_id} className="border-t border-border">
                  <td className="px-3 py-2.5 font-semibold">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium truncate">{c.bird_nome}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{c.codigo_anilha}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center text-secondary font-bold">{c.estacao || '—'}</td>
                  <td className="px-3 py-2.5 text-right number-serif font-semibold">{Number(c.pontos).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-[11px] text-muted-foreground pt-4 pb-8">
          Atualiza automaticamente · <Link to="/" className="text-secondary hover:underline">PlantelPro</Link>
        </p>
      </div>
    </div>
  );
}
