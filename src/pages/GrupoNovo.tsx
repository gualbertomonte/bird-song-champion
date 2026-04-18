import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Users, Check, CalendarPlus, SkipForward } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAmigos } from '@/hooks/useAmigos';
import { toast } from 'sonner';

type Step = 1 | 2 | 3;

export default function GrupoNovo() {
  const navigate = useNavigate();
  const { amigos } = useAmigos();
  const [step, setStep] = useState<Step>(1);
  const [salvando, setSalvando] = useState(false);

  // Step 1 — Grupo
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [regulamento, setRegulamento] = useState('');

  // Step 2 — Convites
  const [convidar, setConvidar] = useState<string[]>([]);
  const toggleAmigo = (uid: string) =>
    setConvidar(s => (s.includes(uid) ? s.filter(x => x !== uid) : [...s, uid]));

  // Step 3 — 1º evento (opcional)
  const [criarBateria, setCriarBateria] = useState(false);
  const [batNome, setBatNome] = useState('Evento 1');
  const [batData, setBatData] = useState(new Date().toISOString().slice(0, 10));
  const [batEstacas, setBatEstacas] = useState(10);

  const finalizar = async () => {
    if (!nome.trim()) { toast.error('Informe o nome do grupo'); setStep(1); return; }
    setSalvando(true);
    try {
      const { data: grupoId, error } = await supabase.rpc('criar_grupo_torneio', {
        _nome: nome.trim(),
        _descricao: descricao || null,
        _regulamento: regulamento || null,
      });
      if (error) throw error;

      // Convites
      let convOk = 0;
      for (const uid of convidar) {
        const { error: e2 } = await supabase.rpc('convidar_membro_grupo', { _grupo_id: grupoId, _user_id: uid });
        if (!e2) convOk++;
      }

      // 1º evento opcional
      let bateriaId: string | null = null;
      if (criarBateria && batNome.trim()) {
        const { data: bid, error: e3 } = await supabase.rpc('criar_bateria', {
          _grupo_id: grupoId as string,
          _nome: batNome.trim(),
          _data: batData,
          _numero_estacoes: batEstacas,
          _regulamento: regulamento || null,
        });
        if (e3) toast.error('Grupo criado, mas o evento falhou: ' + e3.message);
        else bateriaId = bid as string;
      }

      toast.success(
        `Grupo criado!${convOk > 0 ? ` ${convOk} convite(s) enviado(s).` : ''}${bateriaId ? ' Evento pronto.' : ''}`
      );
      if (bateriaId) navigate(`/grupos/${grupoId}/baterias/${bateriaId}`);
      else navigate(`/grupos/${grupoId}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSalvando(false); }
  };

  const next = () => {
    if (step === 1 && !nome.trim()) { toast.error('Informe o nome do grupo'); return; }
    setStep((s) => (s + 1) as Step);
  };
  const prev = () => setStep((s) => Math.max(1, s - 1) as Step);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={() => navigate('/torneios?tab=grupos')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div>
        <h1 className="heading-serif text-2xl font-semibold">Novo grupo de torneio</h1>
        <p className="text-sm text-muted-foreground mt-1">Passo {step} de 3</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(n => (
          <div key={n} className="flex-1 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              step >= n ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > n ? <Check className="w-3.5 h-3.5" /> : n}
            </div>
            {n < 3 && <div className={`flex-1 h-0.5 rounded ${step > n ? 'bg-secondary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Grupo */}
      {step === 1 && (
        <div className="space-y-4 p-4 rounded-2xl bg-card border border-border">
          <div>
            <h2 className="heading-serif font-semibold mb-1">Informações do grupo</h2>
            <p className="text-xs text-muted-foreground">Comece com o básico — você pode editar depois.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nome do grupo *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} className="input-field" placeholder="Ex: Grupo dos Curiós SP" autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} className="input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Regulamento padrão (opcional)</label>
            <textarea value={regulamento} onChange={e => setRegulamento(e.target.value)} rows={3} className="input-field" placeholder="Será usado como padrão nos eventos" />
          </div>
        </div>
      )}

      {/* Step 2 — Convites */}
      {step === 2 && (
        <div className="space-y-3 p-4 rounded-2xl bg-card border border-border">
          <div>
            <h2 className="heading-serif font-semibold mb-1 flex items-center gap-2">
              <Users className="w-4 h-4" /> Convidar amigos
            </h2>
            <p className="text-xs text-muted-foreground">Selecione quem você quer no grupo. Pode pular e convidar depois.</p>
          </div>
          {amigos.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-2">Você ainda não tem amigos cadastrados.</p>
              <button onClick={() => navigate('/amigos')} className="text-xs text-secondary hover:underline">
                Adicionar amigos →
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {amigos.map(a => {
                const sel = convidar.includes(a.other_user_id!);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAmigo(a.other_user_id!)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      sel ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/40'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ${
                      sel ? 'border-secondary bg-secondary' : 'border-muted-foreground/40'
                    }`}>
                      {sel && <Check className="w-3 h-3 text-secondary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.other_nome_criadouro || a.other_email}</p>
                      {a.other_codigo_criadouro && (
                        <p className="text-[11px] text-muted-foreground font-mono">{a.other_codigo_criadouro}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {convidar.length > 0 && (
            <p className="text-xs text-secondary">{convidar.length} amigo(s) selecionado(s)</p>
          )}
        </div>
      )}

      {/* Step 3 — 1º evento */}
      {step === 3 && (
        <div className="space-y-4 p-4 rounded-2xl bg-card border border-border">
          <div>
            <h2 className="heading-serif font-semibold mb-1 flex items-center gap-2">
              <CalendarPlus className="w-4 h-4" /> Primeiro evento
            </h2>
            <p className="text-xs text-muted-foreground">Já adianta o primeiro evento do grupo, ou pule e crie depois.</p>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer p-3 rounded-xl border border-border hover:border-secondary/40 transition-all">
            <input
              type="checkbox"
              checked={criarBateria}
              onChange={e => setCriarBateria(e.target.checked)}
              className="w-4 h-4 accent-secondary"
            />
            <span>Sim, criar o primeiro evento agora</span>
          </label>

          {criarBateria && (
            <div className="space-y-3 pl-2 border-l-2 border-secondary/30">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome do evento</label>
                <input value={batNome} onChange={e => setBatNome(e.target.value)} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Data</label>
                  <input type="date" value={batData} onChange={e => setBatData(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nº estacas</label>
                  <input type="number" min={1} value={batEstacas} onChange={e => setBatEstacas(parseInt(e.target.value) || 1)} className="input-field" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={prev}
          disabled={step === 1 || salvando}
          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {step < 3 ? (
          <div className="flex gap-2">
            {step === 2 && (
              <button onClick={() => { setConvidar([]); setStep(3); }} className="btn-ghost">
                <SkipForward className="w-4 h-4" /> Pular
              </button>
            )}
            <button onClick={next} disabled={salvando} className="btn-primary">
              Avançar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={finalizar} disabled={salvando} className="btn-primary">
            <Check className="w-4 h-4" /> {salvando ? 'Criando…' : 'Finalizar'}
          </button>
        )}
      </div>
    </div>
  );
}
