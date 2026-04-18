export type GrupoPapel = 'admin' | 'membro';
export type MembroStatus = 'Pendente' | 'Ativo' | 'Saiu';
export type ConviteGrupoStatus = 'Pendente' | 'Aceito' | 'Recusado';
export type BateriaStatus = 'Agendada' | 'Inscricoes' | 'Sorteada' | 'Em andamento' | 'Encerrada';
export type InscricaoBateriaStatus = 'Pendente' | 'Aprovada' | 'Rejeitada';

export interface TorneioGrupo {
  id: string;
  admin_user_id: string;
  nome: string;
  descricao: string | null;
  regulamento_padrao: string | null;
  convite_token: string;
  created_at: string;
  updated_at: string;
}

export interface GrupoMembro {
  id: string;
  grupo_id: string;
  user_id: string;
  papel: GrupoPapel;
  status: MembroStatus;
  created_at: string;
}

export interface GrupoConvite {
  id: string;
  grupo_id: string;
  convidado_user_id: string;
  convidado_por: string;
  status: ConviteGrupoStatus;
  created_at: string;
  responded_at: string | null;
}

export type BateriaFormato = 'simples' | 'eliminatoria';
export type BateriaFase = 'unica' | 'classificatoria' | 'final';

export interface Bateria {
  id: string;
  grupo_id: string;
  nome: string;
  data: string;
  numero_estacoes: number;
  regulamento: string | null;
  status: BateriaStatus;
  criado_por: string;
  encerrado_em: string | null;
  created_at: string;
  updated_at: string;
  formato: BateriaFormato;
  fase_atual: BateriaFase;
  classif_duracao_min: number | null;
  classif_corte_minimo: number | null;
  final_duracao_min: number | null;
}

export interface BateriaInscricao {
  id: string;
  bateria_id: string;
  membro_user_id: string;
  bird_id: string;
  bird_snapshot: any;
  status: InscricaoBateriaStatus;
  estacao: number | null;
  motivo_rejeicao: string | null;
  created_at: string;
  updated_at: string;
  convidado_pelo_admin: boolean;
  pontos_classif: number | null;
  pontos_final: number | null;
  classificado_final: boolean;
}

export interface BateriaPontuacao {
  id: string;
  bateria_id: string;
  inscricao_id: string;
  pontos: number;
  registrado_por: string;
  created_at: string;
  updated_at: string;
}

export interface RankingAcumuladoItem {
  grupo_id: string;
  membro_user_id: string;
  bird_id: string;
  bird_nome: string;
  codigo_anilha: string;
  baterias_disputadas: number;
  total_pontos: number;
}

export interface ClassificacaoBateriaItem {
  inscricao: BateriaInscricao;
  pontos: number;
  posicao: number;
}

export function calcularClassificacaoBateria(
  inscricoes: BateriaInscricao[],
  pontuacoes: BateriaPontuacao[]
): ClassificacaoBateriaItem[] {
  const aprovadas = inscricoes.filter(i => i.status === 'Aprovada');
  const items = aprovadas.map(ins => {
    const p = pontuacoes.find(x => x.inscricao_id === ins.id);
    return { inscricao: ins, pontos: Number(p?.pontos ?? 0), posicao: 0 };
  });
  items.sort((a, b) => b.pontos - a.pontos);
  items.forEach((it, i) => { it.posicao = i + 1; });
  return items;
}
