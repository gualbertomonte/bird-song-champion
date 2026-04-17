import { useAppState } from '@/context/AppContext';
import { Egg, Bird as BirdIcon, Plus, X, Check, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { EclosaoParcialModal, FilhoteParcialForm } from '@/components/bercario/EclosaoParcialModal';
import { CalendarioEclosoes } from '@/components/bercario/CalendarioEclosoes';
import { DesempenhoCasais } from '@/components/bercario/DesempenhoCasais';
import { countEclodidos, isAtivo } from '@/lib/bercario';

export default function Bercario() {
  const { birds, nests, addNest, updateNest, addBird } = useAppState();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ femea_id: '', macho_id: '', data_postura: '', quantidade_ovos: 3, observacoes: '' });
  const [eclosaoNestId, setEclosaoNestId] = useState<string | null>(null);

  useEffect(() => { if (searchParams.get('new') === '1') setShowForm(true); }, [searchParams]);

  const ninhadasAtivas = nests.filter(isAtivo);
  // Fêmeas com ninhada ativa (incubando ou eclosão parcial), independente do status da ave
  const femeaIdsAtivas = new Set(ninhadasAtivas.map(n => n.femea_id));
  const femeasBercario = birds.filter(b => b.sexo === 'F' && (b.status === 'Berçário' || femeaIdsAtivas.has(b.id)));
  const machos = birds.filter(b => b.sexo === 'M' && (b.status === 'Ativo' || b.status === 'Berçário'));
  const ninhadasAtivas = nests.filter(isAtivo);
  const filhotesRecentes = birds.filter(b => {
    if (!b.data_nascimento) return false;
    const dias = (Date.now() - new Date(b.data_nascimento).getTime()) / 86400000;
    return dias <= 45 && dias >= 0;
  });

  const getBird = (id: string) => birds.find(b => b.id === id);
  const eclosaoNest = eclosaoNestId ? nests.find(n => n.id === eclosaoNestId) : null;
  const eclosaoJaCount = eclosaoNest ? countEclodidos(eclosaoNest, birds) : 0;

  const criarNinhada = () => {
    if (!form.femea_id || !form.macho_id || !form.data_postura) {
      toast.error('Preencha fêmea, macho e data da postura');
      return;
    }
    addNest({
      id: Date.now().toString(),
      femea_id: form.femea_id,
      macho_id: form.macho_id,
      data_postura: form.data_postura,
      quantidade_ovos: form.quantidade_ovos,
      status: 'Incubando',
      observacoes: form.observacoes || undefined,
      created_at: new Date().toISOString(),
    });
    setForm({ femea_id: '', macho_id: '', data_postura: '', quantidade_ovos: 3, observacoes: '' });
    setShowForm(false);
    toast.success('Ninhada registrada!');
  };

  const registrarNascimento = async (filhotes: FilhoteParcialForm[], dataNasc: string) => {
    if (!eclosaoNest) return;
    const mae = getBird(eclosaoNest.femea_id);
    const pai = getBird(eclosaoNest.macho_id);

    for (let i = 0; i < filhotes.length; i++) {
      const f = filhotes[i];
      addBird({
        id: `${Date.now()}-${i}`,
        codigo_anilha: f.codigo_anilha,
        nome: f.nome || `Filhote ${eclosaoJaCount + i + 1}`,
        nome_cientifico: mae?.nome_cientifico || pai?.nome_cientifico || '',
        nome_comum_especie: mae?.nome_comum_especie || pai?.nome_comum_especie || '',
        sexo: f.sexo,
        tipo_anilha: f.tipo_anilha,
        diametro_anilha: f.diametro_anilha,
        data_nascimento: dataNasc,
        status: 'Berçário',
        pai_id: eclosaoNest.macho_id,
        mae_id: eclosaoNest.femea_id,
        estado: mae?.estado || pai?.estado,
        gerado_no_bercario: true,
        created_at: new Date().toISOString(),
      });
    }

    const totalEclodidos = eclosaoJaCount + filhotes.length;
    const completou = totalEclodidos >= eclosaoNest.quantidade_ovos;

    updateNest(eclosaoNest.id, {
      status: completou ? 'Eclodida' : 'Eclosao Parcial',
      data_eclosao: completou ? dataNasc : eclosaoNest.data_eclosao,
      quantidade_filhotes: totalEclodidos,
    });

    setEclosaoNestId(null);
    toast.success(`${filhotes.length} nascimento(s) registrado(s)!`);
  };

  const encerrarNinhada = (nestId: string) => {
    const nest = nests.find(n => n.id === nestId);
    if (!nest) return;
    const eclodidos = countEclodidos(nest, birds);
    if (!confirm(`Encerrar esta ninhada? ${eclodidos} de ${nest.quantidade_ovos} ovos eclodiram. Os ovos restantes serão considerados não eclodidos.`)) return;
    updateNest(nestId, {
      status: 'Encerrada',
      quantidade_filhotes: eclodidos,
      data_eclosao: nest.data_eclosao || new Date().toISOString().split('T')[0],
    });
    toast.success('Ninhada encerrada');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="page-title">Berçário</h1>
          <p className="page-subtitle">Gestão de reprodução e filhotes</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary self-start">
          <Plus className="w-4 h-4" /> Nova Ninhada
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <BirdIcon className="w-4 h-4 text-info" /> Fêmeas no Berçário ({femeasBercario.length})
          </h3>
          <div className="space-y-2">
            {femeasBercario.map(b => (
              <div key={b.id} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="font-medium text-sm">{b.nome}</p>
                <p className="text-xs text-muted-foreground">{b.codigo_anilha}</p>
              </div>
            ))}
            {femeasBercario.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma fêmea no berçário</p>}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Egg className="w-4 h-4 text-secondary" /> Em incubação ({ninhadasAtivas.length})
          </h3>
          <div className="space-y-2">
            {ninhadasAtivas.map(n => {
              const mae = getBird(n.femea_id);
              const pai = getBird(n.macho_id);
              const eclodidos = countEclodidos(n, birds);
              const parcial = n.status === 'Eclosao Parcial' || eclodidos > 0;
              return (
                <div key={n.id} className="p-3 rounded-lg bg-secondary/5 border border-secondary/15 space-y-2">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{mae?.nome} × {pai?.nome}</p>
                      {parcial && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-semibold whitespace-nowrap">
                          {eclodidos}/{n.quantidade_ovos}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {n.quantidade_ovos} ovos · postura {new Date(n.data_postura).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setEclosaoNestId(n.id)}
                      disabled={eclodidos >= n.quantidade_ovos}
                      className="flex-1 text-xs py-1.5 rounded-md bg-success/10 text-success hover:bg-success/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Nascimento
                    </button>
                    <button
                      onClick={() => encerrarNinhada(n.id)}
                      className="text-xs py-1.5 px-2 rounded-md bg-muted hover:bg-muted/70 text-muted-foreground transition-colors flex items-center gap-1"
                      title="Encerrar ninhada"
                    >
                      <XCircle className="w-3 h-3" /> Encerrar
                    </button>
                  </div>
                </div>
              );
            })}
            {ninhadasAtivas.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma ninhada ativa</p>}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <BirdIcon className="w-4 h-4 text-success" /> Filhotes Recentes ({filhotesRecentes.length})
          </h3>
          <div className="space-y-2">
            {filhotesRecentes.map(b => (
              <div key={b.id} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="font-medium text-sm">{b.nome}</p>
                <p className="text-xs text-muted-foreground font-mono">{b.codigo_anilha}</p>
                <p className="text-xs text-muted-foreground">{b.data_nascimento ? new Date(b.data_nascimento).toLocaleDateString('pt-BR') : ''}</p>
              </div>
            ))}
            {filhotesRecentes.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Nenhum filhote recente</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CalendarioEclosoes ninhadas={ninhadasAtivas} birds={birds} />
        <DesempenhoCasais nests={nests} birds={birds} />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-md p-5 sm:p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl">Nova Ninhada</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Fêmea *</label>
                <select value={form.femea_id} onChange={e => setForm({ ...form, femea_id: e.target.value })} className="mt-1 input-field">
                  <option value="">Selecionar...</option>
                  {birds.filter(b => b.sexo === 'F').map(b => <option key={b.id} value={b.id}>{b.nome} ({b.codigo_anilha})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Macho *</label>
                <select value={form.macho_id} onChange={e => setForm({ ...form, macho_id: e.target.value })} className="mt-1 input-field">
                  <option value="">Selecionar...</option>
                  {machos.map(b => <option key={b.id} value={b.id}>{b.nome} ({b.codigo_anilha})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Data Postura *</label>
                  <input type="date" value={form.data_postura} onChange={e => setForm({ ...form, data_postura: e.target.value })} className="mt-1 input-field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nº Ovos</label>
                  <input type="number" min={1} max={6} value={form.quantidade_ovos} onChange={e => setForm({ ...form, quantidade_ovos: Number(e.target.value) })} className="mt-1 input-field" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} className="mt-1 input-field resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={criarNinhada} className="btn-primary"><Check className="w-4 h-4" /> Criar Ninhada</button>
            </div>
          </div>
        </div>
      )}

      {eclosaoNest && (
        <EclosaoParcialModal
          nest={eclosaoNest}
          mae={getBird(eclosaoNest.femea_id)}
          pai={getBird(eclosaoNest.macho_id)}
          jaEclodidos={eclosaoJaCount}
          onCancel={() => setEclosaoNestId(null)}
          onConfirm={registrarNascimento}
        />
      )}
    </div>
  );
}
