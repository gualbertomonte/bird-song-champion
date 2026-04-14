import { useState, useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { Bird as BirdType, BirdStatus, ESTADOS_BR } from '@/types/bird';
import { Bird, Plus, Search, Trash2, Edit, X, Check, LayoutGrid, List, Eye, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import PhotoUploader from '@/components/PhotoUploader';
import { toast } from 'sonner';

const statusLabels: Record<BirdStatus, string> = { ativo: 'Ativo', vendido: 'Vendido', falecido: 'Falecido' };
const statusClass: Record<BirdStatus, string> = { ativo: 'badge-active', vendido: 'badge-sold', falecido: 'badge-deceased' };

type SortKey = 'nome' | 'anilha' | 'dataNascimento';
type ViewMode = 'cards' | 'table';

export default function Plantel() {
  const { birds, addBird, updateBird, deleteBird } = useAppState();
  const [search, setSearch] = useState('');
  const [filterEspecie, setFilterEspecie] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSexo, setFilterSexo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<BirdType | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BirdType>>({ sexo: 'macho', status: 'ativo', fotos: [] });
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortKey, setSortKey] = useState<SortKey>('nome');
  const [sortAsc, setSortAsc] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const especies = useMemo(() => [...new Set(birds.map(b => b.especie))], [birds]);
  const estados = useMemo(() => [...new Set(birds.map(b => b.estado).filter(Boolean))], [birds]);

  const filtered = useMemo(() => {
    let result = birds.filter(b => {
      const s = search.toLowerCase();
      const matchSearch = !s || b.nome.toLowerCase().includes(s) || b.anilha.toLowerCase().includes(s) ||
        (b.nomeCientifico?.toLowerCase().includes(s)) || (b.sispass?.toLowerCase().includes(s));
      return matchSearch
        && (!filterEspecie || b.especie === filterEspecie)
        && (!filterStatus || b.status === filterStatus)
        && (!filterSexo || b.sexo === filterSexo)
        && (!filterEstado || b.estado === filterEstado);
    });
    result.sort((a, b) => {
      const va = a[sortKey] || '';
      const vb = b[sortKey] || '';
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return result;
  }, [birds, search, filterEspecie, filterStatus, filterSexo, filterEstado, sortKey, sortAsc]);

  const openNew = () => { setForm({ sexo: 'macho', status: 'ativo', fotos: [] }); setEditId(null); setShowForm(true); };
  const openEdit = (b: BirdType) => { setForm({ ...b, fotos: b.fotos || (b.foto ? [b.foto] : []) }); setEditId(b.id); setShowForm(true); };

  const save = () => {
    if (!form.anilha?.trim() || !form.nome?.trim() || !form.especie?.trim()) {
      toast.error('Preencha os campos obrigatórios: Anilha, Nome e Espécie');
      return;
    }
    if (editId) {
      updateBird(editId, { ...form });
      toast.success('Ave atualizada com sucesso!');
    } else {
      addBird({ ...form, id: Date.now().toString() } as BirdType);
      toast.success('Ave cadastrada com sucesso!');
    }
    setShowForm(false);
  };

  const confirmDelete = (id: string) => {
    deleteBird(id);
    setDeleteConfirm(null);
    toast.success('Ave excluída');
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const getMainPhoto = (b: BirdType) => b.fotos?.[0] || b.foto || null;
  const getBirdName = (id?: string) => birds.find(b => b.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="page-title">Meu Plantel</h1>
          <p className="page-subtitle">{birds.length} aves cadastradas · {filtered.length} exibidas</p>
        </div>
        <div className="flex gap-2 self-start">
          <div className="flex rounded-lg border overflow-hidden">
            <button onClick={() => setViewMode('cards')} className={`p-2 ${viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'} transition-colors`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'} transition-colors`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={openNew} className="btn-primary">
            <Plus className="w-4 h-4" /> Nova Ave
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, anilha, Sispass..."
            className="w-full pl-9 pr-4 py-2 input-field" />
        </div>
        <select value={filterEspecie} onChange={e => setFilterEspecie(e.target.value)} className="input-field w-auto">
          <option value="">Todas espécies</option>
          {especies.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filterSexo} onChange={e => setFilterSexo(e.target.value)} className="input-field w-auto">
          <option value="">Ambos sexos</option>
          <option value="macho">Macho</option>
          <option value="fêmea">Fêmea</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto">
          <option value="">Todos status</option>
          <option value="ativo">Ativo</option>
          <option value="vendido">Vendido</option>
          <option value="falecido">Falecido</option>
        </select>
        {estados.length > 0 && (
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input-field w-auto">
            <option value="">Todos estados</option>
            {estados.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        )}
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(bird => (
            <div key={bird.id} className="card-hover group animate-fade-in">
              <div className="h-36 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative overflow-hidden">
                {getMainPhoto(bird) ? (
                  <img src={getMainPhoto(bird)!} alt={bird.nome} className="w-full h-full object-cover" />
                ) : (
                  <Bird className="w-12 h-12 text-primary/30" />
                )}
                <span className={`absolute top-3 right-3 ${statusClass[bird.status]}`}>{statusLabels[bird.status]}</span>
              </div>
              <div className="p-4 space-y-2">
                <div>
                  <h3 className="font-heading font-semibold text-lg leading-tight">{bird.nome}</h3>
                  <p className="text-xs text-muted-foreground">{bird.especie}{bird.nomeCientifico && <em className="ml-1">({bird.nomeCientifico})</em>} · {bird.sexo === 'macho' ? '♂' : '♀'}</p>
                </div>
                <div className="text-xs space-y-0.5 text-muted-foreground">
                  <p><span className="font-medium text-foreground">Anilha:</span> {bird.anilha}</p>
                  <p><span className="font-medium text-foreground">Cor:</span> {bird.cor}</p>
                  {bird.sispass && <p><span className="font-medium text-foreground">Sispass:</span> {bird.sispass}</p>}
                  {bird.estado && <p><span className="font-medium text-foreground">UF:</span> {bird.estado}</p>}
                  <p><span className="font-medium text-foreground">Nasc.:</span> {new Date(bird.dataNascimento).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex gap-1.5 pt-2">
                  <button onClick={() => setShowDetail(bird)} className="flex-1 text-xs py-1.5 rounded-md bg-muted/50 text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" /> Detalhes
                  </button>
                  <button onClick={() => openEdit(bird)} className="flex-1 text-xs py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                    <Edit className="w-3 h-3" /> Editar
                  </button>
                  <button onClick={() => setDeleteConfirm(bird.id)} className="text-xs py-1.5 px-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
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
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Foto</th>
                  <th className="text-left p-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('anilha')}>
                    <span className="inline-flex items-center gap-1">Anilha <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('nome')}>
                    <span className="inline-flex items-center gap-1">Nome <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Espécie</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Sexo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Sispass</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">UF</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('dataNascimento')}>
                    <span className="inline-flex items-center gap-1">Nasc. <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(bird => (
                  <tr key={bird.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {getMainPhoto(bird) ? <img src={getMainPhoto(bird)!} className="w-full h-full object-cover" /> : <Bird className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs">{bird.anilha}</td>
                    <td className="p-3 font-medium">{bird.nome}</td>
                    <td className="p-3 text-muted-foreground">{bird.especie}</td>
                    <td className="p-3">{bird.sexo === 'macho' ? '♂' : '♀'}</td>
                    <td className="p-3 text-muted-foreground text-xs">{bird.sispass || '—'}</td>
                    <td className="p-3 text-muted-foreground">{bird.estado || '—'}</td>
                    <td className="p-3"><span className={statusClass[bird.status]}>{statusLabels[bird.status]}</span></td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(bird.dataNascimento).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setShowDetail(bird)} className="btn-ghost p-1.5"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEdit(bird)} className="btn-ghost p-1.5 text-primary"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteConfirm(bird.id)} className="btn-ghost p-1.5 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
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
        <div className="text-center py-12 text-muted-foreground">
          <Bird className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma ave encontrada</p>
        </div>
      )}

      {/* Detail modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl">{showDetail.nome}</h2>
              <button onClick={() => setShowDetail(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            {getMainPhoto(showDetail) && (
              <img src={getMainPhoto(showDetail)!} alt={showDetail.nome} className="w-full h-48 object-cover rounded-xl" />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Anilha:</span> <span className="font-medium">{showDetail.anilha}</span></div>
              <div><span className="text-muted-foreground">Espécie:</span> <span className="font-medium">{showDetail.especie}</span></div>
              {showDetail.nomeCientifico && <div className="col-span-2"><span className="text-muted-foreground">Nome Científico:</span> <em className="font-medium">{showDetail.nomeCientifico}</em></div>}
              <div><span className="text-muted-foreground">Sexo:</span> <span className="font-medium">{showDetail.sexo === 'macho' ? 'Macho ♂' : 'Fêmea ♀'}</span></div>
              <div><span className="text-muted-foreground">Cor:</span> <span className="font-medium">{showDetail.cor}</span></div>
              <div><span className="text-muted-foreground">Nascimento:</span> <span className="font-medium">{new Date(showDetail.dataNascimento).toLocaleDateString('pt-BR')}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className={statusClass[showDetail.status]}>{statusLabels[showDetail.status]}</span></div>
              {showDetail.sispass && <div><span className="text-muted-foreground">Sispass:</span> <span className="font-medium">{showDetail.sispass}</span></div>}
              {showDetail.estado && <div><span className="text-muted-foreground">UF:</span> <span className="font-medium">{showDetail.estado}</span></div>}
              {showDetail.paiId && <div><span className="text-muted-foreground">Pai:</span> <span className="font-medium">{getBirdName(showDetail.paiId)?.nome || '—'} ({getBirdName(showDetail.paiId)?.anilha})</span></div>}
              {showDetail.maeId && <div><span className="text-muted-foreground">Mãe:</span> <span className="font-medium">{getBirdName(showDetail.maeId)?.nome || '—'} ({getBirdName(showDetail.maeId)?.anilha})</span></div>}
            </div>
            {showDetail.notas && <p className="text-sm text-muted-foreground italic">{showDetail.notas}</p>}
            {/* Photo gallery */}
            {(showDetail.fotos?.length || 0) > 1 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Galeria</p>
                <div className="flex gap-2 flex-wrap">
                  {showDetail.fotos?.map((f, i) => (
                    <img key={i} src={f} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-sm p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="font-heading font-bold text-lg">Confirmar exclusão</h2>
            <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir esta ave? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={() => confirmDelete(deleteConfirm)} className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl">{editId ? 'Editar Ave' : 'Nova Ave'}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Anilha *</label>
                <input value={form.anilha || ''} onChange={e => setForm({ ...form, anilha: e.target.value })} className="mt-1 input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                <input value={form.nome || ''} onChange={e => setForm({ ...form, nome: e.target.value })} className="mt-1 input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Espécie *</label>
                <input value={form.especie || ''} onChange={e => setForm({ ...form, especie: e.target.value })} className="mt-1 input-field" placeholder="Curió, Canário, Bicudo..." />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Nome Científico</label>
                <input value={form.nomeCientifico || ''} onChange={e => setForm({ ...form, nomeCientifico: e.target.value })} className="mt-1 input-field" placeholder="Ex: Sporophila angolensis" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sexo</label>
                <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value as any })} className="mt-1 input-field">
                  <option value="macho">Macho</option>
                  <option value="fêmea">Fêmea</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cor</label>
                <input value={form.cor || ''} onChange={e => setForm({ ...form, cor: e.target.value })} className="mt-1 input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data Nascimento</label>
                <input type="date" value={form.dataNascimento || ''} onChange={e => setForm({ ...form, dataNascimento: e.target.value })} className="mt-1 input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="mt-1 input-field">
                  <option value="ativo">Ativo</option>
                  <option value="vendido">Vendido</option>
                  <option value="falecido">Falecido</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sispass</label>
                <input value={form.sispass || ''} onChange={e => setForm({ ...form, sispass: e.target.value })} className="mt-1 input-field" placeholder="SIS-XXXX-XXXXX" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Estado (UF)</label>
                <select value={form.estado || ''} onChange={e => setForm({ ...form, estado: e.target.value as any || undefined })} className="mt-1 input-field">
                  <option value="">Selecionar...</option>
                  {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Pai</label>
                <select value={form.paiId || ''} onChange={e => setForm({ ...form, paiId: e.target.value || undefined })} className="mt-1 input-field">
                  <option value="">Sem pai cadastrado</option>
                  {birds.filter(b => b.sexo === 'macho' && b.id !== editId).map(b => (
                    <option key={b.id} value={b.id}>{b.anilha} – {b.nome}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Mãe</label>
                <select value={form.maeId || ''} onChange={e => setForm({ ...form, maeId: e.target.value || undefined })} className="mt-1 input-field">
                  <option value="">Sem mãe cadastrada</option>
                  {birds.filter(b => b.sexo === 'fêmea' && b.id !== editId).map(b => (
                    <option key={b.id} value={b.id}>{b.anilha} – {b.nome}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <PhotoUploader photos={form.fotos || []} onChange={fotos => setForm({ ...form, fotos })} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Observações</label>
                <textarea value={form.notas || ''} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2}
                  className="mt-1 input-field resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={save} className="btn-primary">
                <Check className="w-4 h-4" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
