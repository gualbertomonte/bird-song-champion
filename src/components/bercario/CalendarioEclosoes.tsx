import { CalendarDays } from 'lucide-react';
import { Bird, Nest } from '@/types/bird';

const PERIODO_INCUBACAO_DIAS = 14; // padrão para passeriformes

interface Props {
  ninhadas: Nest[];
  birds: Bird[];
}

export function CalendarioEclosoes({ ninhadas, birds }: Props) {
  const previsoes = ninhadas
    .map(n => {
      const previsao = new Date(n.data_postura);
      previsao.setDate(previsao.getDate() + PERIODO_INCUBACAO_DIAS);
      const diasRest = Math.ceil((previsao.getTime() - Date.now()) / 86400000);
      const mae = birds.find(b => b.id === n.femea_id);
      const pai = birds.find(b => b.id === n.macho_id);
      return { nest: n, previsao, diasRest, mae, pai };
    })
    .sort((a, b) => a.previsao.getTime() - b.previsao.getTime());

  if (previsoes.length === 0) return null;

  const corDias = (dias: number) => {
    if (dias < 0) return 'text-warning';
    if (dias <= 2) return 'text-success';
    if (dias <= 7) return 'text-info';
    return 'text-muted-foreground';
  };

  const labelDias = (dias: number) => {
    if (dias < 0) return `Atrasado ${Math.abs(dias)}d`;
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Amanhã';
    return `Em ${dias} dias`;
  };

  return (
    <div className="bg-card rounded-xl border p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" /> Eclosões Previstas
      </h3>
      <div className="space-y-2">
        {previsoes.map(p => (
          <div key={p.nest.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{p.mae?.nome} × {p.pai?.nome}</p>
              <p className="text-xs text-muted-foreground">
                {p.previsao.toLocaleDateString('pt-BR')} · {p.nest.quantidade_ovos} ovos
              </p>
            </div>
            <span className={`text-xs font-semibold whitespace-nowrap ml-2 ${corDias(p.diasRest)}`}>
              {labelDias(p.diasRest)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
