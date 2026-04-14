import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Bird as BirdType, BirdStatus } from '@/types/bird';
import { Bird, Plus, Search, Filter, Trash2, Edit, X, Check } from 'lucide-react';

const statusLabels: Record<BirdStatus, string> = { ativo: 'Ativo', vendido: 'Vendido', falecido: 'Falecido' };
const statusClass: Record<BirdStatus, string> = { ativo: 'badge-active', vendido: 'badge-sold', falecido: 'badge-deceased' };

export default function Plantel() {
  const { birds, addBird, updateBird, deleteBird } = useAppState();
  const [search, setSearch] = useState('');
  const [filterEspecie, setFilterEspecie] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BirdType>>({ sexo: 'macho', status: 'ativo' });

  const especies = [...new Set(birds.map(b => b.especie))];

  const filtered = birds.filter(b => {
    const matchSearch = !search || b.nome.toLowerCase().includes(search.toLowerCase()) || b.anilha.toLowerCase().includes(search.toLowerCase());
    const matchEspecie = !filterEspecie || b.especie === filterEspecie;
    const matchStatus = !filterStatus || b.status === filterStatus;
    return matchSearch && matchEspecie && matchStatus;
  });

  const openNew = () => { setForm({ sexo: 'macho', status: 'ativo' }); setEditId(null); setShowForm(true); };
  const openEdit = (b: BirdType) => { setForm(b); setEditId(b.id); setShowForm(true); };

  const save = () => {
    if (!form.anilha || !form.nome || !form.especie) return;
    if (editId) {
      updateBird(editId, form);
    } else {
      addBird({ ...form, id: Date.now().toString() } as BirdType);
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="page-title">Plantel</h1>
          <p className="page-subtitle">{birds.length} aves cadastradas</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity self-start">
          <Plus className="w-4 h-4" /> Nova Ave
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou anilha..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
        <select value={filterEspecie} onChange={e => setFilterEspecie(e.target.value)}
          className="px-3 py-2 rounded-lg bg-card border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
          <option value="">Todas espécies</option>
          {especies.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-card border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
          <option value="">Todos status</option>
          <option value="ativo">Ativo</option>
          <option value="vendido">Vendido</option>
          <option value="falecido">Falecido</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(bird => (
          <div key={bird.id} className="bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-300 group animate-scale-in">
            {/* Photo placeholder */}
            <div className="h-36 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
              <Bird className="w-12 h-12 text-primary/30" />
              <span className={`absolute top-3 right-3 ${statusClass[bird.status]}`}>{statusLabels[bird.status]}</span>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-heading font-semibold text-lg leading-tight">{bird.nome}</h3>
                  <p className="text-xs text-muted-foreground">{bird.especie} · {bird.sexo === 'macho' ? '♂' : '♀'}</p>
                </div>
              </div>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p><span className="font-medium text-foreground">Anilha:</span> {bird.anilha}</p>
                <p><span className="font-medium text-foreground">Cor:</span> {bird.cor}</p>
                {bird.peso && <p><span className="font-medium text-foreground">Peso:</span> {bird.peso}g</p>}
                <p><span className="font-medium text-foreground">Nasc.:</span> {new Date(bird.dataNascimento).toLocaleDateString('pt-BR')}</p>
              </div>
              {bird.notas && <p className="text-xs text-muted-foreground italic line-clamp-2">{bird.notas}</p>}
              <div className="flex gap-2 pt-2">
                <button onClick={() => openEdit(bird)} className="flex-1 text-xs py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                  <Edit className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => deleteBird(bird.id)} className="text-xs py-1.5 px-3 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Bird className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma ave encontrada</p>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl">{editId ? 'Editar Ave' : 'Nova Ave'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Anilha *</label>
                <input value={form.anilha || ''} onChange={e => setForm({ ...form, anilha: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                <input value={form.nome || ''} onChange={e => setForm({ ...form, nome: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Espécie *</label>
                <input value={form.especie || ''} onChange={e => setForm({ ...form, especie: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="Curió, Canário, Bicudo..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sexo</label>
                <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="macho">Macho</option>
                  <option value="fêmea">Fêmea</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cor</label>
                <input value={form.cor || ''} onChange={e => setForm({ ...form, cor: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data Nascimento</label>
                <input type="date" value={form.dataNascimento || ''} onChange={e => setForm({ ...form, dataNascimento: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Peso (g)</label>
                <input type="number" value={form.peso || ''} onChange={e => setForm({ ...form, peso: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="ativo">Ativo</option>
                  <option value="vendido">Vendido</option>
                  <option value="falecido">Falecido</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Pai (Anilha)</label>
                <select value={form.paiId || ''} onChange={e => setForm({ ...form, paiId: e.target.value || undefined })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="">Sem pai cadastrado</option>
                  {birds.filter(b => b.sexo === 'macho' && b.id !== editId).map(b => (
                    <option key={b.id} value={b.id}>{b.anilha} – {b.nome}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Mãe (Anilha)</label>
                <select value={form.maeId || ''} onChange={e => setForm({ ...form, maeId: e.target.value || undefined })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="">Sem mãe cadastrada</option>
                  {birds.filter(b => b.sexo === 'fêmea' && b.id !== editId).map(b => (
                    <option key={b.id} value={b.id}>{b.anilha} – {b.nome}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Observações</label>
                <textarea value={form.notas || ''} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={save} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2">
                <Check className="w-4 h-4" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
