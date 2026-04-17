import { Trophy } from 'lucide-react';
import { Bird, Nest } from '@/types/bird';

interface Props {
  nests: Nest[];
  birds: Bird[];
}

interface CasalStats {
  key: string;
  mae?: Bird;
  pai?: Bird;
  ninhadas: number;
  ovos: number;
  filhotes: number;
  taxa: number; // 0-100
}

export function DesempenhoCasais({ nests, birds }: Props) {
  const map = new Map<string, CasalStats>();

  for (const n of nests) {
    const key = `${n.femea_id}__${n.macho_id}`;
    const cur = map.get(key) || {
      key,
      mae: birds.find(b => b.id === n.femea_id),
      pai: birds.find(b => b.id === n.macho_id),
      ninhadas: 0,
      ovos: 0,
      filhotes: 0,
      taxa: 0,
    };
    cur.ninhadas += 1;
    cur.ovos += n.quantidade_ovos || 0;
    if (n.status === 'Eclodida') cur.filhotes += n.quantidade_filhotes || 0;
    map.set(key, cur);
  }

  const casais = Array.from(map.values())
    .map(c => ({ ...c, taxa: c.ovos > 0 ? Math.round((c.filhotes / c.ovos) * 100) : 0 }))
    .sort((a, b) => b.filhotes - a.filhotes || b.taxa - a.taxa);

  if (casais.length === 0) return null;

  const corTaxa = (t: number) => {
    if (t >= 70) return 'bg-success/15 text-success';
    if (t >= 40) return 'bg-info/15 text-info';
    if (t > 0) return 'bg-warning/15 text-warning';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="bg-card rounded-xl border p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-secondary" /> Desempenho dos Casais
      </h3>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border/50">
              <th className="text-left font-medium py-1.5 px-2">Casal</th>
              <th className="text-center font-medium py-1.5 px-1">Ninh.</th>
              <th className="text-center font-medium py-1.5 px-1">Ovos</th>
              <th className="text-center font-medium py-1.5 px-1">Filh.</th>
              <th className="text-center font-medium py-1.5 px-2">Taxa</th>
            </tr>
          </thead>
          <tbody>
            {casais.map(c => (
              <tr key={c.key} className="border-b border-border/30 last:border-0">
                <td className="py-2 px-2">
                  <p className="font-medium truncate max-w-[180px]">
                    {c.mae?.nome || '?'} × {c.pai?.nome || '?'}
                  </p>
                </td>
                <td className="text-center px-1">{c.ninhadas}</td>
                <td className="text-center px-1">{c.ovos}</td>
                <td className="text-center px-1">{c.filhotes}</td>
                <td className="text-center px-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${corTaxa(c.taxa)}`}>
                    {c.taxa}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
