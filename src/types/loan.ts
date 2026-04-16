export type LoanStatus = 'Emprestada' | 'Devolucao_Solicitada' | 'Devolvida';

export interface BirdLoan {
  id: string;
  bird_id: string;
  bird_snapshot: any;
  owner_user_id: string;
  owner_email?: string;
  borrower_user_id?: string;
  borrower_email: string;
  borrower_codigo_criadouro?: string;
  borrower_bird_id?: string;
  data_emprestimo: string;
  prazo_devolucao?: string;
  data_solicitacao_devolucao?: string;
  data_devolucao?: string;
  status: LoanStatus;
  observacoes?: string;
  filhotes_gerados: number;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  mensagem?: string;
  link?: string;
  lida: boolean;
  metadata?: any;
  created_at: string;
}
