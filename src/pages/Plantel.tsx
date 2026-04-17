import { useState, useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { Bird as BirdType, BirdStatus, ESTADOS_BR } from '@/types/bird';
import { DIAMETROS_PADRAO, DIAMETRO_POR_ESPECIE } from '@/data/anilhas';
import { Bird, Plus, Search, Trash2, Edit, X, Check, LayoutGrid, List, Eye, ArrowUpDown, FileText, GitBranch, Loader2, AlertCircle, Handshake, ArrowDownToLine, Sparkles } from 'lucide-react';
import PhotoUploader from '@/components/PhotoUploader';
import NomeCientificoCombobox from '@/components/NomeCientificoCombobox';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const statusLabels: Record<BirdStatus, string> = { Ativo: 'Ativo', 'Berçário': 'Berçário', Vendido: 'Vendido', Falecido: 'Falecido' };
const statusClass: Record<BirdStatus, string> = { Ativo: 'badge-active', 'Berçário': 'badge-bercario', Vendido: 'badge-sold', Falecido: 'badge-deceased' };

type SortKey = 'nome' | 'codigo_anilha' | 'data_nascimento';
type ViewMode = 'cards' | 'table';

const emptyForm = (): Partial<BirdType> => ({ sexo: 'M', status: 'Ativo', fotos: [], nome_cientifico: '' });

export default function Plantel() {
  const { birds, addBird, updateBird, deleteBird } = useAppState();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filterEspecie, setFilterEspecie] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSexo, setFilterSexo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BirdType>>(emptyForm());
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortKey, setSortKey] = useState<SortKey>('nome');
  const [sortAsc, setSortAsc] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [anilhaCheck, setAnilhaCheck] = useState<{ status: 'idle' | 'checking' | 'available' | 'taken-local' | 'taken-global'; message?: string }>({ status: 'idle' });

  useEffect(() => {
    if (searchParams.get('new') === '1') { openNew(); }
  }, [searchParams]);

  // Validação em tempo real do código de anilha
  useEffect(() => {
    if (!showForm) return;
    const codigoRaw = form.codigo_anilha?.trim() || '';
    if (!codigoRaw) {
      setAnilhaCheck({ status: 'idle' });
      return;
    }

    const codigo = codigoRaw.toLowerCase();
    const conflitoLocal = birds.find(
      b => b.codigo_anilha?.trim().toLowerCase() === codigo && b.id !== editId
    );

    if (conflitoLocal) {
      setAnilhaCheck({
        status: 'taken-local',
        message: `Já existe no seu plantel: ${conflitoLocal.nome}`,
      });
      return;
    }

    setAnilhaCheck({ status: 'available' });
  }, [form.codigo_anilha, birds, editId, showForm]);

  // Auto-preencher diâmetro ao mudar a espécie (funciona em criação e edição)
  const prevSciRef = useRef<string>('');
  useEffect(() => {
    if (!showForm) {
      prevSciRef.current = '';
      return;
    }
    const sci = form.nome_cientifico?.trim() || '';
    // Primeira renderização do form: registra valor inicial sem sobrescrever diâmetro existente
    if (prevSciRef.current === '') {
      prevSciRef.current = sci;
      return;
    }
    if (sci === prevSciRef.current) return;
    prevSciRef.current = sci;
    const sugerido = DIAMETRO_POR_ESPECIE[sci];
    if (sugerido) {
      setForm(prev => ({ ...prev, diametro_anilha: sugerido }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.nome_cientifico, showForm]);

  const uniqueEspecies = useMemo(() => [...new Set(birds.map(b => b.nome))], [birds]);

  const filtered = useMemo(() => {
    let result = birds.filter(b => {
      const s = search.toLowerCase();
      const matchSearch = !s || b.nome.toLowerCase().includes(s) || b.codigo_anilha.toLowerCase().includes(s) ||
        b.nome_cientifico?.toLowerCase().includes(s);
      return matchSearch
        && (!filterEspecie || b.nome === filterEspecie)
        && (!filterStatus || b.status === filterStatus)
        && (!filterSexo || b.sexo === filterSexo)
        && (!filterEstado || b.estado === filterEstado);
    });
    result.sort((a, b) => {
      const va = (a[sortKey] || '') as string;
      const vb = (b[sortKey] || '') as string;
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return result;
  }, [birds, search, filterEspecie, filterStatus, filterSexo, filterEstado, sortKey, sortAsc]);

  const openNew = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };
  const openEdit = (b: BirdType) => { setForm({ ...b }); setEditId(b.id); setShowForm(true); };

  const save = async () => {
    if (!form.codigo_anilha?.trim() || !form.nome?.trim() || !form.nome_cientifico?.trim()) {
      toast.error('Preencha os campos obrigatórios: Anilha, Nome e Nome Científico');
      return;
    }
    // Código de anilha: somente números (até 6 dígitos)
    const codigoRaw = form.codigo_anilha.trim();
    if (!/^\d{1,6}$/.test(codigoRaw)) {
      toast.error('Código de anilha deve conter apenas números (até 6 dígitos).');
      return;
    }
    // Validação client-side de anilha duplicada (no plantel atual)
    const codigo = codigoRaw.toLowerCase();
    const conflito = birds.find(b => b.codigo_anilha?.trim().toLowerCase() === codigo && b.id !== editId);
    if (conflito) {
      toast.error(`Já existe uma ave com a anilha "${form.codigo_anilha}" no seu plantel.`);
      return;
    }
    try {
      if (editId) {
        await updateBird(editId, { ...form });
        toast.success('Ave atualizada com sucesso!');
      } else {
        await addBird({ ...form, id: Date.now().toString(), created_at: new Date().toISOString() } as BirdType);
        toast.success('Ave cadastrada com sucesso!');
      }
      setShowForm(false);
      setEditId(null);
    } catch {
      // Toast de erro já exibido pelo contexto (ex.: anilha duplicada globalmente)
    }
  };

  const confirmDelete = (id: string) => { deleteBird(id); setDeleteConfirm(null); toast.success('Ave excluída'); };
  const toggleSort = (key: SortKey) => { if (sortKey === key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(true); } };
  const getPhoto = (b: BirdType) => b.foto_url || b.fotos?.[0] || null;

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="page-title">Meu Plantel</h1>
          <p className="page-subtitle">{birds.length} aves · {filtered.length} exibidas</p>
        </div>
        <div className="flex gap-2 self-start">
          <div className="flex rounded-lg border overflow-hidden">
            <button onClick={() => setViewMode('cards')} className={`p-2 ${viewMode === 'cards' ? 'bg-secondary text-secondary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'} transition-colors`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-secondary text-secondary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'} transition-colors`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Nova Ave</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, anilha, espécie..." className="w-full pl-9 pr-4 py-2 input-field" />
        </div>
        <select value={filterEspecie} onChange={e => setFilterEspecie(e.target.value)} className="input-field w-auto min-w-[120px]">
          <option value="">Todas espécies</option>
          {uniqueEspecies.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filterSexo} onChange={e => setFilterSexo(e.target.value)} className="input-field w-auto min-w-[80px]">
          <option value="">Sexo</option>
          <option value="M">Macho</option>
          <option value="F">Fêmea</option>
          <option value="I">A definir</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto min-w-[100px]">
          <option value="">Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Berçário">Berçário</option>
          <option value="Vendido">Vendido</option>
          <option value="Falecido">Falecido</option>
        </select>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((bird, i) => (
            <div key={bird.id} className="card-hover group animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="h-32 bg-gradient-to-br from-primary/20 to-muted/30 flex items-center justify-center relative overflow-hidden">
                {getPhoto(bird) ? (
                  <img src={getPhoto(bird)!} alt={bird.nome} className="w-full h-full object-cover" />
                ) : (
                  <Bird className="w-10 h-10 text-primary/30" />
                )}
                <span className={`absolute top-2 right-2 ${statusClass[bird.status]}`}>{statusLabels[bird.status]}</span>
                {bird.sexo === 'M' ? (
                  <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary/60 text-primary-foreground text-xs flex items-center justify-center font-bold">♂</span>
                ) : bird.sexo === 'F' ? (
                  <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-secondary/60 text-secondary-foreground text-xs flex items-center justify-center font-bold">♀</span>
                ) : (
                  <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-muted/60 text-foreground text-xs flex items-center justify-center font-bold">?</span>
                )}
              </div>
              <div className="p-3 space-y-1.5">
                <div>
                  <h3 className="font-semibold text-sm leading-tight">{bird.nome}</h3>
                  <p className="text-xs text-muted-foreground italic">{bird.nome_cientifico}</p>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{bird.codigo_anilha}</p>
                {bird.loan_status === 'emprestada_entrada' && (
                  <div className="flex items-center gap-1 text-[10px] text-info bg-info/10 rounded px-1.5 py-0.5">
                    <Handshake className="w-3 h-3" /> Recebida em empréstimo — somente leitura
                  </div>
                )}
                {bird.loan_status === 'emprestada_saida' && (
                  <div className="flex items-center gap-1 text-[10px] text-warning bg-warning/10 rounded px-1.5 py-0.5">
                    <ArrowDownToLine className="w-3 h-3" /> Emprestada para outro criador
                  </div>
                )}
                <div className="flex gap-1 pt-1">
                  <Link to={`/ave/${bird.id}`} className="flex-1 text-xs py-1.5 rounded-md bg-muted/40 text-foreground hover:bg-muted/60 transition-colors flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" /> Ver
                  </Link>
                  <button
                    onClick={() => openEdit(bird)}
                    disabled={bird.loan_status === 'emprestada_entrada'}
                    title={bird.loan_status === 'emprestada_entrada' ? 'Aves recebidas em empréstimo não podem ser editadas' : ''}
                    className="flex-1 text-xs py-1.5 rounded-md bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-secondary/10"
                  >
                    <Edit className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(bird.id)}
                    disabled={bird.loan_status === 'emprestada_entrada'}
                    title={bird.loan_status === 'emprestada_entrada' ? 'Aves recebidas em empréstimo não podem ser excluídas' : ''}
                    className="text-xs py-1.5 px-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-left p-3 font-medium text-muted-foreground">Foto</th>
                  <th className="text-left p-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('codigo_anilha')}>
                    <span className="inline-flex items-center gap-1">Anilha <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('nome')}>
                    <span className="inline-flex items-center gap-1">Nome <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Espécie</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Sexo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(bird => (
                  <tr key={bird.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                    <td className="p-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {getPhoto(bird) ? <img src={getPhoto(bird)!} className="w-full h-full object-cover" /> : <Bird className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs">{bird.codigo_anilha}</td>
                    <td className="p-3">
                      <div>
                        <span className="font-medium">{bird.nome}</span>
                        <p className="text-xs text-muted-foreground italic">{bird.nome_cientifico}</p>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell italic">{bird.nome_cientifico}</td>
                    <td className="p-3">{bird.sexo === 'M' ? '♂' : bird.sexo === 'F' ? '♀' : '?'}</td>
                    <td className="p-3"><span className={statusClass[bird.status]}>{statusLabels[bird.status]}</span></td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1 items-center">
                        {bird.loan_status === 'emprestada_entrada' && (
                          <span title="Recebida em empréstimo — somente leitura" className="text-info"><Handshake className="w-3.5 h-3.5" /></span>
                        )}
                        {bird.loan_status === 'emprestada_saida' && (
                          <span title="Emprestada para outro criador" className="text-warning"><ArrowDownToLine className="w-3.5 h-3.5" /></span>
                        )}
                        <Link to={`/ave/${bird.id}`} className="btn-ghost p-1.5"><Eye className="w-3.5 h-3.5" /></Link>
                        <button
                          onClick={() => openEdit(bird)}
                          disabled={bird.loan_status === 'emprestada_entrada'}
                          title={bird.loan_status === 'emprestada_entrada' ? 'Aves recebidas em empréstimo não podem ser editadas' : ''}
                          className="btn-ghost p-1.5 text-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                        ><Edit className="w-3.5 h-3.5" /></button>
                        <button
                          onClick={() => setDeleteConfirm(bird.id)}
                          disabled={bird.loan_status === 'emprestada_entrada'}
                          title={bird.loan_status === 'emprestada_entrada' ? 'Aves recebidas em empréstimo não podem ser excluídas' : ''}
                          className="btn-ghost p-1.5 text-destructive disabled:opacity-40 disabled:cursor-not-allowed"
                        ><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Bird className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nenhuma ave encontrada</p>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-sm p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg">Confirmar exclusão</h2>
            <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir esta ave? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={() => confirmDelete(deleteConfirm)} className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:opacity-90">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl">{editId ? 'Editar Ave' : 'Nova Ave'}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Código de Anilha *</label>
                <div className="relative">
                  <input
                    value={form.codigo_anilha || ''}
                    onChange={e => {
                      const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setForm({ ...form, codigo_anilha: onlyDigits });
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className={`mt-1 input-field pr-9 ${
                      anilhaCheck.status === 'taken-local' || anilhaCheck.status === 'taken-global'
                        ? 'border-destructive focus:ring-destructive/30'
                        : anilhaCheck.status === 'available'
                        ? 'border-success focus:ring-success/30'
                        : ''
                    }`}
                    placeholder="Ex: 123456"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                    {anilhaCheck.status === 'checking' && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                    {anilhaCheck.status === 'available' && <Check className="w-4 h-4 text-success" />}
                    {(anilhaCheck.status === 'taken-local' || anilhaCheck.status === 'taken-global') && <AlertCircle className="w-4 h-4 text-destructive" />}
                  </div>
                </div>
                {(anilhaCheck.status === 'taken-local' || anilhaCheck.status === 'taken-global') && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {anilhaCheck.message || 'Anilha já existe.'}
                  </p>
                )}
                {anilhaCheck.status === 'available' && form.codigo_anilha && (
                  <p className="text-xs text-success mt-1">Anilha disponível</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">Apenas números, geralmente 6 dígitos.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Anilha SISPASS?</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, anilha_sispass: true })}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                      form.anilha_sispass === true
                        ? 'bg-secondary text-secondary-foreground border-secondary'
                        : 'bg-card hover:bg-muted/40'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, anilha_sispass: false })}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                      form.anilha_sispass === false || form.anilha_sispass === undefined
                        ? 'bg-secondary text-secondary-foreground border-secondary'
                        : 'bg-card hover:bg-muted/40'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome (apelido) *</label>
                <input value={form.nome || ''} onChange={e => setForm({ ...form, nome: e.target.value })} className="mt-1 input-field" placeholder="Trovão, Serena..." />
              </div>
              <NomeCientificoCombobox
                value={form.nome_cientifico || ''}
                onChange={val => setForm({ ...form, nome_cientifico: val })}
                nomeComum={form.nome_comum_especie || ''}
                onNomeComumChange={val => setForm(prev => ({ ...prev, nome_comum_especie: val }))}
              />
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sexo</label>
                <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value as any })} className="mt-1 input-field">
                  <option value="M">Macho</option>
                  <option value="F">Fêmea</option>
                  <option value="I">A definir</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="mt-1 input-field">
                  <option value="Ativo">Ativo</option>
                  <option value="Berçário">Berçário</option>
                  <option value="Vendido">Vendido</option>
                  <option value="Falecido">Falecido</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tipo de Anilha</label>
                <select value={form.tipo_anilha || ''} onChange={e => setForm({ ...form, tipo_anilha: e.target.value as any || undefined })} className="mt-1 input-field">
                  <option value="">Selecionar...</option>
                  <option value="Fechada">Fechada</option>
                  <option value="Aberta">Aberta</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Diâmetro da Anilha</label>
                <select
                  value={form.diametro_anilha || ''}
                  onChange={e => setForm({ ...form, diametro_anilha: e.target.value || undefined })}
                  className="mt-1 input-field"
                >
                  <option value="">Selecionar...</option>
                  {DIAMETROS_PADRAO.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {form.nome_cientifico && DIAMETRO_POR_ESPECIE[form.nome_cientifico.trim()] === form.diametro_anilha && (
                  <p className="text-[11px] text-secondary mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Sugerido pela federação — você pode alterar
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data Nascimento</label>
                <input type="date" value={form.data_nascimento || ''} onChange={e => setForm({ ...form, data_nascimento: e.target.value })} className="mt-1 input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome Comum da Espécie</label>
                <input value={form.nome_comum_especie || ''} onChange={e => setForm({ ...form, nome_comum_especie: e.target.value })} className="mt-1 input-field" placeholder="Curió, Canário, Bicudo..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Estado do SISPASS (UF)</label>
                <select value={form.estado || ''} onChange={e => setForm({ ...form, estado: e.target.value as any || undefined })} className="mt-1 input-field">
                  <option value="">Selecionar...</option>
                  {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              {form.gerado_no_bercario && (
                <div className="sm:col-span-2 p-3 rounded-lg bg-info/10 border border-info/30 text-xs text-info flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Parentesco definido pelo berçário e não pode ser alterado.</span>
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Pai</label>
                <select
                  value={form.pai_id || ''}
                  onChange={e => setForm({ ...form, pai_id: e.target.value || undefined })}
                  disabled={!!form.gerado_no_bercario}
                  className="mt-1 input-field disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Sem pai cadastrado</option>
                  {birds.filter(b => b.sexo === 'M' && b.id !== editId).map(b => (
                    <option key={b.id} value={b.id}>{b.codigo_anilha} – {b.nome}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Mãe</label>
                <select
                  value={form.mae_id || ''}
                  onChange={e => setForm({ ...form, mae_id: e.target.value || undefined })}
                  disabled={!!form.gerado_no_bercario}
                  className="mt-1 input-field disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Sem mãe cadastrada</option>
                  {birds.filter(b => b.sexo === 'F' && b.id !== editId).map(b => (
                    <option key={b.id} value={b.id}>{b.codigo_anilha} – {b.nome}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <PhotoUploader photos={form.fotos || []} onChange={fotos => setForm({ ...form, fotos, foto_url: fotos[0] || form.foto_url })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Observações</label>
                <textarea value={form.observacoes || ''} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} className="mt-1 input-field resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
              <button
                onClick={save}
                disabled={anilhaCheck.status === 'taken-local' || anilhaCheck.status === 'taken-global' || anilhaCheck.status === 'checking'}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
