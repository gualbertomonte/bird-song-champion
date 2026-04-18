import { Trophy, Medal, Award } from 'lucide-react';
import type { RankingAcumuladoItem } from '@/types/grupo';
import { useAuth } from '@/context/AuthContext';

export default function RankingAcumuladoTable({ ranking, top }: { ranking: RankingAcumuladoItem[]; top?: number }) {
  const { user } = useAuth();
  const items = top ? ranking.slice(0, top) : ranking;

  if (items.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-muted/30 border border-border text-center">
        <Trophy className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum evento encerrado ainda</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left px-3 py-2.5">#</th>
            <th className="text-left px-3 py-2.5">Ave</th>
            <th className="text-left px-3 py-2.5">Anilha</th>
            <th className="text-center px-3 py-2.5">Eventos</th>
            <th className="text-right px-3 py-2.5">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const meu = it.membro_user_id === user?.id;
            const pos = i + 1;
            return (
              <tr key={`${it.bird_id}-${i}`} className={`border-t border-border ${meu ? 'bg-secondary/5' : ''}`}>
                <td className="px-3 py-2.5 font-medium">
                  {pos === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                  {pos === 2 && <Medal className="w-4 h-4 text-gray-400" />}
                  {pos === 3 && <Award className="w-4 h-4 text-orange-500" />}
                  {pos > 3 && <span className="text-muted-foreground">{pos}</span>}
                </td>
                <td className="px-3 py-2.5 font-medium">{it.bird_nome}{meu && <span className="ml-2 text-[10px] text-secondary">(sua)</span>}</td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{it.codigo_anilha}</td>
                <td className="px-3 py-2.5 text-center">{it.baterias_disputadas}</td>
                <td className="px-3 py-2.5 text-right font-semibold">{Number(it.total_pontos).toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
