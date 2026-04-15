import { useAppState } from '@/context/AppContext';
import { Egg, Bird, Plus, X, Check, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Nest } from '@/types/bird';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

export default function Bercario() {
  const { birds, nests, addNest, updateNest, addBird } = useAppState();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ femea_id: '', macho_id: '', data_postura: '', quantidade_ovos: 3, observacoes: '' });
  const [eclosaoModal, setEclosaoModal] = useState<string | null>(null);
  const [numFilhotes, setNumFilhotes] = useState(0);

  useEffect(() => { if (searchParams.get('new') === '1') setShowForm(true); }, [searchParams]);

  const femeasBercario = birds.filter(b => b.sexo === 'F' && b.status === 'Berçário');
  const machos = birds.filter(b => b.sexo === 'M' && (b.status === 'Ativo' || b.status === 'Berçário'));
  const ninhadasIncubando = nests.filter(n => n.status === 'Incubando');
  const filhotesRecentes = birds.filter(b => {
    if (!b.data_nascimento) return false;
    const dias = (Date.now() - new Date(b.data_nascimento).getTime()) / 86400000;
    return dias <= 45 && dias >= 0;
  });

  const getBird = (id: string) => birds.find(b => b.id === id);

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

  const registrarEclosao = (nestId: string) => {
    const nest = nests.find(n => n.id === nestId);
    if (!nest || numFilhotes < 1) return;
    const mae = getBird(nest.femea_id);
    const pai = getBird(nest.macho_id);

    // Create chicks
    const newBirds = [];
    for (let i = 0; i < numFilhotes; i++) {
      const id = `${Date.now()}-${i}`;
      newBirds.push({
        id,
        codigo_anilha: `PEND-${id.slice(-6)}`,
        nome_comum: mae?.nome_comum || 'Filhote',
        nome_cientifico: mae?.nome_cientifico || pai?.nome_cientifico || '',
        sexo: 'M' as const, // default, to be updated
        data_nascimento: new Date().toISOString().split('T')[0],
        status: 'Berçário' as const,
        pai_id: nest.macho_id,
        mae_id: nest.femea_id,
        estado: mae?.estado || pai?.estado,
        created_at: new Date().toISOString(),
      });
    }

    newBirds.forEach(b => addBird(b));
    updateNest(nestId, {
      status: 'Eclodida',
      data_eclosao: new Date().toISOString().split('T')[0],
      quantidade_filhotes: numFilhotes,
    });

    setEclosaoModal(null);
    setNumFilhotes(0);
    toast.success(`${numFilhotes} filhotes registrados! Atualize os códigos de anilha.`);
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

      {/* 3-column layout */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Column 1: Fêmeas no Berçário */}
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Bird className="w-4 h-4 text-info" /> Fêmeas no Berçário ({femeasBercario.length})
          </h3>
          <div className="space-y-2">
            {femeasBercario.map(b => (
              <div key={b.id} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="font-medium text-sm">{b.nome_comum}</p>
                <p className="text-xs text-muted-foreground">{b.codigo_anilha}</p>
              </div>
            ))}
            {femeasBercario.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma fêmea no berçário</p>}
          </div>
        </div>

        {/* Column 2: Ninhadas Incubando */}
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Egg className="w-4 h-4 text-secondary" /> Incubando ({ninhadasIncubando.length})
          </h3>
          <div className="space-y-2">
            {ninhadasIncubando.map(n => {
              const mae = getBird(n.femea_id);
              const pai = getBird(n.macho_id);
              return (
                <div key={n.id} className="p-3 rounded-lg bg-secondary/5 border border-secondary/15 space-y-2">
                  <div>
                    <p className="text-sm font-medium">{mae?.nome_comum} × {pai?.nome_comum}</p>
                    <p className="text-xs text-muted-foreground">{n.quantidade_ovos} ovos · {new Date(n.data_postura).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <button
                    onClick={() => { setEclosaoModal(n.id); setNumFilhotes(n.quantidade_ovos); }}
                    className="w-full text-xs py-1.5 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Registrar Eclosão
                  </button>
                </div>
              );
            })}
            {ninhadasIncubando.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma ninhada incubando</p>}
          </div>
        </div>

        {/* Column 3: Filhotes Recentes */}
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Bird className="w-4 h-4 text-success" /> Filhotes Recentes ({filhotesRecentes.length})
          </h3>
          <div className="space-y-2">
            {filhotesRecentes.map(b => (
              <div key={b.id} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="font-medium text-sm">{b.nome_comum}</p>
                <p className="text-xs text-muted-foreground font-mono">{b.codigo_anilha}</p>
                <p className="text-xs text-muted-foreground">{b.data_nascimento ? new Date(b.data_nascimento).toLocaleDateString('pt-BR') : ''}</p>
              </div>
            ))}
            {filhotesRecentes.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Nenhum filhote recente</p>}
          </div>
        </div>
      </div>

      {/* New nest modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-md p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl">Nova Ninhada</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Fêmea *</label>
                <select value={form.femea_id} onChange={e => setForm({ ...form, femea_id: e.target.value })} className="mt-1 input-field">
                  <option value="">Selecionar...</option>
                  {birds.filter(b => b.sexo === 'F').map(b => <option key={b.id} value={b.id}>{b.nome_comum} ({b.codigo_anilha})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Macho *</label>
                <select value={form.macho_id} onChange={e => setForm({ ...form, macho_id: e.target.value })} className="mt-1 input-field">
                  <option value="">Selecionar...</option>
                  {machos.map(b => <option key={b.id} value={b.id}>{b.nome_comum} ({b.codigo_anilha})</option>)}
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

      {/* Eclosão modal */}
      {eclosaoModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEclosaoModal(null)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-sm p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl">Registrar Eclosão</h2>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Quantos filhotes nasceram?</label>
              <input type="number" min={0} max={6} value={numFilhotes} onChange={e => setNumFilhotes(Number(e.target.value))} className="mt-1 input-field" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEclosaoModal(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={() => registrarEclosao(eclosaoModal)} className="btn-primary"><Check className="w-4 h-4" /> Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
