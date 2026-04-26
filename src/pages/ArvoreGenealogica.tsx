import { useState, useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { Bird as BirdIcon, Search, HelpCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import LoanBadge from '@/components/LoanBadge';

const Mars = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="10" cy="14" r="5"/><path d="M19 5l-5.4 5.4"/><path d="M19 5h-5"/><path d="M19 5v5"/></svg>
);
const Venus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="9" r="5"/><path d="M12 14v8"/><path d="M9 19h6"/></svg>
);
import { Bird } from '@/types/bird';

interface NodeProps {
  bird: Bird | undefined;
  birds: Bird[];
  depth: number;
  maxDepth: number;
  role?: 'self' | 'father' | 'mother';
}

function BirdCard({ bird, role }: { bird: Bird; role?: 'self' | 'father' | 'mother' }) {
  const isMale = bird.sexo === 'M';
  const isFemale = bird.sexo === 'F';

  const accent =
    role === 'self'
      ? 'border-secondary/60 bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-secondary/10'
      : isMale
      ? 'border-info/40 bg-gradient-to-br from-info/10 to-info/5'
      : isFemale
      ? 'border-feminino/40 bg-gradient-to-br from-feminino/10 to-feminino/5'
      : 'border-border bg-card';

  const SexIcon = isMale ? Mars : isFemale ? Venus : HelpCircle;
  const sexColor = isMale ? 'text-info' : isFemale ? 'text-feminino' : 'text-muted-foreground';

  return (
    <div
      className={`relative w-[170px] sm:w-[190px] rounded-xl border-2 ${accent} p-3 shadow-lg transition-transform hover:scale-[1.03] hover:shadow-xl`}
    >
      <div className="flex items-start gap-2">
        <div className="w-10 h-10 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
          {bird.foto_url ? (
            <img src={bird.foto_url} alt={bird.nome} className="w-full h-full object-cover" />
          ) : (
            <BirdIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{bird.nome}</p>
          <p className="text-[10px] text-muted-foreground italic truncate">{bird.nome_cientifico}</p>
        </div>
        <SexIcon className={`w-4 h-4 ${sexColor} shrink-0`} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground truncate">
          {bird.codigo_anilha || '—'}
        </span>
        {role && role !== 'self' && (
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {role === 'father' ? 'Pai' : 'Mãe'}
          </span>
        )}
      </div>
      {bird.loan_status && bird.loan_status !== 'proprio' && (
        <div className="mt-1.5">
          <LoanBadge status={bird.loan_status} iconOnly />
        </div>
      )}
    </div>
  );
}

function UnknownCard({ role }: { role?: 'father' | 'mother' }) {
  const SexIcon = role === 'father' ? Mars : role === 'mother' ? Venus : HelpCircle;
  const color = role === 'father' ? 'text-info/50' : role === 'mother' ? 'text-feminino/50' : 'text-muted-foreground';
  return (
    <div className="w-[170px] sm:w-[190px] rounded-xl border-2 border-dashed border-border/40 bg-muted/10 p-3 flex items-center gap-2 opacity-70">
      <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center">
        <SexIcon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">Desconhecido</p>
        {role && (
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
            {role === 'father' ? 'Pai' : 'Mãe'}
          </p>
        )}
      </div>
    </div>
  );
}

function TreeNode({ bird, birds, depth, maxDepth, role = 'self' }: NodeProps) {
  if (!bird) {
    return <UnknownCard role={role === 'self' ? undefined : (role as 'father' | 'mother')} />;
  }

  const pai = birds.find(b => b.id === bird.pai_id);
  const mae = birds.find(b => b.id === bird.mae_id);
  const hasParents = depth < maxDepth - 1 && (bird.pai_id || bird.mae_id || depth === 0);

  return (
    <div className="flex flex-col items-center">
      {hasParents && (
        <>
          <div className="flex items-start gap-6 sm:gap-10">
            <div className="flex flex-col items-center">
              <TreeNode bird={pai} birds={birds} depth={depth + 1} maxDepth={maxDepth} role="father" />
              {/* vertical connector down from parent */}
              <div className="w-0.5 h-5 bg-gradient-to-b from-info/40 to-border/30" />
            </div>
            <div className="flex flex-col items-center">
              <TreeNode bird={mae} birds={birds} depth={depth + 1} maxDepth={maxDepth} role="mother" />
              <div className="w-0.5 h-5 bg-gradient-to-b from-feminino/40 to-border/30" />
            </div>
          </div>
          {/* horizontal connector joining both parents */}
          <div className="relative w-full flex justify-center">
            <div className="h-0.5 bg-border/50" style={{ width: 'calc(50% + 1rem)' }} />
          </div>
          {/* vertical connector down to child */}
          <div className="w-0.5 h-5 bg-border/50" />
        </>
      )}
      <BirdCard bird={bird} role={role} />
    </div>
  );
}

export default function ArvoreGenealogica() {
  const { birds } = useAppState();
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [generations, setGenerations] = useState(3);
  const [zoom, setZoom] = useState(1);

  const filteredBirds = useMemo(() => {
    if (!search) return birds;
    const s = search.toLowerCase();
    return birds.filter(
      b =>
        b.nome.toLowerCase().includes(s) ||
        b.codigo_anilha.toLowerCase().includes(s) ||
        b.nome_cientifico?.toLowerCase().includes(s)
    );
  }, [birds, search]);

  const selectedBird = birds.find(b => b.id === selectedId);

  // Stats
  const stats = useMemo(() => {
    if (!selectedBird) return null;
    const known = new Set<string>();
    const walk = (id?: string, depth = 0) => {
      if (!id || depth >= generations) return;
      const b = birds.find(x => x.id === id);
      if (!b) return;
      known.add(b.id);
      walk(b.pai_id, depth + 1);
      walk(b.mae_id, depth + 1);
    };
    walk(selectedBird.id);
    const total = Math.pow(2, generations) - 1;
    return { known: known.size, total };
  }, [selectedBird, birds, generations]);

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <div>
        <p className="label-eyebrow mb-1">Linhagem</p>
        <h1 className="page-title">Árvore Genealógica</h1>
        <p className="page-subtitle">Visualize a linhagem completa das aves</p>
      </div>

      {/* Controls */}
      <div className="card-premium p-3 sm:p-4 space-y-3">
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

        {selectedBird && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Gerações:</span>
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setGenerations(n)}
                  className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                    generations === n
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                className="btn-ghost p-1.5"
                aria-label="Diminuir zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                className="btn-ghost p-1.5"
                aria-label="Aumentar zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => setZoom(1)} className="btn-ghost p-1.5" aria-label="Resetar zoom">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            {stats && (
              <span className="text-xs text-muted-foreground w-full sm:w-auto">
                Ancestrais conhecidos: <span className="text-foreground font-medium">{stats.known}</span> / {stats.total}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {selectedBird && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-secondary/60 bg-secondary/10" /> Ave selecionada
          </span>
          <span className="flex items-center gap-1.5">
            <Mars className="w-3.5 h-3.5 text-info" /> Macho
          </span>
          <span className="flex items-center gap-1.5">
            <Venus className="w-3.5 h-3.5 text-feminino" /> Fêmea
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-dashed border-border/50" /> Desconhecido
          </span>
        </div>
      )}

      {selectedBird ? (
        <div className="card-premium p-4 sm:p-6 overflow-auto animate-fade-in">
          <div
            className="min-w-fit flex justify-center py-4 transition-transform"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            <TreeNode bird={selectedBird} birds={birds} depth={0} maxDepth={generations} role="self" />
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-card/40 rounded-2xl border border-dashed border-border/60">
          <BirdIcon className="w-12 h-12 mx-auto mb-3 opacity-20 text-secondary" />
          <p className="text-muted-foreground text-sm heading-serif italic">Selecione uma ave para visualizar sua árvore genealógica</p>
        </div>
      )}
    </div>
  );
}
