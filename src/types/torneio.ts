export type TorneioStatus = 'Rascunho' | 'Inscricoes' | 'Sorteado' | 'Em andamento' | 'Encerrado';
export type InscricaoStatus = 'Pendente' | 'Aprovada' | 'Rejeitada';
export type ConviteTipo = 'email' | 'link_aberto';
export type ConviteStatus = 'Pendente' | 'Aceito' | 'Recusado' | 'Expirado';

export interface Torneio {
  id: string;
  organizer_user_id: string;
  nome: string;
  data: string;
  regulamento: string | null;
  numero_estacoes: number;
  numero_baterias: number;
  status: TorneioStatus;
  created_at: string;
  updated_at: string;
  encerrado_em: string | null;
}

export interface TorneioConvite {
  id: string;
  torneio_id: string;
  tipo: ConviteTipo;
  email_convidado: string | null;
  token: string;
  status: ConviteStatus;
  accepted_user_id: string | null;
  accepted_at: string | null;
  created_at: string;
}

export interface TorneioInscricao {
  id: string;
  torneio_id: string;
  participante_user_id: string;
  bird_id: string;
  bird_snapshot: any;
  status: InscricaoStatus;
  motivo_rejeicao: string | null;
  estacao: number | null;
  created_at: string;
  updated_at: string;
}

export interface TorneioPontuacao {
  id: string;
  torneio_id: string;
  inscricao_id: string;
  bateria: number;
  pontos: number;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TorneioAuditLog {
  id: string;
  torneio_id: string;
  inscricao_id: string | null;
  acao: string;
  pontos_anterior: number | null;
  pontos_novo: number | null;
  bateria: number | null;
  user_id: string;
  created_at: string;
}

export interface ClassificacaoItem {
  inscricao: TorneioInscricao;
  totalPontos: number;
  baterias: Record<number, number>;
  posicao: number;
}

export function calcularClassificacao(
  inscricoes: TorneioInscricao[],
  pontuacoes: TorneioPontuacao[]
): ClassificacaoItem[] {
  const aprovadas = inscricoes.filter(i => i.status === 'Aprovada');
  const items = aprovadas.map(ins => {
    const ps = pontuacoes.filter(p => p.inscricao_id === ins.id);
    const baterias: Record<number, number> = {};
    let total = 0;
    ps.forEach(p => {
      baterias[p.bateria] = Number(p.pontos);
      total += Number(p.pontos);
    });
    return { inscricao: ins, totalPontos: total, baterias, posicao: 0 };
  });
  items.sort((a, b) => b.totalPontos - a.totalPontos);
  items.forEach((it, i) => { it.posicao = i + 1; });
  return items;
}
