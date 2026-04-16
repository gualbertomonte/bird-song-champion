export type BirdStatus = 'Ativo' | 'Berçário' | 'Vendido' | 'Falecido';
export type BirdSex = 'M' | 'F' | 'I';

export const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
] as const;

export type EstadoUF = typeof ESTADOS_BR[number];

export interface Bird {
  id: string;
  nome: string; // was nome_comum
  nome_cientifico: string;
  sexo: BirdSex;
  data_nascimento?: string;
  tipo_anilha?: 'Fechada' | 'Aberta';
  diametro_anilha?: string;
  codigo_anilha: string;
  status: BirdStatus;
  observacoes?: string;
  pai_id?: string;
  mae_id?: string;
  foto_url?: string;
  fotos?: string[];
  estado?: EstadoUF;
  nome_comum_especie?: string;
  created_at?: string;
  updated_at?: string;
  transferido_por_email?: string;
  transferido_em?: string;
}

export interface Nest {
  id: string;
  femea_id: string;
  macho_id: string;
  data_postura: string;
  data_eclosao?: string;
  quantidade_ovos: number;
  quantidade_filhotes?: number;
  status: 'Incubando' | 'Eclodida' | 'Perdida';
  observacoes?: string;
  created_at?: string;
}

export interface Tournament {
  id: string;
  bird_id: string;
  data: string;
  nome_torneio: string;
  clube?: string;
  pontuacao: number;
  classificacao?: string;
  created_at?: string;
}

export interface HealthRecord {
  id: string;
  bird_id: string;
  data: string;
  tipo: string;
  descricao?: string;
  proxima_dose?: string;
}

export interface CriadorProfile {
  nome_criadouro: string;
  cpf?: string;
  registro_ctf?: string;
  validade_ctf?: string;
  endereco?: string;
  telefone?: string;
  logo_url?: string;
}
