import { useTratamentos } from '@/hooks/useTratamentos';
import { useAppState } from '@/context/AppContext';
import { Pill, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Card do Dashboard mostrando doses de medicamentos pendentes hoje.
 */
export default function DosesHojeCard() {
  const { birds } = useAppState();
  const { doses, treatments, marcarAplicada } = useTratamentos();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dosesHojePendentes = doses
    .filter(d => {
      const dt = new Date(d.data_prevista);
      const t = treatments.find(t => t.id === d.treatment_id);
      return !d.aplicada_em && dt < tomorrow && t?.status === 'Ativo';
    })
    .sort((a, b) => new Date(a.data_prevista).getTime() - new Date(b.data_prevista).getTime());

  if (dosesHojePendentes.length === 0) return null;

  const overdueCount = dosesHojePendentes.filter(d => new Date(d.data_prevista) < today).length;

  return (
    <div className="card-premium p-4 sm:p-5 animate-fade-in">
      <h2 className="heading-serif font-semibold text-base sm:text-lg mb-3 flex items-center gap-2">
        <Pill className="w-4 h-4 text-secondary" /> Medicação de hoje
        <span className="ml-auto text-xs text-muted-foreground font-normal">
          {dosesHojePendentes.length} pendente(s)
          {overdueCount > 0 && <span className="text-destructive ml-1">· {overdueCount} atrasada(s)</span>}
        </span>
      </h2>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {dosesHojePendentes.slice(0, 8).map(d => {
          const t = treatments.find(t => t.id === d.treatment_id);
          const bird = birds.find(b => b.id === d.bird_id);
          const dt = new Date(d.data_prevista);
          const isOverdue = dt < today;
          return (
            <div
              key={d.id}
              className={`flex items-center gap-2 sm:gap-3 p-2.5 rounded-lg border ${
                isOverdue ? 'bg-destructive/5 border-destructive/15' : 'bg-secondary/5 border-secondary/10'
              }`}
            >
              {isOverdue ? (
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              ) : (
                <Pill className="w-4 h-4 text-secondary flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">
                  {bird?.nome} — {t?.medicamento}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {t?.dosagem && ` · ${t.dosagem}`}
                  {isOverdue && <span className="text-destructive ml-1">· atrasada</span>}
                </p>
              </div>
              <button
                onClick={() => marcarAplicada(d.id).catch(e => toast.error(e.message))}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-success/15 text-success hover:bg-success/25 transition-colors font-medium inline-flex items-center gap-1 flex-shrink-0"
              >
                <Check className="w-3 h-3" /> Aplicar
              </button>
            </div>
          );
        })}
      </div>
      {dosesHojePendentes.length > 8 && (
        <Link to="/saude" className="text-xs text-secondary hover:underline mt-2 block text-center">
          Ver todas ({dosesHojePendentes.length})
        </Link>
      )}
    </div>
  );
}
