import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Delete } from 'lucide-react';
import { useBateria } from '@/hooks/useBateria';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PontuarBateria() {
  const { id, bateriaId } = useParams<{ id: string; bateriaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bateria, grupo, inscricoes, pontuacoes, loading } = useBateria(bateriaId);
  const [idx, setIdx] = useState(0);
  const [valor, setValor] = useState('');
  const [salvando, setSalvando] = useState(false);

  const aprovadasComEstacao = useMemo(
    () => inscricoes
      .filter(i => i.status === 'Aprovada' && i.estacao !== null)
      .sort((a, b) => (a.estacao || 0) - (b.estacao || 0)),
    [inscricoes]
  );

  const atual = aprovadasComEstacao[idx];
  const pontuacaoAtual = atual ? pontuacoes.find(p => p.inscricao_id === atual.id) : null;

  useEffect(() => {
    if (atual) {
      const p = pontuacoes.find(x => x.inscricao_id === atual.id);
      setValor(p ? String(p.pontos) : '');
    }
  }, [atual?.id, pontuacoes]);

  if (loading) return <p className="text-sm text-muted-foreground text-center py-12">Carregando…</p>;
  if (!bateria || !grupo) return <p className="text-sm text-muted-foreground text-center py-12">Bateria não encontrada</p>;

  const isAdmin = grupo.admin_user_id === user?.id;
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Apenas o admin do grupo pode lançar pontuação.</p>
        <button onClick={() => navigate(`/grupos/${id}/baterias/${bateriaId}`)} className="btn-secondary">Voltar</button>
      </div>
    );
  }

  if (bateria.status === 'Encerrada') {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Esta bateria está encerrada — pontuação bloqueada.</p>
        <button onClick={() => navigate(`/grupos/${id}/baterias/${bateriaId}`)} className="btn-secondary">Voltar</button>
      </div>
    );
  }

  if (aprovadasComEstacao.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Realize o sorteio das estacas antes de pontuar.</p>
        <button onClick={() => navigate(`/grupos/${id}/baterias/${bateriaId}`)} className="btn-secondary">Voltar</button>
      </div>
    );
  }

  const salvarESeguir = async (proximo: 'next' | 'prev' | 'stay') => {
    if (!atual) return;
    const num = parseFloat(valor.replace(',', '.'));
    if (valor !== '' && !isNaN(num)) {
      // só salva se mudou
      if (!pontuacaoAtual || Number(pontuacaoAtual.pontos) !== num) {
        setSalvando(true);
        const { error } = await supabase.rpc('registrar_pontuacao_bateria', {
          _inscricao_id: atual.id,
          _pontos: num,
        });
        setSalvando(false);
        if (error) { toast.error(error.message); return; }
      }
    }
    if (proximo === 'next' && idx < aprovadasComEstacao.length - 1) setIdx(idx + 1);
    if (proximo === 'prev' && idx > 0) setIdx(idx - 1);
  };

  const apertarTecla = (k: string) => {
    if (k === 'del') { setValor(v => v.slice(0, -1)); return; }
    if (k === '.') { if (!valor.includes('.')) setValor(v => (v === '' ? '0.' : v + '.')); return; }
    setValor(v => (v + k).slice(0, 6));
  };

  const total = aprovadasComEstacao.length;
  const pontuadas = aprovadasComEstacao.filter(i => pontuacoes.some(p => p.inscricao_id === i.id)).length;
  const progresso = total > 0 ? Math.round((pontuadas / total) * 100) : 0;
  const teclas = ['7','8','9','4','5','6','1','2','3','.','0','del'];

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-3 border-b border-border">
        <button onClick={() => navigate(`/grupos/${id}/baterias/${bateriaId}`)} className="btn-ghost">
          <ArrowLeft className="w-4 h-4" /> Sair
        </button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{bateria.nome}</p>
          <p className="text-[11px] text-muted-foreground">{pontuadas}/{total} pontuadas</p>
        </div>
        <div className="w-16 text-right">
          <span className="text-xs font-semibold text-secondary">{progresso}%</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-secondary transition-all" style={{ width: `${progresso}%` }} />
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 overflow-hidden">
        <p className="label-eyebrow mb-1">Estaca</p>
        <p className="number-serif text-7xl font-bold text-secondary leading-none">{atual?.estacao}</p>
        <p className="heading-serif text-xl font-semibold mt-3 text-center truncate max-w-full">{atual?.bird_snapshot?.nome}</p>
        <p className="text-xs text-muted-foreground font-mono mt-1">{atual?.bird_snapshot?.codigo_anilha}</p>

        <div className="mt-5 w-full max-w-xs">
          <div className="text-center p-4 rounded-2xl bg-card border-2 border-secondary/40 min-h-[68px] flex items-center justify-center">
            <span className="number-serif text-4xl font-bold">{valor || '—'}</span>
          </div>
          {pontuacaoAtual && (
            <p className="text-[11px] text-muted-foreground text-center mt-1">
              Já pontuada: {pontuacaoAtual.pontos}
            </p>
          )}
        </div>
      </div>

      {/* Teclado */}
      <div className="px-3 pb-2 grid grid-cols-3 gap-2">
        {teclas.map(k => (
          <button
            key={k}
            onClick={() => apertarTecla(k)}
            className="h-14 rounded-xl bg-muted/60 hover:bg-muted active:scale-95 text-2xl font-semibold transition-all flex items-center justify-center"
          >
            {k === 'del' ? <Delete className="w-5 h-5" /> : k}
          </button>
        ))}
      </div>

      {/* Navegação */}
      <div className="px-3 pb-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => salvarESeguir('prev')}
          disabled={idx === 0 || salvando}
          className="h-14 rounded-xl bg-muted/60 hover:bg-muted disabled:opacity-30 flex items-center justify-center gap-2 font-medium transition-all"
        >
          <ChevronLeft className="w-5 h-5" /> Anterior
        </button>
        <button
          onClick={() => salvarESeguir('stay')}
          disabled={salvando || !valor}
          className="h-14 rounded-xl bg-success/20 text-success hover:bg-success/30 disabled:opacity-40 flex items-center justify-center gap-2 font-semibold transition-all"
        >
          <Check className="w-5 h-5" /> Salvar
        </button>
        <button
          onClick={() => salvarESeguir('next')}
          disabled={idx === total - 1 || salvando}
          className="h-14 rounded-xl btn-primary disabled:opacity-40 justify-center"
        >
          Próxima <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
