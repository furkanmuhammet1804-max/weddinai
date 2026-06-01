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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string
          event_date: string | null
          event_type: Database["public"]["Enums"]["etkinlik_turu"]
          id: string
          moderation_mode: Database["public"]["Enums"]["moderasyon_modu"]
          qr_settings: Json
          slug: string
          status: Database["public"]["Enums"]["etkinlik_durum"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          event_type?: Database["public"]["Enums"]["etkinlik_turu"]
          id?: string
          moderation_mode?: Database["public"]["Enums"]["moderasyon_modu"]
          qr_settings?: Json
          slug: string
          status?: Database["public"]["Enums"]["etkinlik_durum"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string | null
          event_type?: Database["public"]["Enums"]["etkinlik_turu"]
          id?: string
          moderation_mode?: Database["public"]["Enums"]["moderasyon_modu"]
          qr_settings?: Json
          slug?: string
          status?: Database["public"]["Enums"]["etkinlik_durum"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guestbook: {
        Row: {
          audio_storage_path: string | null
          created_at: string
          event_id: string
          guest_name: string | null
          id: string
          message_text: string | null
        }
        Insert: {
          audio_storage_path?: string | null
          created_at?: string
          event_id: string
          guest_name?: string | null
          id?: string
          message_text?: string | null
        }
        Update: {
          audio_storage_path?: string | null
          created_at?: string
          event_id?: string
          guest_name?: string | null
          id?: string
          message_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guestbook_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string
          event_id: string
          file_size: number
          file_type: Database["public"]["Enums"]["medya_turu"]
          guest_name: string | null
          id: string
          likes_count: number
          status: Database["public"]["Enums"]["medya_durum"]
          storage_path: string
        }
        Insert: {
          created_at?: string
          event_id: string
          file_size?: number
          file_type: Database["public"]["Enums"]["medya_turu"]
          guest_name?: string | null
          id?: string
          likes_count?: number
          status?: Database["public"]["Enums"]["medya_durum"]
          storage_path: string
        }
        Update: {
          created_at?: string
          event_id?: string
          file_size?: number
          file_type?: Database["public"]["Enums"]["medya_turu"]
          guest_name?: string | null
          id?: string
          likes_count?: number
          status?: Database["public"]["Enums"]["medya_durum"]
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          plan_type: Database["public"]["Enums"]["plan_tipi"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          plan_type?: Database["public"]["Enums"]["plan_tipi"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["plan_tipi"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      misafir_ani_ekle: {
        Args: {
          p_audio_path?: string
          p_guest_name: string
          p_message_text?: string
          p_slug: string
        }
        Returns: string
      }
      misafir_medya_ekle: {
        Args: {
          p_file_size?: number
          p_file_type: Database["public"]["Enums"]["medya_turu"]
          p_guest_name?: string
          p_slug: string
          p_storage_path: string
        }
        Returns: string
      }
    }
    Enums: {
      etkinlik_durum: "taslak" | "aktif" | "arsivlendi"
      etkinlik_turu:
        | "dugun"
        | "nisan"
        | "kina"
        | "kurumsal_gala"
        | "dogum_gunu"
        | "parti"
        | "diger"
      medya_durum: "beklemede" | "onaylandi" | "reddedildi"
      medya_turu: "fotograf" | "video"
      moderasyon_modu: "direkt_yayinla" | "onay_gereksin"
      plan_tipi: "ucretsiz" | "profesyonel" | "kurumsal"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      etkinlik_durum: ["taslak", "aktif", "arsivlendi"],
      etkinlik_turu: [
        "dugun",
        "nisan",
        "kina",
        "kurumsal_gala",
        "dogum_gunu",
        "parti",
        "diger",
      ],
      medya_durum: ["beklemede", "onaylandi", "reddedildi"],
      medya_turu: ["fotograf", "video"],
      moderasyon_modu: ["direkt_yayinla", "onay_gereksin"],
      plan_tipi: ["ucretsiz", "profesyonel", "kurumsal"],
    },
  },
} as const
