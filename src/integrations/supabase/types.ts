export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bateria_inscricoes: {
        Row: {
          bateria_id: string
          bird_id: string
          bird_snapshot: Json
          classificado_final: boolean
          convidado_pelo_admin: boolean
          created_at: string
          estacao: number | null
          id: string
          membro_user_id: string
          motivo_rejeicao: string | null
          pontos_classif: number | null
          pontos_final: number | null
          status: string
          updated_at: string
        }
        Insert: {
          bateria_id: string
          bird_id: string
          bird_snapshot?: Json
          classificado_final?: boolean
          convidado_pelo_admin?: boolean
          created_at?: string
          estacao?: number | null
          id?: string
          membro_user_id: string
          motivo_rejeicao?: string | null
          pontos_classif?: number | null
          pontos_final?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          bateria_id?: string
          bird_id?: string
          bird_snapshot?: Json
          classificado_final?: boolean
          convidado_pelo_admin?: boolean
          created_at?: string
          estacao?: number | null
          id?: string
          membro_user_id?: string
          motivo_rejeicao?: string | null
          pontos_classif?: number | null
          pontos_final?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bateria_inscricoes_bateria_id_fkey"
            columns: ["bateria_id"]
            isOneToOne: false
            referencedRelation: "torneio_baterias"
            referencedColumns: ["id"]
          },
        ]
      }
      bateria_pontuacoes: {
        Row: {
          bateria_id: string
          created_at: string
          id: string
          inscricao_id: string
          pontos: number
          registrado_por: string
          updated_at: string
        }
        Insert: {
          bateria_id: string
          created_at?: string
          id?: string
          inscricao_id: string
          pontos?: number
          registrado_por: string
          updated_at?: string
        }
        Update: {
          bateria_id?: string
          created_at?: string
          id?: string
          inscricao_id?: string
          pontos?: number
          registrado_por?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bateria_pontuacoes_bateria_id_fkey"
            columns: ["bateria_id"]
            isOneToOne: false
            referencedRelation: "torneio_baterias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bateria_pontuacoes_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: true
            referencedRelation: "bateria_inscricoes"
            referencedColumns: ["id"]
          },
        ]
      }
      bird_loans: {
        Row: {
          bird_id: string
          bird_snapshot: Json
          borrower_bird_id: string | null
          borrower_codigo_criadouro: string | null
          borrower_email: string
          borrower_user_id: string | null
          created_at: string
          data_devolucao: string | null
          data_emprestimo: string
          data_solicitacao_devolucao: string | null
          filhotes_gerados: number
          id: string
          observacoes: string | null
          owner_email: string | null
          owner_user_id: string
          prazo_devolucao: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bird_id: string
          bird_snapshot?: Json
          borrower_bird_id?: string | null
          borrower_codigo_criadouro?: string | null
          borrower_email: string
          borrower_user_id?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_emprestimo?: string
          data_solicitacao_devolucao?: string | null
          filhotes_gerados?: number
          id?: string
          observacoes?: string | null
          owner_email?: string | null
          owner_user_id: string
          prazo_devolucao?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bird_id?: string
          bird_snapshot?: Json
          borrower_bird_id?: string | null
          borrower_codigo_criadouro?: string | null
          borrower_email?: string
          borrower_user_id?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_emprestimo?: string
          data_solicitacao_devolucao?: string | null
          filhotes_gerados?: number
          id?: string
          observacoes?: string | null
          owner_email?: string | null
          owner_user_id?: string
          prazo_devolucao?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      birds: {
        Row: {
          anilha_sispass: boolean
          codigo_anilha: string
          created_at: string
          data_nascimento: string | null
          diametro_anilha: string | null
          estado: string | null
          foto_url: string | null
          fotos: Json | null
          gerado_no_bercario: boolean
          id: string
          loan_id: string | null
          loan_status: string
          mae_id: string | null
          nome: string
          nome_cientifico: string
          nome_comum_especie: string | null
          observacoes: string | null
          original_bird_id: string | null
          original_owner_email: string | null
          original_owner_user_id: string | null
          pai_id: string | null
          sexo: string
          status: string
          tipo_anilha: string | null
          transferido_em: string | null
          transferido_por_email: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anilha_sispass?: boolean
          codigo_anilha?: string
          created_at?: string
          data_nascimento?: string | null
          diametro_anilha?: string | null
          estado?: string | null
          foto_url?: string | null
          fotos?: Json | null
          gerado_no_bercario?: boolean
          id?: string
          loan_id?: string | null
          loan_status?: string
          mae_id?: string | null
          nome: string
          nome_cientifico?: string
          nome_comum_especie?: string | null
          observacoes?: string | null
          original_bird_id?: string | null
          original_owner_email?: string | null
          original_owner_user_id?: string | null
          pai_id?: string | null
          sexo?: string
          status?: string
          tipo_anilha?: string | null
          transferido_em?: string | null
          transferido_por_email?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anilha_sispass?: boolean
          codigo_anilha?: string
          created_at?: string
          data_nascimento?: string | null
          diametro_anilha?: string | null
          estado?: string | null
          foto_url?: string | null
          fotos?: Json | null
          gerado_no_bercario?: boolean
          id?: string
          loan_id?: string | null
          loan_status?: string
          mae_id?: string | null
          nome?: string
          nome_cientifico?: string
          nome_comum_especie?: string | null
          observacoes?: string | null
          original_bird_id?: string | null
          original_owner_email?: string | null
          original_owner_user_id?: string | null
          pai_id?: string | null
          sexo?: string
          status?: string
          tipo_anilha?: string | null
          transferido_em?: string | null
          transferido_por_email?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      criador_profile: {
        Row: {
          codigo_criadouro: string | null
          cpf: string | null
          endereco: string | null
          logo_url: string | null
          mobile_nav_config: Json | null
          nome_criadouro: string
          registro_ctf: string | null
          telefone: string | null
          updated_at: string
          user_id: string
          validade_ctf: string | null
        }
        Insert: {
          codigo_criadouro?: string | null
          cpf?: string | null
          endereco?: string | null
          logo_url?: string | null
          mobile_nav_config?: Json | null
          nome_criadouro?: string
          registro_ctf?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
          validade_ctf?: string | null
        }
        Update: {
          codigo_criadouro?: string | null
          cpf?: string | null
          endereco?: string | null
          logo_url?: string | null
          mobile_nav_config?: Json | null
          nome_criadouro?: string
          registro_ctf?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
          validade_ctf?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_user_id: string
          created_at: string
          id: string
          requester_user_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          addressee_user_id: string
          created_at?: string
          id?: string
          requester_user_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          addressee_user_id?: string
          created_at?: string
          id?: string
          requester_user_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      health_records: {
        Row: {
          aplicada_em: string | null
          bird_id: string
          created_at: string
          data: string
          descricao: string | null
          id: string
          proxima_dose: string | null
          recorrencia_meses: number | null
          tipo: string
          user_id: string
        }
        Insert: {
          aplicada_em?: string | null
          bird_id: string
          created_at?: string
          data: string
          descricao?: string | null
          id?: string
          proxima_dose?: string | null
          recorrencia_meses?: number | null
          tipo?: string
          user_id: string
        }
        Update: {
          aplicada_em?: string | null
          bird_id?: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          proxima_dose?: string | null
          recorrencia_meses?: number | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      nests: {
        Row: {
          created_at: string
          data_eclosao: string | null
          data_postura: string
          femea_id: string
          id: string
          macho_id: string
          observacoes: string | null
          quantidade_filhotes: number | null
          quantidade_ovos: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_eclosao?: string | null
          data_postura: string
          femea_id: string
          id?: string
          macho_id: string
          observacoes?: string | null
          quantidade_filhotes?: number | null
          quantidade_ovos?: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_eclosao?: string | null
          data_postura?: string
          femea_id?: string
          id?: string
          macho_id?: string
          observacoes?: string | null
          quantidade_filhotes?: number | null
          quantidade_ovos?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string | null
          metadata: Json | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          metadata?: Json | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          metadata?: Json | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_transfers: {
        Row: {
          bird_data: Json
          claimed: boolean
          id: string
          recipient_email: string
          sender_email: string | null
          transferido_por_email: string | null
          transferido_por_user_id: string | null
          transferred_at: string
        }
        Insert: {
          bird_data: Json
          claimed?: boolean
          id?: string
          recipient_email: string
          sender_email?: string | null
          transferido_por_email?: string | null
          transferido_por_user_id?: string | null
          transferred_at?: string
        }
        Update: {
          bird_data?: Json
          claimed?: boolean
          id?: string
          recipient_email?: string
          sender_email?: string | null
          transferido_por_email?: string | null
          transferido_por_user_id?: string | null
          transferred_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      torneio_audit_log: {
        Row: {
          acao: string
          bateria: number | null
          created_at: string
          id: string
          inscricao_id: string | null
          pontos_anterior: number | null
          pontos_novo: number | null
          torneio_id: string
          user_id: string
        }
        Insert: {
          acao: string
          bateria?: number | null
          created_at?: string
          id?: string
          inscricao_id?: string | null
          pontos_anterior?: number | null
          pontos_novo?: number | null
          torneio_id: string
          user_id: string
        }
        Update: {
          acao?: string
          bateria?: number | null
          created_at?: string
          id?: string
          inscricao_id?: string | null
          pontos_anterior?: number | null
          pontos_novo?: number | null
          torneio_id?: string
          user_id?: string
        }
        Relationships: []
      }
      torneio_baterias: {
        Row: {
          classif_corte_minimo: number | null
          classif_duracao_min: number | null
          created_at: string
          criado_por: string
          data: string
          encerrado_em: string | null
          fase_atual: string
          final_duracao_min: number | null
          formato: string
          grupo_id: string
          id: string
          nome: string
          numero_estacoes: number
          regulamento: string | null
          status: string
          updated_at: string
        }
        Insert: {
          classif_corte_minimo?: number | null
          classif_duracao_min?: number | null
          created_at?: string
          criado_por: string
          data: string
          encerrado_em?: string | null
          fase_atual?: string
          final_duracao_min?: number | null
          formato?: string
          grupo_id: string
          id?: string
          nome: string
          numero_estacoes?: number
          regulamento?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          classif_corte_minimo?: number | null
          classif_duracao_min?: number | null
          created_at?: string
          criado_por?: string
          data?: string
          encerrado_em?: string | null
          fase_atual?: string
          final_duracao_min?: number | null
          formato?: string
          grupo_id?: string
          id?: string
          nome?: string
          numero_estacoes?: number
          regulamento?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "torneio_baterias_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "torneio_grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      torneio_convites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email_convidado: string | null
          id: string
          status: string
          tipo: string
          token: string
          torneio_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email_convidado?: string | null
          id?: string
          status?: string
          tipo: string
          token?: string
          torneio_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email_convidado?: string | null
          id?: string
          status?: string
          tipo?: string
          token?: string
          torneio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "torneio_convites_torneio_id_fkey"
            columns: ["torneio_id"]
            isOneToOne: false
            referencedRelation: "torneios"
            referencedColumns: ["id"]
          },
        ]
      }
      torneio_grupo_convites: {
        Row: {
          convidado_por: string
          convidado_user_id: string
          created_at: string
          grupo_id: string
          id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          convidado_por: string
          convidado_user_id: string
          created_at?: string
          grupo_id: string
          id?: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          convidado_por?: string
          convidado_user_id?: string
          created_at?: string
          grupo_id?: string
          id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "torneio_grupo_convites_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "torneio_grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      torneio_grupo_convites_email: {
        Row: {
          claimed_at: string | null
          claimed_user_id: string | null
          convidado_por: string
          created_at: string
          email: string
          grupo_id: string
          id: string
          status: string
          token: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_user_id?: string | null
          convidado_por: string
          created_at?: string
          email: string
          grupo_id: string
          id?: string
          status?: string
          token?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_user_id?: string | null
          convidado_por?: string
          created_at?: string
          email?: string
          grupo_id?: string
          id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "torneio_grupo_convites_email_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "torneio_grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      torneio_grupo_membros: {
        Row: {
          created_at: string
          grupo_id: string
          id: string
          papel: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grupo_id: string
          id?: string
          papel?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grupo_id?: string
          id?: string
          papel?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "torneio_grupo_membros_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "torneio_grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      torneio_grupos: {
        Row: {
          admin_user_id: string
          convite_token: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          regulamento_padrao: string | null
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          convite_token?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          regulamento_padrao?: string | null
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          convite_token?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          regulamento_padrao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      torneio_inscricoes: {
        Row: {
          bird_id: string
          bird_snapshot: Json
          created_at: string
          estacao: number | null
          id: string
          motivo_rejeicao: string | null
          participante_user_id: string
          status: string
          torneio_id: string
          updated_at: string
        }
        Insert: {
          bird_id: string
          bird_snapshot?: Json
          created_at?: string
          estacao?: number | null
          id?: string
          motivo_rejeicao?: string | null
          participante_user_id: string
          status?: string
          torneio_id: string
          updated_at?: string
        }
        Update: {
          bird_id?: string
          bird_snapshot?: Json
          created_at?: string
          estacao?: number | null
          id?: string
          motivo_rejeicao?: string | null
          participante_user_id?: string
          status?: string
          torneio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "torneio_inscricoes_torneio_id_fkey"
            columns: ["torneio_id"]
            isOneToOne: false
            referencedRelation: "torneios"
            referencedColumns: ["id"]
          },
        ]
      }
      torneio_participantes: {
        Row: {
          created_at: string
          id: string
          torneio_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          torneio_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          torneio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "torneio_participantes_torneio_id_fkey"
            columns: ["torneio_id"]
            isOneToOne: false
            referencedRelation: "torneios"
            referencedColumns: ["id"]
          },
        ]
      }
      torneio_pontuacoes: {
        Row: {
          bateria: number
          created_at: string
          created_by_user_id: string
          id: string
          inscricao_id: string
          pontos: number
          torneio_id: string
          updated_at: string
        }
        Insert: {
          bateria?: number
          created_at?: string
          created_by_user_id: string
          id?: string
          inscricao_id: string
          pontos?: number
          torneio_id: string
          updated_at?: string
        }
        Update: {
          bateria?: number
          created_at?: string
          created_by_user_id?: string
          id?: string
          inscricao_id?: string
          pontos?: number
          torneio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "torneio_pontuacoes_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: false
            referencedRelation: "torneio_inscricoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneio_pontuacoes_torneio_id_fkey"
            columns: ["torneio_id"]
            isOneToOne: false
            referencedRelation: "torneios"
            referencedColumns: ["id"]
          },
        ]
      }
      torneios: {
        Row: {
          created_at: string
          data: string
          encerrado_em: string | null
          id: string
          nome: string
          numero_baterias: number
          numero_estacoes: number
          organizer_user_id: string
          regulamento: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          encerrado_em?: string | null
          id?: string
          nome: string
          numero_baterias?: number
          numero_estacoes?: number
          organizer_user_id: string
          regulamento?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          encerrado_em?: string | null
          id?: string
          nome?: string
          numero_baterias?: number
          numero_estacoes?: number
          organizer_user_id?: string
          regulamento?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          bird_id: string
          classificacao: string | null
          clube: string | null
          created_at: string
          data: string
          id: string
          nome_torneio: string
          pontuacao: number
          user_id: string
        }
        Insert: {
          bird_id: string
          classificacao?: string | null
          clube?: string | null
          created_at?: string
          data: string
          id?: string
          nome_torneio?: string
          pontuacao?: number
          user_id: string
        }
        Update: {
          bird_id?: string
          classificacao?: string | null
          clube?: string | null
          created_at?: string
          data?: string
          id?: string
          nome_torneio?: string
          pontuacao?: number
          user_id?: string
        }
        Relationships: []
      }
      treatment_doses: {
        Row: {
          aplicada_em: string | null
          aplicada_por_user_id: string | null
          bird_id: string
          created_at: string
          data_prevista: string
          id: string
          observacoes_aplicacao: string | null
          treatment_id: string
          user_id: string
        }
        Insert: {
          aplicada_em?: string | null
          aplicada_por_user_id?: string | null
          bird_id: string
          created_at?: string
          data_prevista: string
          id?: string
          observacoes_aplicacao?: string | null
          treatment_id: string
          user_id: string
        }
        Update: {
          aplicada_em?: string | null
          aplicada_por_user_id?: string | null
          bird_id?: string
          created_at?: string
          data_prevista?: string
          id?: string
          observacoes_aplicacao?: string | null
          treatment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_doses_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          bird_id: string
          created_at: string
          data_inicio: string
          dosagem: string | null
          duracao_dias: number
          frequencia_diaria: number
          hora_primeira_dose: string
          id: string
          medicamento: string
          observacoes: string | null
          status: string
          updated_at: string
          user_id: string
          via_administracao: string | null
        }
        Insert: {
          bird_id: string
          created_at?: string
          data_inicio: string
          dosagem?: string | null
          duracao_dias: number
          frequencia_diaria?: number
          hora_primeira_dose?: string
          id?: string
          medicamento: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          via_administracao?: string | null
        }
        Update: {
          bird_id?: string
          created_at?: string
          data_inicio?: string
          dosagem?: string | null
          duracao_dias?: number
          frequencia_diaria?: number
          hora_primeira_dose?: string
          id?: string
          medicamento?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          via_administracao?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aceitar_convite_grupo_por_token: {
        Args: { _token: string }
        Returns: Json
      }
      aceitar_convite_torneio: { Args: { _token: string }; Returns: Json }
      aplicar_corte_classificatoria: {
        Args: { _bateria_id: string }
        Returns: Json
      }
      aprovar_inscricao: {
        Args: { _aprovar: boolean; _inscricao_id: string; _motivo?: string }
        Returns: undefined
      }
      aprovar_inscricao_bateria: {
        Args: { _aprovar: boolean; _inscricao_id: string; _motivo?: string }
        Returns: undefined
      }
      cancel_loan: { Args: { _loan_id: string }; Returns: undefined }
      confirm_loan_return: { Args: { _loan_id: string }; Returns: undefined }
      convidar_membro_grupo: {
        Args: { _grupo_id: string; _user_id: string }
        Returns: string
      }
      convidar_membros_evento: {
        Args: { _bateria_id: string; _user_ids: string[] }
        Returns: number
      }
      convidar_por_email_grupo: {
        Args: { _email: string; _grupo_id: string }
        Returns: Json
      }
      create_loan: {
        Args: {
          _bird_id: string
          _codigo_criadouro: string
          _observacoes?: string
          _prazo?: string
        }
        Returns: Json
      }
      criar_bateria: {
        Args: {
          _data: string
          _grupo_id: string
          _nome: string
          _numero_estacoes: number
          _regulamento?: string
        }
        Returns: string
      }
      criar_grupo_torneio: {
        Args: { _descricao?: string; _nome: string; _regulamento?: string }
        Returns: string
      }
      criar_tratamento: {
        Args: {
          _bird_id: string
          _data_inicio: string
          _dosagem: string
          _duracao_dias: number
          _frequencia_diaria: number
          _hora_primeira: string
          _medicamento: string
          _observacoes?: string
          _via: string
        }
        Returns: string
      }
      definir_formato_eliminatoria: {
        Args: {
          _bateria_id: string
          _classif_corte: number
          _classif_duracao: number
          _final_duracao: number
        }
        Returns: undefined
      }
      encerrar_bateria: { Args: { _bateria_id: string }; Returns: undefined }
      encerrar_torneio: { Args: { _torneio_id: string }; Returns: undefined }
      enviar_pedido_amizade: { Args: { _destinatario: string }; Returns: Json }
      generate_codigo_criadouro: { Args: never; Returns: string }
      get_bateria_publica: { Args: { _bateria_id: string }; Returns: Json }
      get_grupo_convite_publico: { Args: { _token: string }; Returns: Json }
      get_ranking_acumulado_grupo: {
        Args: { _grupo_id: string }
        Returns: {
          baterias_disputadas: number
          bird_id: string
          bird_nome: string
          codigo_anilha: string
          grupo_id: string
          membro_user_id: string
          total_pontos: number
        }[]
      }
      inscrever_ave_bateria: {
        Args: { _bateria_id: string; _bird_id: string }
        Returns: string
      }
      inscrever_ave_torneio: {
        Args: { _bird_id: string; _torneio_id: string }
        Returns: string
      }
      is_bateria_admin: { Args: { _bateria_id: string }; Returns: boolean }
      is_bateria_membro: { Args: { _bateria_id: string }; Returns: boolean }
      is_grupo_admin: { Args: { _grupo_id: string }; Returns: boolean }
      is_grupo_membro: { Args: { _grupo_id: string }; Returns: boolean }
      is_torneio_organizer: { Args: { _torneio_id: string }; Returns: boolean }
      is_torneio_participante: {
        Args: { _torneio_id: string }
        Returns: boolean
      }
      marcar_dose_aplicada: {
        Args: { _dose_id: string; _observacoes?: string }
        Returns: undefined
      }
      registrar_pontuacao: {
        Args: { _bateria: number; _inscricao_id: string; _pontos: number }
        Returns: undefined
      }
      registrar_pontuacao_bateria: {
        Args: { _inscricao_id: string; _pontos: number }
        Returns: undefined
      }
      registrar_pontuacao_fase: {
        Args: { _fase: string; _inscricao_id: string; _pontos: number }
        Returns: undefined
      }
      remover_amizade: { Args: { _friendship_id: string }; Returns: undefined }
      responder_convite_grupo: {
        Args: { _aceitar: boolean; _convite_id: string }
        Returns: undefined
      }
      responder_pedido_amizade: {
        Args: { _aceitar: boolean; _friendship_id: string }
        Returns: undefined
      }
      sair_do_grupo: { Args: { _grupo_id: string }; Returns: undefined }
      sortear_estacoes: { Args: { _torneio_id: string }; Returns: undefined }
      sortear_estacoes_bateria: {
        Args: { _bateria_id: string }
        Returns: undefined
      }
      transfer_bird: {
        Args: { _bird_id: string; _destinatario: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
