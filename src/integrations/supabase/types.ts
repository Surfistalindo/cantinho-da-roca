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
      ai_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      board_favorites: {
        Row: {
          board_id: string
          created_at: string
          position: number
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          position?: number
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_favorites_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          color: string
          created_at: string
          created_by: string
          icon: string
          id: string
          kind: string
          name: string
          position: number
          route_path: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          icon?: string
          id?: string
          kind?: string
          name: string
          position?: number
          route_path?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          icon?: string
          id?: string
          kind?: string
          name?: string
          position?: number
          route_path?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          id: string
          last_contact_at: string | null
          name: string
          notes: string | null
          phone: string | null
          product_bought: string | null
          purchase_date: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_contact_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          product_bought?: string | null
          purchase_date?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_contact_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          product_bought?: string | null
          purchase_date?: string | null
        }
        Relationships: []
      }
      ia_import_logs: {
        Row: {
          created_count: number
          error_count: number
          filename: string | null
          finished_at: string | null
          id: string
          skipped_count: number
          source: string
          started_at: string
          total_rows: number
          updated_count: number
          user_id: string
        }
        Insert: {
          created_count?: number
          error_count?: number
          filename?: string | null
          finished_at?: string | null
          id?: string
          skipped_count?: number
          source: string
          started_at?: string
          total_rows?: number
          updated_count?: number
          user_id: string
        }
        Update: {
          created_count?: number
          error_count?: number
          filename?: string | null
          finished_at?: string | null
          id?: string
          skipped_count?: number
          source?: string
          started_at?: string
          total_rows?: number
          updated_count?: number
          user_id?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          contact_type: string
          created_at: string
          created_by: string
          customer_id: string | null
          description: string
          id: string
          interaction_date: string
          lead_id: string | null
        }
        Insert: {
          contact_type?: string
          created_at?: string
          created_by: string
          customer_id?: string | null
          description: string
          id?: string
          interaction_date?: string
          lead_id?: string | null
        }
        Update: {
          contact_type?: string
          created_at?: string
          created_by?: string
          customer_id?: string | null
          description?: string
          id?: string
          interaction_date?: string
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_priority: string | null
          ai_score: number | null
          ai_score_reason: string | null
          ai_score_updated_at: string | null
          ai_status_confidence: number | null
          ai_suggested_status: string | null
          ai_summary: string | null
          ai_summary_updated_at: string | null
          cadence_exhausted: boolean
          cadence_last_sent_at: string | null
          cadence_next_at: string | null
          cadence_started_at: string | null
          cadence_state: string
          cadence_step: number
          created_at: string
          id: string
          last_contact_at: string | null
          name: string
          next_contact_at: string | null
          notes: string | null
          origin: string | null
          phone: string | null
          product_interest: string | null
          status: string
          updated_at: string
          whatsapp_opt_out: boolean
        }
        Insert: {
          ai_priority?: string | null
          ai_score?: number | null
          ai_score_reason?: string | null
          ai_score_updated_at?: string | null
          ai_status_confidence?: number | null
          ai_suggested_status?: string | null
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          cadence_exhausted?: boolean
          cadence_last_sent_at?: string | null
          cadence_next_at?: string | null
          cadence_started_at?: string | null
          cadence_state?: string
          cadence_step?: number
          created_at?: string
          id?: string
          last_contact_at?: string | null
          name: string
          next_contact_at?: string | null
          notes?: string | null
          origin?: string | null
          phone?: string | null
          product_interest?: string | null
          status?: string
          updated_at?: string
          whatsapp_opt_out?: boolean
        }
        Update: {
          ai_priority?: string | null
          ai_score?: number | null
          ai_score_reason?: string | null
          ai_score_updated_at?: string | null
          ai_status_confidence?: number | null
          ai_suggested_status?: string | null
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          cadence_exhausted?: boolean
          cadence_last_sent_at?: string | null
          cadence_next_at?: string | null
          cadence_started_at?: string | null
          cadence_state?: string
          cadence_step?: number
          created_at?: string
          id?: string
          last_contact_at?: string | null
          name?: string
          next_contact_at?: string | null
          notes?: string | null
          origin?: string | null
          phone?: string | null
          product_interest?: string | null
          status?: string
          updated_at?: string
          whatsapp_opt_out?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      task_board_items: {
        Row: {
          assignee_id: string | null
          board_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          board_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          board_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_board_items_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body: string | null
          cadence_step: number | null
          created_at: string
          direction: string
          error_code: string | null
          error_message: string | null
          id: string
          lead_id: string | null
          status: string
          template_name: string | null
          updated_at: string
          wa_message_id: string | null
        }
        Insert: {
          body?: string | null
          cadence_step?: number | null
          created_at?: string
          direction: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          template_name?: string | null
          updated_at?: string
          wa_message_id?: string | null
        }
        Update: {
          body?: string | null
          cadence_step?: number | null
          created_at?: string
          direction?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          template_name?: string | null
          updated_at?: string
          wa_message_id?: string | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          body_preview: string
          category: string
          created_at: string
          delay_hours: number | null
          id: string
          is_active: boolean
          language: string
          meta_name: string
          name: string
          step_order: number | null
          updated_at: string
          variables: Json
        }
        Insert: {
          body_preview: string
          category?: string
          created_at?: string
          delay_hours?: number | null
          id?: string
          is_active?: boolean
          language?: string
          meta_name: string
          name: string
          step_order?: number | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          body_preview?: string
          category?: string
          created_at?: string
          delay_hours?: number | null
          id?: string
          is_active?: boolean
          language?: string
          meta_name?: string
          name?: string
          step_order?: number | null
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          name: string
          owner_id: string
          position: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          owner_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendedor" | "usuario"
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
    Enums: {
      app_role: ["admin", "vendedor", "usuario"],
    },
  },
} as const
