import { Link } from 'react-router-dom';
import { Users, Crown, ChevronRight } from 'lucide-react';
import type { TorneioGrupo } from '@/types/grupo';
import { useAuth } from '@/context/AuthContext';

export default function GrupoCard({ grupo, membrosCount }: { grupo: TorneioGrupo; membrosCount?: number }) {
  const { user } = useAuth();
  const isAdmin = grupo.admin_user_id === user?.id;
  return (
    <Link
      to={`/grupos/${grupo.id}`}
      className="block p-4 rounded-2xl bg-card border border-border hover:border-secondary/40 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="heading-serif font-semibold text-base text-foreground truncate">{grupo.nome}</h3>
            {isAdmin && <Crown className="w-3.5 h-3.5 text-secondary flex-shrink-0" />}
          </div>
          {grupo.descricao && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{grupo.descricao}</p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{membrosCount ?? '—'} {membrosCount === 1 ? 'membro' : 'membros'}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
