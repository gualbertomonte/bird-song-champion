import { useAppState } from '@/context/AppContext';
import { Stethoscope, Pill, Calendar, AlertCircle } from 'lucide-react';

export default function Saude() {
  const { treatments, birds } = useAppState();

  const today = new Date();
  const active = treatments.filter(t => new Date(t.dataFim) >= today);
  const past = treatments.filter(t => new Date(t.dataFim) < today);

  const getBirdName = (id: string) => birds.find(b => b.id === id)?.nome || 'Desconhecida';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Saúde & Tratamentos</h1>
        <p className="page-subtitle">{treatments.length} tratamentos registrados</p>
      </div>

      {/* Active treatments */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning" /> Tratamentos Ativos
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum tratamento ativo no momento.</p>
        ) : (
          <div className="space-y-3">
            {active.map(t => (
              <div key={t.id} className="flex items-center gap-4 p-4 rounded-lg bg-warning/5 border border-warning/20">
                <Pill className="w-5 h-5 text-warning flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{getBirdName(t.aveId)} – {t.medicamento}</p>
                  <p className="text-xs text-muted-foreground">Dosagem: {t.dosagem}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{new Date(t.dataInicio).toLocaleDateString('pt-BR')} – {new Date(t.dataFim).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past treatments */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" /> Histórico
        </h2>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum tratamento no histórico.</p>
        ) : (
          <div className="space-y-2">
            {past.map(t => (
              <div key={t.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <Stethoscope className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">{getBirdName(t.aveId)} – {t.medicamento}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(t.dataFim).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
