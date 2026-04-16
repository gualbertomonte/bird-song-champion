import { useState, useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { Bird as BirdIcon, Search } from 'lucide-react';
import { Bird } from '@/types/bird';

function TreeNode({ bird, birds, depth = 0, maxDepth = 3 }: { bird: Bird | undefined; birds: Bird[]; depth?: number; maxDepth?: number }) {
  if (!bird || depth >= maxDepth) {
    return (
      <div className="min-w-[140px] p-2 rounded-lg bg-muted/10 border border-border/30 text-center text-xs">
        <p className="text-muted-foreground">Desconhecido</p>
      </div>
    );
  }

  const pai = birds.find(b => b.id === bird.pai_id);
  const mae = birds.find(b => b.id === bird.mae_id);

  const borderColor = depth === 0 ? 'border-secondary/40' : depth === 1 ? 'border-primary/30' : 'border-border/40';
  const bgColor = depth === 0 ? 'bg-secondary/5' : depth === 1 ? 'bg-primary/5' : 'bg-muted/15';

  return (
    <div className="flex flex-col items-center gap-2">
      {depth < maxDepth - 1 && (bird.pai_id || bird.mae_id) && (
        <div className="flex gap-4">
          <TreeNode bird={pai} birds={birds} depth={depth + 1} maxDepth={maxDepth} />
          <TreeNode bird={mae} birds={birds} depth={depth + 1} maxDepth={maxDepth} />
        </div>
      )}
      {depth < maxDepth - 1 && (bird.pai_id || bird.mae_id) && (
        <div className="w-px h-4 bg-border/50" />
      )}
      <div className={`min-w-[160px] p-3 rounded-xl ${bgColor} border ${borderColor} text-center`}>
        <p className="font-semibold text-sm">{bird.nome}</p>
        <p className="text-xs text-muted-foreground italic">{bird.nome_cientifico}</p>
        <p className="text-[10px] font-mono text-muted-foreground mt-1">{bird.codigo_anilha}</p>
        <span className={`text-[10px] ${bird.sexo === 'M' ? 'text-primary' : 'text-secondary'}`}>
          {bird.sexo === 'M' ? '♂ Macho' : '♀ Fêmea'}
        </span>
      </div>
    </div>
  );
}

export default function ArvoreGenealogica() {
  const { birds } = useAppState();
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');

  const filteredBirds = useMemo(() => {
    if (!search) return birds;
    const s = search.toLowerCase();
    return birds.filter(b => b.nome.toLowerCase().includes(s) || b.codigo_anilha.toLowerCase().includes(s) || b.nome_cientifico?.toLowerCase().includes(s));
  }, [birds, search]);

  const selectedBird = birds.find(b => b.id === selectedId);

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <div>
        <h1 className="page-title">Árvore Genealógica</h1>
        <p className="page-subtitle">Visualize a linhagem completa das aves</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ave..."
            className="w-full pl-9 pr-4 py-2 input-field"
          />
        </div>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="input-field w-full sm:w-auto sm:min-w-[280px]"
        >
          <option value="">Selecionar ave...</option>
          {filteredBirds.map(b => (
            <option key={b.id} value={b.id}>
              {b.nome} — {b.codigo_anilha}
            </option>
          ))}
        </select>
      </div>

      {selectedBird ? (
        <div className="bg-card rounded-xl border p-6 overflow-x-auto animate-fade-in">
          <div className="min-w-[600px] flex justify-center">
            <TreeNode bird={selectedBird} birds={birds} depth={0} maxDepth={3} />
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <BirdIcon className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Selecione uma ave para visualizar sua árvore genealógica</p>
        </div>
      )}
    </div>
  );
}
