import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAmigos } from '@/hooks/useAmigos';
import { toast } from 'sonner';

export default function GrupoNovo() {
  const navigate = useNavigate();
  const { amigos } = useAmigos();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [regulamento, setRegulamento] = useState('');
  const [convidar, setConvidar] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const toggle = (uid: string) => setConvidar(s => s.includes(uid) ? s.filter(x => x !== uid) : [...s, uid]);

  const submit = async () => {
    if (!nome.trim()) { toast.error('Informe o nome do grupo'); return; }
    setSalvando(true);
    try {
      const { data: grupoId, error } = await supabase.rpc('criar_grupo_torneio', {
        _nome: nome.trim(),
        _descricao: descricao || null,
        _regulamento: regulamento || null,
      });
      if (error) throw error;
      // Convidar amigos selecionados
      for (const uid of convidar) {
        await supabase.rpc('convidar_membro_grupo', { _grupo_id: grupoId, _user_id: uid });
      }
      toast.success('Grupo criado!');
      navigate(`/grupos/${grupoId}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSalvando(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={() => navigate('/grupos')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h1 className="heading-serif text-2xl font-semibold">Novo grupo de torneio</h1>

      <div className="space-y-4 p-4 rounded-2xl bg-card border border-border">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nome do grupo *</label>
          <input value={nome} onChange={e => setNome(e.target.value)} className="input-field" placeholder="Ex: Grupo dos Curiós SP" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Descrição</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} className="input-field" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Regulamento padrão</label>
          <textarea value={regulamento} onChange={e => setRegulamento(e.target.value)} rows={4} className="input-field" placeholder="Será usado como padrão nas baterias" />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-card border border-border">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Convidar amigos ({convidar.length})
        </h3>
        {amigos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem amigos cadastrados. Você poderá convidar depois.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {amigos.map(a => {
              const sel = convidar.includes(a.other_user_id!);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(a.other_user_id!)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                    sel ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/40'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${sel ? 'border-secondary bg-secondary' : 'border-muted-foreground/40'}`} />
                  <span className="text-sm flex-1 truncate">{a.other_nome_criadouro || a.other_email}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button disabled={salvando} onClick={submit} className="w-full btn-primary">
        {salvando ? 'Criando…' : 'Criar grupo'}
      </button>
    </div>
  );
}
