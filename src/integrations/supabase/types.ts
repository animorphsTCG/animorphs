export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      animorph_cards: {
        Row: {
          animorph_type: string
          attack: number
          card_number: number
          created_at: string
          health: number
          id: number
          image_url: string
          nft_name: string
          power: number
          sats: number
          size: number
        }
        Insert: {
          animorph_type: string
          attack: number
          card_number: number
          created_at?: string
          health: number
          id?: number
          image_url: string
          nft_name: string
          power: number
          sats: number
          size: number
        }
        Update: {
          animorph_type?: string
          attack?: number
          card_number?: number
          created_at?: string
          health?: number
          id?: number
          image_url?: string
          nft_name?: string
          power?: number
          sats?: number
          size?: number
        }
        Relationships: []
      }
      battle_participants: {
        Row: {
          battle_id: string
          created_at: string
          id: string
          is_ai: boolean
          player_number: number
          rounds_won: number
          user_id: string | null
        }
        Insert: {
          battle_id: string
          created_at?: string
          id?: string
          is_ai?: boolean
          player_number: number
          rounds_won?: number
          user_id?: string | null
        }
        Update: {
          battle_id?: string
          created_at?: string
          id?: string
          is_ai?: boolean
          player_number?: number
          rounds_won?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_participants_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battle_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_sessions: {
        Row: {
          battle_type: string
          created_at: string
          id: string
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          battle_type: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          battle_type?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      deck_cards: {
        Row: {
          card_id: number
          created_at: string
          deck_id: string
          id: string
        }
        Insert: {
          card_id: number
          created_at?: string
          deck_id: string
          id?: string
        }
        Update: {
          card_id?: number
          created_at?: string
          deck_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "animorph_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "user_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      music_subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          start_date: string
          subscription_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          start_date?: string
          subscription_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          subscription_type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_status: {
        Row: {
          created_at: string
          has_paid: boolean
          id: string
          payment_date: string | null
          payment_method: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_paid?: boolean
          id: string
          payment_date?: string | null
          payment_method?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_paid?: boolean
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number
          ai_points: number
          bio: string | null
          country: string | null
          created_at: string
          digi: number
          favorite_animorph: string | null
          favorite_battle_mode: string | null
          gender: string | null
          gold: number
          id: string
          lbp: number
          mp: number
          music_unlocked: boolean
          name: string
          online_times_gmt2: string | null
          playing_times: string | null
          profile_image_url: string | null
          surname: string
          username: string
        }
        Insert: {
          age: number
          ai_points?: number
          bio?: string | null
          country?: string | null
          created_at?: string
          digi?: number
          favorite_animorph?: string | null
          favorite_battle_mode?: string | null
          gender?: string | null
          gold?: number
          id: string
          lbp?: number
          mp?: number
          music_unlocked?: boolean
          name: string
          online_times_gmt2?: string | null
          playing_times?: string | null
          profile_image_url?: string | null
          surname: string
          username: string
        }
        Update: {
          age?: number
          ai_points?: number
          bio?: string | null
          country?: string | null
          created_at?: string
          digi?: number
          favorite_animorph?: string | null
          favorite_battle_mode?: string | null
          gender?: string | null
          gold?: number
          id?: string
          lbp?: number
          mp?: number
          music_unlocked?: boolean
          name?: string
          online_times_gmt2?: string | null
          playing_times?: string | null
          profile_image_url?: string | null
          surname?: string
          username?: string
        }
        Relationships: []
      }
      songs: {
        Row: {
          created_at: string
          id: string
          preview_duration_seconds: number
          preview_start_seconds: number
          title: string
          youtube_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          preview_duration_seconds?: number
          preview_start_seconds?: number
          title: string
          youtube_url: string
        }
        Update: {
          created_at?: string
          id?: string
          preview_duration_seconds?: number
          preview_start_seconds?: number
          title?: string
          youtube_url?: string
        }
        Relationships: []
      }
      user_decks: {
        Row: {
          created_at: string
          deck_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deck_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deck_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_music_settings: {
        Row: {
          created_at: string
          id: string
          music_enabled: boolean
          user_id: string
          volume_level: number
        }
        Insert: {
          created_at?: string
          id?: string
          music_enabled?: boolean
          user_id: string
          volume_level?: number
        }
        Update: {
          created_at?: string
          id?: string
          music_enabled?: boolean
          user_id?: string
          volume_level?: number
        }
        Relationships: []
      }
      user_song_selections: {
        Row: {
          created_at: string
          id: string
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_song_selections_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          id: number
          max_uses: number
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          id?: number
          max_uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          id?: number
          max_uses?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
