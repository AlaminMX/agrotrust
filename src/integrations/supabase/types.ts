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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      farmer_profiles: {
        Row: {
          address: string | null
          area: string | null
          certification_urls: string[] | null
          created_at: string
          farm_description: string | null
          farm_name: string
          farm_registration_url: string | null
          farm_size: string | null
          id: string
          id_document_url: string | null
          produce_types: string[] | null
          secondary_phone: string | null
          state: string
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          whatsapp_phone: string | null
          years_of_experience: number | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          certification_urls?: string[] | null
          created_at?: string
          farm_description?: string | null
          farm_name: string
          farm_registration_url?: string | null
          farm_size?: string | null
          id?: string
          id_document_url?: string | null
          produce_types?: string[] | null
          secondary_phone?: string | null
          state: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          whatsapp_phone?: string | null
          years_of_experience?: number | null
        }
        Update: {
          address?: string | null
          area?: string | null
          certification_urls?: string[] | null
          created_at?: string
          farm_description?: string | null
          farm_name?: string
          farm_registration_url?: string | null
          farm_size?: string | null
          id?: string
          id_document_url?: string | null
          produce_types?: string[] | null
          secondary_phone?: string | null
          state?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          whatsapp_phone?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      listing_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          farmer_profile_id: string | null
          id: string
          product_id: string | null
          reason: string
          reporter_session_id: string | null
          reporter_user_id: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          farmer_profile_id?: string | null
          id?: string
          product_id?: string | null
          reason: string
          reporter_session_id?: string | null
          reporter_user_id?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          farmer_profile_id?: string | null
          id?: string
          product_id?: string | null
          reason?: string
          reporter_session_id?: string | null
          reporter_user_id?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_reports_farmer_profile_id_fkey"
            columns: ["farmer_profile_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_farmer_profile_id_fkey"
            columns: ["farmer_profile_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          area: string | null
          available_quantity: number
          category: string
          created_at: string
          description: string | null
          farmer_id: string
          id: string
          image_url: string | null
          is_active: boolean
          is_negotiable: boolean
          listing_status: string
          name: string
          price: number
          state: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          available_quantity?: number
          category: string
          created_at?: string
          description?: string | null
          farmer_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_negotiable?: boolean
          listing_status?: string
          name: string
          price: number
          state?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          available_quantity?: number
          category?: string
          created_at?: string
          description?: string | null
          farmer_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_negotiable?: boolean
          listing_status?: string
          name?: string
          price?: number
          state?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          phone: string | null
          preferred_state: string | null
          produce_interests: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          preferred_state?: string | null
          produce_interests?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          preferred_state?: string | null
          produce_interests?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      farmer_profiles_public: {
        Row: {
          address: string | null
          created_at: string | null
          farm_description: string | null
          farm_name: string | null
          farm_size: string | null
          id: string | null
          produce_types: string[] | null
          secondary_phone: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          whatsapp_phone: string | null
          years_of_experience: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          farm_description?: string | null
          farm_name?: string | null
          farm_size?: string | null
          id?: string | null
          produce_types?: string[] | null
          secondary_phone?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          whatsapp_phone?: string | null
          years_of_experience?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          farm_description?: string | null
          farm_name?: string | null
          farm_size?: string | null
          id?: string | null
          produce_types?: string[] | null
          secondary_phone?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          whatsapp_phone?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_farmer_profile_id: { Args: { _user_id: string }; Returns: string }
      get_public_farmer_info: {
        Args: { _farmer_id: string }
        Returns: {
          address: string
          area: string
          created_at: string
          farm_description: string
          farm_name: string
          farm_size: string
          id: string
          produce_types: string[]
          secondary_phone: string
          state: string
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string
          whatsapp_phone: string
          years_of_experience: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_farmer_approved: { Args: { _farmer_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "consumer" | "farmer" | "admin"
      order_status:
        | "pending"
        | "paid"
        | "approved"
        | "rejected"
        | "processing"
        | "dispatched"
        | "out_for_delivery"
        | "delivered"
        | "awaiting_payout"
        | "confirmed"
        | "disputed"
      verification_status: "pending" | "under_review" | "approved" | "rejected"
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
      app_role: ["consumer", "farmer", "admin"],
      order_status: [
        "pending",
        "paid",
        "approved",
        "rejected",
        "processing",
        "dispatched",
        "out_for_delivery",
        "delivered",
        "awaiting_payout",
        "confirmed",
        "disputed",
      ],
      verification_status: ["pending", "under_review", "approved", "rejected"],
    },
  },
} as const
