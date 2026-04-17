import { Handshake, ArrowDownToLine } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoanStatus = 'proprio' | 'emprestada_entrada' | 'emprestada_saida' | string | undefined | null;

interface Props {
  status: LoanStatus;
  size?: 'xs' | 'sm';
  className?: string;
  /** mostra apenas o ícone, sem texto */
  iconOnly?: boolean;
}

/**
 * Badge unificado para status de empréstimo de uma ave.
 * - proprio (ou null): nada
 * - emprestada_entrada: recebida (info)
 * - emprestada_saida: emprestada para outro (warning)
 */
export default function LoanBadge({ status, size = 'xs', className, iconOnly = false }: Props) {
  if (!status || status === 'proprio') return null;

  const isIncoming = status === 'emprestada_entrada';
  const Icon = isIncoming ? Handshake : ArrowDownToLine;
  const label = isIncoming ? 'Recebida em empréstimo' : 'Emprestada';
  const tone = isIncoming
    ? 'bg-info/10 text-info border-info/20'
    : 'bg-warning/10 text-warning border-warning/20';

  const sizing = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5 gap-1'
    : 'text-xs px-2 py-1 gap-1.5';

  if (iconOnly) {
    return (
      <span title={label} className={cn('inline-flex items-center justify-center rounded-md border', tone, 'p-1', className)}>
        <Icon className="w-3 h-3" />
      </span>
    );
  }

  return (
    <span
      title={label}
      className={cn('inline-flex items-center rounded-md border font-medium', tone, sizing, className)}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
