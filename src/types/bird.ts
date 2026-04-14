export type BirdStatus = 'ativo' | 'vendido' | 'falecido';
export type BirdSex = 'macho' | 'fêmea';

export const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
] as const;

export type EstadoUF = typeof ESTADOS_BR[number];

export interface Bird {
  id: string;
  anilha: string;
  nome: string;
  especie: string;
  nomeCientifico?: string;
  sexo: BirdSex;
  dataNascimento: string;
  cor: string;
  fotos?: string[]; // Base64 array, first is main
  foto?: string; // legacy single photo
  status: BirdStatus;
  sispass?: string;
  estado?: EstadoUF;
  paiId?: string;
  maeId?: string;
  gaiolaId?: string;
  notas?: string;
}

export interface Tournament {
  id: string;
  nome: string;
  data: string;
  especiePermitida: string;
  numJuizes: number;
  status: 'aberto' | 'em_andamento' | 'finalizado';
  criterios: string[];
  inscricoes: TournamentEntry[];
}

export interface TournamentEntry {
  id: string;
  aveId: string;
  aveNome: string;
  aveAnilha: string;
  avaliacoes: Evaluation[];
  mediaFinal?: number;
}

export interface Evaluation {
  juizNome: string;
  notas: Record<string, number>;
  media: number;
}

export interface Treatment {
  id: string;
  aveId: string;
  medicamento: string;
  dataInicio: string;
  dataFim: string;
  dosagem: string;
  notas?: string;
}

export interface Cage {
  id: string;
  codigo: string;
  tipo: string;
  localizacao: string;
  aveId?: string;
}
