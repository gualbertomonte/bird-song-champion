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
          nome_criadouro?: string
          registro_ctf?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
          validade_ctf?: string | null
        }
        Relationships: []
      }
      health_records: {
        Row: {
          bird_id: string
          created_at: string
          data: string
          descricao: string | null
          id: string
          proxima_dose: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          bird_id: string
          created_at?: string
          data: string
          descricao?: string | null
          id?: string
          proxima_dose?: string | null
          tipo?: string
          user_id: string
        }
        Update: {
          bird_id?: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          proxima_dose?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_loan: { Args: { _loan_id: string }; Returns: undefined }
      confirm_loan_return: { Args: { _loan_id: string }; Returns: undefined }
      create_loan: {
        Args: {
          _bird_id: string
          _codigo_criadouro: string
          _observacoes?: string
          _prazo?: string
        }
        Returns: Json
      }
      generate_codigo_criadouro: { Args: never; Returns: string }
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
