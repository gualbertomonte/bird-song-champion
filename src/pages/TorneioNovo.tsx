import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export default function TorneioNovo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    data: new Date().toISOString().slice(0, 10),
    numero_estacoes: 10,
    numero_baterias: 1,
    regulamento: '',
  });

  const save = async () => {
    if (!user) return;
    if (!form.nome.trim()) { toast.error('Informe o nome do torneio'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('torneios').insert({
      organizer_user_id: user.id,
      nome: form.nome.trim(),
      data: form.data,
      numero_estacoes: form.numero_estacoes,
      numero_baterias: form.numero_baterias,
      regulamento: form.regulamento.trim() || null,
      status: 'Inscricoes',
    }).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Torneio criado!');
    navigate(`/torneios/${data.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <button onClick={() => navigate('/torneios')} className="btn-ghost text-xs">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </button>

      <div>
        <p className="label-eyebrow mb-1">Novo torneio</p>
        <h1 className="page-title flex items-center gap-2"><Trophy className="w-6 h-6 text-secondary" /> Criar Torneio</h1>
      </div>

      <div className="card-premium p-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nome do Torneio *</label>
          <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="mt-1 input-field" placeholder="Ex.: Copa de Verão 2026" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Data *</label>
            <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="mt-1 input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nº Estacas</label>
            <input type="number" min={1} max={500} value={form.numero_estacoes} onChange={e => setForm({ ...form, numero_estacoes: Number(e.target.value) })} className="mt-1 input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nº Baterias</label>
            <input type="number" min={1} max={50} value={form.numero_baterias} onChange={e => setForm({ ...form, numero_baterias: Number(e.target.value) })} className="mt-1 input-field" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Regulamento (opcional)</label>
          <textarea
            value={form.regulamento}
            onChange={e => setForm({ ...form, regulamento: e.target.value })}
            rows={6}
            className="mt-1 input-field"
            placeholder="Descreva regras, critérios de pontuação, restrições por idade/sexo, etc."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => navigate('/torneios')} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted">Cancelar</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            <Check className="w-4 h-4" /> {saving ? 'Salvando…' : 'Criar Torneio'}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Após criar, você poderá convidar participantes e gerenciar inscrições.
      </p>
    </div>
  );
}
