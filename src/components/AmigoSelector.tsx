import { useState } from 'react';
import { Users, Mail } from 'lucide-react';
import { useAmigos } from '@/hooks/useAmigos';

interface Props {
  /** Valor que será passado ao backend (email OU código de criadouro) */
  value: string;
  onChange: (value: string) => void;
  /** Se true, usa o email do amigo. Se false, o código do criadouro. */
  preferEmail?: boolean;
  placeholder?: string;
  label?: string;
  help?: string;
  /** Força modo "email" no manual fallback */
  forceEmail?: boolean;
  /** Força modo "código" no manual fallback */
  forceCodigo?: boolean;
}

/**
 * Combobox híbrido: lista amigos aceitos + permite digitar email/código manualmente.
 */
export default function AmigoSelector({
  value, onChange, preferEmail = true, placeholder, label, help, forceEmail, forceCodigo,
}: Props) {
  const { amigos } = useAmigos();
  const [mode, setMode] = useState<'amigo' | 'manual'>(amigos.length > 0 ? 'amigo' : 'manual');

  const showOnlyEmail = forceEmail;
  const showOnlyCodigo = forceCodigo;

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}

      {amigos.length > 0 && !showOnlyCodigo && !showOnlyEmail && (
        <div className="flex gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('amigo')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
              mode === 'amigo' ? 'bg-secondary/20 text-secondary' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Users className="w-3 h-3" /> Da lista de amigos ({amigos.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
              mode === 'manual' ? 'bg-secondary/20 text-secondary' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Mail className="w-3 h-3" /> Digitar manualmente
          </button>
        </div>
      )}

      {mode === 'amigo' && amigos.length > 0 && !showOnlyCodigo && !showOnlyEmail ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field"
        >
          <option value="">Selecione um amigo...</option>
          {amigos.map(a => {
            const v = preferEmail ? (a.other_email || '') : (a.other_codigo_criadouro || '');
            return (
              <option key={a.id} value={v} disabled={!v}>
                {a.other_nome_criadouro || a.other_email}
                {a.other_codigo_criadouro ? ` (${a.other_codigo_criadouro})` : ''}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(showOnlyCodigo || (!preferEmail && !showOnlyEmail) ? e.target.value.toUpperCase() : e.target.value)}
          placeholder={placeholder || (preferEmail ? 'email@exemplo.com ou CÓDIGO' : 'CÓDIGO do criadouro')}
          className={`input-field ${(!preferEmail || showOnlyCodigo) ? 'font-mono uppercase tracking-wider' : ''}`}
          maxLength={(!preferEmail || showOnlyCodigo) ? 6 : undefined}
        />
      )}

      {help && <p className="text-[10px] text-muted-foreground">{help}</p>}
    </div>
  );
}
