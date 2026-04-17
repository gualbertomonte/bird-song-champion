export type FriendshipStatus = 'Pendente' | 'Aceito' | 'Rejeitado';

export interface Friendship {
  id: string;
  requester_user_id: string;
  addressee_user_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at?: string;
  // joined info
  other_user_id: string;
  other_email?: string;
  other_nome_criadouro?: string;
  other_codigo_criadouro?: string;
  is_requester: boolean; // true se eu enviei o pedido
}

export interface Treatment {
  id: string;
  user_id: string;
  bird_id: string;
  medicamento: string;
  dosagem?: string;
  via_administracao?: string;
  data_inicio: string;
  duracao_dias: number;
  frequencia_diaria: number;
  hora_primeira_dose: string;
  observacoes?: string;
  status: 'Ativo' | 'Concluido' | 'Cancelado';
  created_at: string;
  updated_at: string;
}

export interface TreatmentDose {
  id: string;
  treatment_id: string;
  user_id: string;
  bird_id: string;
  data_prevista: string;
  aplicada_em?: string;
  aplicada_por_user_id?: string;
  observacoes_aplicacao?: string;
  created_at: string;
}
