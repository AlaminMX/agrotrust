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
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_addresses: {
        Row: {
          address: string
          area_id: string | null
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          phone: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          area_id?: string | null
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          area_id?: string | null
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_addresses_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "delivery_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_areas: {
        Row: {
          area_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          state: string
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          area_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          state?: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          area_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          state?: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_areas_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_pricing: {
        Row: {
          created_at: string | null
          from_zone_id: string | null
          id: string
          is_active: boolean | null
          price: number
          to_zone_id: string | null
          updated_at: string | null
          weight_category: string
        }
        Insert: {
          created_at?: string | null
          from_zone_id?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          to_zone_id?: string | null
          updated_at?: string | null
          weight_category: string
        }
        Update: {
          created_at?: string | null
          from_zone_id?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          to_zone_id?: string | null
          updated_at?: string | null
          weight_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_pricing_from_zone_id_fkey"
            columns: ["from_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_pricing_to_zone_id_fkey"
            columns: ["to_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          zone_code: string
          zone_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          zone_code: string
          zone_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          zone_code?: string
          zone_name?: string
        }
        Relationships: []
      }
      farmer_profiles: {
        Row: {
          address: string | null
          allows_pickup: boolean | null
          area_id: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          certification_urls: string[] | null
          created_at: string
          farm_description: string | null
          farm_name: string
          farm_registration_url: string | null
          farm_size: string | null
          id: string
          id_document_url: string | null
          paystack_recipient_code: string | null
          pending_payout: number | null
          produce_types: string[] | null
          state: string
          total_earnings: number | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
        }
        Insert: {
          address?: string | null
          allows_pickup?: boolean | null
          area_id?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          certification_urls?: string[] | null
          created_at?: string
          farm_description?: string | null
          farm_name: string
          farm_registration_url?: string | null
          farm_size?: string | null
          id?: string
          id_document_url?: string | null
          paystack_recipient_code?: string | null
          pending_payout?: number | null
          produce_types?: string[] | null
          state: string
          total_earnings?: number | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
        }
        Update: {
          address?: string | null
          allows_pickup?: boolean | null
          area_id?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          certification_urls?: string[] | null
          created_at?: string
          farm_description?: string | null
          farm_name?: string
          farm_registration_url?: string | null
          farm_size?: string | null
          id?: string
          id_document_url?: string | null
          paystack_recipient_code?: string | null
          pending_payout?: number | null
          produce_types?: string[] | null
          state?: string
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmer_profiles_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "delivery_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tracking: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_approved_at: string | null
          admin_rejected_at: string | null
          confirmed_at: string | null
          consumer_email: string | null
          consumer_id: string | null
          consumer_name: string | null
          consumer_phone: string | null
          created_at: string
          delivered_at: string | null
          delivery_address: string
          delivery_fee: number
          delivery_method: string | null
          delivery_state: string
          escrow_released: boolean
          escrow_released_at: string | null
          estimated_delivery: string | null
          farmer_id: string | null
          id: string
          order_number: string
          payment_reference: string | null
          refund_reference: string | null
          refund_status: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          admin_approved_at?: string | null
          admin_rejected_at?: string | null
          confirmed_at?: string | null
          consumer_email?: string | null
          consumer_id?: string | null
          consumer_name?: string | null
          consumer_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address: string
          delivery_fee?: number
          delivery_method?: string | null
          delivery_state: string
          escrow_released?: boolean
          escrow_released_at?: string | null
          estimated_delivery?: string | null
          farmer_id?: string | null
          id?: string
          order_number: string
          payment_reference?: string | null
          refund_reference?: string | null
          refund_status?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          admin_approved_at?: string | null
          admin_rejected_at?: string | null
          confirmed_at?: string | null
          consumer_email?: string | null
          consumer_id?: string | null
          consumer_name?: string | null
          consumer_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_fee?: number
          delivery_method?: string | null
          delivery_state?: string
          escrow_released?: boolean
          escrow_released_at?: string | null
          estimated_delivery?: string | null
          farmer_id?: string | null
          id?: string
          order_number?: string
          payment_reference?: string | null
          refund_reference?: string | null
          refund_status?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          farmer_id: string
          farmer_payout: number | null
          id: string
          order_id: string | null
          payout_reference: string | null
          platform_fee: number | null
          processed_at: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          farmer_id: string
          farmer_payout?: number | null
          id?: string
          order_id?: string | null
          payout_reference?: string | null
          platform_fee?: number | null
          processed_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          farmer_id?: string
          farmer_payout?: number | null
          id?: string
          order_id?: string | null
          payout_reference?: string | null
          platform_fee?: number | null
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available_quantity: number
          average_rating: number | null
          category: string
          created_at: string
          description: string | null
          discount_percentage: number | null
          farmer_id: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          original_price: number | null
          price: number
          review_count: number | null
          state: string | null
          unit: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          available_quantity?: number
          average_rating?: number | null
          category: string
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          farmer_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          original_price?: number | null
          price: number
          review_count?: number | null
          state?: string | null
          unit?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          available_quantity?: number
          average_rating?: number | null
          category?: string
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          farmer_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          original_price?: number | null
          price?: number
          review_count?: number | null
          state?: string | null
          unit?: string
          updated_at?: string
          weight_kg?: number | null
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
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          pending_payout: number | null
          produce_types: string[] | null
          state: string | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          farm_description?: string | null
          farm_name?: string | null
          farm_size?: string | null
          id?: string | null
          pending_payout?: number | null
          produce_types?: string[] | null
          state?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          farm_description?: string | null
          farm_name?: string | null
          farm_size?: string | null
          id?: string | null
          pending_payout?: number | null
          produce_types?: string[] | null
          state?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_farmer_profile_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
