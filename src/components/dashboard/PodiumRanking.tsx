import { Bird as BirdIcon, Trophy, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Bird } from '@/types/bird';

interface RankItem {
  bird_id: string;
  total: number;
  count: number;
  avg: number;
  bird?: Bird;
}

export default function PodiumRanking({ items }: { items: RankItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Registre torneios para ver o ranking.</p>;
  }

  const top3 = items.slice(0, 3);
  const rest = items.slice(3);
  // Order for podium visual: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const heights = ['h-20', 'h-28', 'h-16'];
  const medalColors = ['text-medal-silver', 'text-secondary', 'text-medal-bronze'];
  const positions = [2, 1, 3];

  return (
    <div className="space-y-4">
      {/* Pódio visual */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 pt-2">
        {podiumOrder.map((item, idx) => {
          const pos = positions[idx];
          return (
            <Link
              key={item.bird_id}
              to={`/plantel/${item.bird_id}`}
              className="flex flex-col items-center group flex-1 max-w-[110px]"
            >
              <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 ${pos === 1 ? 'border-secondary shadow-lg shadow-secondary/20' : 'border-border'} group-hover:scale-105 transition-transform`}>
                {item.bird?.foto_url ? (
                  <img src={item.bird.foto_url} alt={item.bird.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted/40 flex items-center justify-center">
                    <BirdIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                {pos === 1 && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <Trophy className="w-4 h-4 text-secondary fill-secondary" />
                  </div>
                )}
              </div>
              <p className="text-xs font-medium mt-1.5 truncate max-w-full text-center">{item.bird?.nome}</p>
              <p className="text-[10px] text-muted-foreground">{item.avg} pts</p>
              <div className={`${heights[idx]} w-full mt-2 rounded-t-lg flex items-start justify-center pt-1.5 ${pos === 1 ? 'bg-gradient-to-b from-secondary/40 to-secondary/10 border border-secondary/30' : pos === 2 ? 'bg-muted/40 border border-border' : 'bg-orange-400/15 border border-orange-400/25'}`}>
                <span className={`text-sm font-bold ${medalColors[pos - 1]}`}>{pos}º</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 4º e 5º */}
      {rest.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border/50">
          {rest.map((item, i) => (
            <Link
              key={item.bird_id}
              to={`/plantel/${item.bird_id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <span className="text-xs font-semibold text-muted-foreground w-6">{i + 4}º</span>
              <div className="w-7 h-7 rounded-full bg-muted/40 overflow-hidden flex-shrink-0">
                {item.bird?.foto_url ? (
                  <img src={item.bird.foto_url} alt={item.bird.nome} className="w-full h-full object-cover" />
                ) : (
                  <BirdIcon className="w-3.5 h-3.5 m-auto mt-1.5 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium truncate flex-1">{item.bird?.nome}</p>
              <span className="text-xs text-muted-foreground">{item.count} torneios</span>
              <span className="text-sm font-bold text-secondary">{item.avg}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
