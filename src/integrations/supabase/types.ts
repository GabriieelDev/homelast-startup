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
      addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean
          neighborhood: string
          number: string
          street: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          neighborhood: string
          number: string
          street: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          neighborhood?: string
          number?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          color: string
          created_at: string
          display_order: number
          icon: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order: number | null
          updated_at: string
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order?: number | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order?: number | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      couriers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      disabled_products: {
        Row: {
          created_at: string
          disabled_by: string | null
          product_id: string
        }
        Insert: {
          created_at?: string
          disabled_by?: string | null
          product_id: string
        }
        Update: {
          created_at?: string
          disabled_by?: string | null
          product_id?: string
        }
        Relationships: []
      }
      nfe_imports: {
        Row: {
          created_at: string
          id: string
          imported_by: string | null
          method: string
          new_count: number
          nfe_date: string | null
          nfe_key: string | null
          nfe_number: string | null
          products_count: number
          raw_data: Json
          supplier: string | null
          updated_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          imported_by?: string | null
          method: string
          new_count?: number
          nfe_date?: string | null
          nfe_key?: string | null
          nfe_number?: string | null
          products_count?: number
          raw_data?: Json
          supplier?: string | null
          updated_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          imported_by?: string | null
          method?: string
          new_count?: number
          nfe_date?: string | null
          nfe_key?: string | null
          nfe_number?: string | null
          products_count?: number
          raw_data?: Json
          supplier?: string | null
          updated_count?: number
        }
        Relationships: []
      }
      order_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: Json | null
          coupon_code: string | null
          courier_id: string | null
          created_at: string
          customer_name: string | null
          discount: number | null
          estimated_time: string | null
          id: string
          items: Json
          order_number: number
          payment_method: string
          pickup_address: Json | null
          shipping: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: Json | null
          coupon_code?: string | null
          courier_id?: string | null
          created_at?: string
          customer_name?: string | null
          discount?: number | null
          estimated_time?: string | null
          id?: string
          items: Json
          order_number?: number
          payment_method: string
          pickup_address?: Json | null
          shipping: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json | null
          coupon_code?: string | null
          courier_id?: string | null
          created_at?: string
          customer_name?: string | null
          discount?: number | null
          estimated_time?: string | null
          id?: string
          items?: Json
          order_number?: number
          payment_method?: string
          pickup_address?: Json | null
          shipping?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_stock: {
        Row: {
          product_id: string
          stock: number
          updated_at: string
        }
        Insert: {
          product_id: string
          stock?: number
          updated_at?: string
        }
        Update: {
          product_id?: string
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          category: string
          category_id: string | null
          cost_price: number
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          image: string
          name: string
          on_sale: boolean
          original_price: number | null
          price: number
          sale_end: string | null
          sale_label: string | null
          sale_price: number | null
          sale_start: string | null
          sections: string[]
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id: string
          image?: string
          name: string
          on_sale?: boolean
          original_price?: number | null
          price?: number
          sale_end?: string | null
          sale_label?: string | null
          sale_price?: number | null
          sale_start?: string | null
          sections?: string[]
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          image?: string
          name?: string
          on_sale?: boolean
          original_price?: number | null
          price?: number
          sale_end?: string | null
          sale_label?: string | null
          sale_price?: number | null
          sale_start?: string | null
          sections?: string[]
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sale_expirations_log: {
        Row: {
          acknowledged: boolean
          expired_at: string
          id: string
          product_id: string
          product_name: string | null
          sale_label: string | null
        }
        Insert: {
          acknowledged?: boolean
          expired_at?: string
          id?: string
          product_id: string
          product_name?: string | null
          sale_label?: string | null
        }
        Update: {
          acknowledged?: boolean
          expired_at?: string
          id?: string
          product_id?: string
          product_name?: string | null
          sale_label?: string | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string | null
          alerts_enabled: boolean
          carousel_config: Json
          hours: string | null
          id: string
          late_order_minutes: number
          low_stock_threshold: number
          max_shipping: number
          min_order: number
          min_shipping: number
          name: string
          phone: string | null
          sales_drop_pct: number
          social_links: Json
          updated_at: string
        }
        Insert: {
          address?: string | null
          alerts_enabled?: boolean
          carousel_config?: Json
          hours?: string | null
          id: string
          late_order_minutes?: number
          low_stock_threshold?: number
          max_shipping?: number
          min_order?: number
          min_shipping?: number
          name?: string
          phone?: string | null
          sales_drop_pct?: number
          social_links?: Json
          updated_at?: string
        }
        Update: {
          address?: string | null
          alerts_enabled?: boolean
          carousel_config?: Json
          hours?: string | null
          id?: string
          late_order_minutes?: number
          low_stock_threshold?: number
          max_shipping?: number
          min_order?: number
          min_shipping?: number
          name?: string
          phone?: string | null
          sales_drop_pct?: number
          social_links?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_carts: {
        Row: {
          items: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          items?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          items?: Json
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      admin_delete_old_orders: { Args: { _days: number }; Returns: number }
      expire_product_sales: { Args: never; Returns: undefined }
      get_admin_product_costs: {
        Args: never
        Returns: {
          cost_price: number
          id: string
        }[]
      }
      get_admin_store_settings: {
        Args: never
        Returns: {
          alerts_enabled: boolean
          late_order_minutes: number
          low_stock_threshold: number
          sales_drop_pct: number
        }[]
      }
      get_user_emails: {
        Args: { _user_ids: string[] }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: { Args: { _code: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "cliente" | "entregador"
      order_status: "recebido" | "preparo" | "caminho" | "entregue"
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
      app_role: ["admin", "cliente", "entregador"],
      order_status: ["recebido", "preparo", "caminho", "entregue"],
    },
  },
} as const
