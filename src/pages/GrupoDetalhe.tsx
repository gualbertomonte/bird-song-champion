import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Crown, Users, Calendar, Trophy, Plus, UserPlus, LogOut, Trash2, Share2, ShieldPlus, ShieldMinus } from 'lucide-react';
import { useGrupoDetalhe } from '@/hooks/useGrupoDetalhe';
import { useAuth } from '@/context/AuthContext';
import RankingAcumuladoTable from '@/components/grupos/RankingAcumuladoTable';
import ConvidarMembroModal from '@/components/grupos/ConvidarMembroModal';
import NovaBateriaModal from '@/components/grupos/NovaBateriaModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Tab = 'visao' | 'membros' | 'baterias' | 'ranking';

export default function GrupoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { grupo, membros, convites, baterias, ranking, loading, reload } = useGrupoDetalhe(id);
  const [tab, setTab] = useState<Tab>('visao');
  const [showConvidar, setShowConvidar] = useState(false);
  const [convidarTab, setConvidarTab] = useState<'link' | 'email' | 'amigos'>('link');
  const [showNovaBateria, setShowNovaBateria] = useState(false);

  const abrirConvidar = (tab: 'link' | 'email' | 'amigos' = 'link') => {
    setConvidarTab(tab);
    setShowConvidar(true);
  };

  if (loading) return <p className="text-sm text-muted-foreground text-center py-12">Carregando…</p>;
  if (!grupo) return <p className="text-sm text-muted-foreground text-center py-12">Grupo não encontrado</p>;

  const isAdmin = grupo.admin_user_id === user?.id;
  const ativos = membros.filter(m => m.status === 'Ativo');

  const sair = async () => {
    if (!confirm('Sair deste grupo?')) return;
    try {
      const { error } = await supabase.rpc('sair_do_grupo', { _grupo_id: grupo.id });
      if (error) throw error;
      toast.success('Você saiu do grupo');
      navigate('/grupos');
    } catch (e: any) { toast.error(e.message); }
  };

  const excluirGrupo = async () => {
    if (!grupo) return;
    const txt = prompt(`Para confirmar a exclusão, digite o nome do grupo:\n\n"${grupo.nome}"\n\nIsso apagará TODAS as baterias, inscrições e pontuações deste grupo. Esta ação não pode ser desfeita.`);
    if (txt === null) return;
    if (txt.trim() !== grupo.nome) { toast.error('Nome não confere — exclusão cancelada'); return; }
    try {
      // Apaga dependências em cascata (sem FKs com ON DELETE)
      const { data: bats } = await supabase.from('torneio_baterias').select('id').eq('grupo_id', grupo.id);
      const batIds = (bats || []).map((b: any) => b.id);
      if (batIds.length > 0) {
        await supabase.from('bateria_pontuacoes').delete().in('bateria_id', batIds);
        await supabase.from('bateria_inscricoes').delete().in('bateria_id', batIds);
        await supabase.from('torneio_baterias').delete().in('id', batIds);
      }
      await supabase.from('torneio_grupo_convites').delete().eq('grupo_id', grupo.id);
      await supabase.from('torneio_grupo_membros').delete().eq('grupo_id', grupo.id);
      const { error } = await supabase.from('torneio_grupos').delete().eq('id', grupo.id);
      if (error) throw error;
      toast.success('Grupo excluído');
      navigate('/grupos');
    } catch (e: any) { toast.error(e.message || 'Erro ao excluir'); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <button onClick={() => navigate('/grupos')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Grupos
      </button>

      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="heading-serif text-2xl md:text-3xl font-semibold truncate">{grupo.nome}</h1>
            {isAdmin && <Crown className="w-5 h-5 text-secondary" />}
          </div>
          {grupo.descricao && <p className="text-sm text-muted-foreground">{grupo.descricao}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => abrirConvidar('link')}
            className="text-xs px-3 py-1.5 rounded-full border border-secondary/40 text-secondary hover:bg-secondary/10 inline-flex items-center gap-1"
            title="Compartilhar grupo"
          >
            <Share2 className="w-3 h-3" /> Compartilhar
          </button>
          {isAdmin ? (
            <button onClick={excluirGrupo} className="text-xs text-destructive hover:underline flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Excluir grupo
            </button>
          ) : (
            <button onClick={sair} className="text-xs text-destructive hover:underline flex items-center gap-1">
              <LogOut className="w-3 h-3" /> Sair do grupo
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto no-scrollbar">
        {([
          { key: 'visao', label: 'Visão Geral' },
          { key: 'membros', label: `Membros (${ativos.length})` },
          { key: 'baterias', label: `Eventos (${baterias.length})` },
          { key: 'ranking', label: 'Ranking' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'visao' && (
        <div className="space-y-5">
          {grupo.regulamento_padrao && (
            <section className="p-4 rounded-2xl bg-card border border-border">
              <h3 className="text-sm font-semibold mb-2">Regulamento padrão</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{grupo.regulamento_padrao}</p>
            </section>
          )}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Trophy className="w-4 h-4" /> Top 10 do ranking</h3>
            <RankingAcumuladoTable ranking={ranking} top={10} />
          </section>
        </div>
      )}

      {tab === 'membros' && (
        <section className="space-y-3">
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => abrirConvidar('link')} className="btn-primary inline-flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Compartilhar link
              </button>
              <button onClick={() => abrirConvidar('email')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:border-secondary/40 text-sm font-medium">
                <UserPlus className="w-4 h-4" /> Convidar por e-mail
              </button>
            </div>
          )}
          {convites.length > 0 && isAdmin && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-2">{convites.length} convite(s) aguardando resposta</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-2">
            {ativos.map(m => (
              <MembroRow
                key={m.id}
                userId={m.user_id}
                papel={m.papel}
                isYou={m.user_id === user?.id}
                isSuperAdmin={grupo.admin_user_id === m.user_id}
                viewerIsSuperAdmin={grupo.admin_user_id === user?.id}
                viewerIsAdmin={isAdmin}
                grupoId={grupo.id}
                onChange={reload}
              />
            ))}
          </div>
        </section>
      )}

      {tab === 'baterias' && (
        <section className="space-y-3">
          {isAdmin && (
            <button onClick={() => setShowNovaBateria(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo evento
            </button>
          )}
          {baterias.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento criado ainda</p>
          ) : (
            <div className="space-y-2">
              {baterias.map(b => (
                <Link
                  key={b.id}
                  to={`/grupos/${grupo.id}/eventos/${b.id}`}
                  className="block p-3 rounded-xl bg-card border border-border hover:border-secondary/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{b.nome}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(b.data + 'T00:00').toLocaleDateString('pt-BR')} · {b.numero_estacoes} estações
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      b.status === 'Encerrada' ? 'bg-muted text-muted-foreground' :
                      b.status === 'Em andamento' ? 'bg-secondary/20 text-secondary' :
                      'bg-accent/20 text-accent-foreground'
                    }`}>{b.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'ranking' && (
        <section>
          <RankingAcumuladoTable ranking={ranking} />
        </section>
      )}

      {showConvidar && (
        <ConvidarMembroModal
          grupoId={grupo.id}
          grupoNome={grupo.nome}
          conviteToken={grupo.convite_token}
          membrosUserIds={membros.map(m => m.user_id)}
          convitesUserIds={convites.map(c => c.convidado_user_id)}
          initialTab={convidarTab}
          onClose={() => setShowConvidar(false)}
          onDone={reload}
        />
      )}
      {showNovaBateria && (
        <NovaBateriaModal
          grupoId={grupo.id}
          regulamentoPadrao={grupo.regulamento_padrao}
          onClose={() => setShowNovaBateria(false)}
          onCreated={(bid) => navigate(`/grupos/${grupo.id}/eventos/${bid}`)}
        />
      )}
    </div>
  );
}

function MembroRow({ userId, papel, isYou }: { userId: string; papel: string; isYou: boolean }) {
  const [info, setInfo] = useState<{ nome?: string; email?: string }>({});
  useState(() => {
    Promise.all([
      supabase.from('criador_profile').select('nome_criadouro').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('email').eq('user_id', userId).maybeSingle(),
    ]).then(([c, p]: any) => setInfo({ nome: c.data?.nome_criadouro, email: p.data?.email }));
  });
  return (
    <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center text-sm font-semibold text-secondary uppercase">
        {(info.nome || info.email || '?').charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate flex items-center gap-1">
          {info.nome || info.email || '...'}
          {papel === 'admin' && <Crown className="w-3 h-3 text-secondary" />}
          {isYou && <span className="text-[10px] text-muted-foreground">(você)</span>}
        </p>
        {info.email && <p className="text-[10px] text-muted-foreground truncate">{info.email}</p>}
      </div>
    </div>
  );
}
