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
      customers: {
        Row: {
          dia_chi: string | null
          dien_thoai: string | null
          email: string | null
          id: number
          ma_khach_hang: string
          ngay_tao: string | null
          ten_khach_hang: string
          tong_mua: number | null
        }
        Insert: {
          dia_chi?: string | null
          dien_thoai?: string | null
          email?: string | null
          id?: number
          ma_khach_hang: string
          ngay_tao?: string | null
          ten_khach_hang: string
          tong_mua?: number | null
        }
        Update: {
          dia_chi?: string | null
          dien_thoai?: string | null
          email?: string | null
          id?: number
          ma_khach_hang?: string
          ngay_tao?: string | null
          ten_khach_hang?: string
          tong_mua?: number | null
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          ghi_chu: string | null
          gia_tri: number | null
          id: number
          loai_giao_dich: string
          ngay_giao_dich: string | null
          nguoi_thuc_hien: string | null
          product_id: number | null
          so_luong: number
        }
        Insert: {
          ghi_chu?: string | null
          gia_tri?: number | null
          id?: number
          loai_giao_dich: string
          ngay_giao_dich?: string | null
          nguoi_thuc_hien?: string | null
          product_id?: number | null
          so_luong: number
        }
        Update: {
          ghi_chu?: string | null
          gia_tri?: number | null
          id?: number
          loai_giao_dich?: string
          ngay_giao_dich?: string | null
          nguoi_thuc_hien?: string | null
          product_id?: number | null
          so_luong?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          du_kien_het_hang: string | null
          gia_ban: number | null
          gia_von: number | null
          id: number
          ma_hang: string
          nhom_hang: string | null
          ten_hang: string
          thuong_hieu: string | null
          ton_kho: number | null
          ton_kho_lon_nhat: string | null
        }
        Insert: {
          du_kien_het_hang?: string | null
          gia_ban?: number | null
          gia_von?: number | null
          id?: number
          ma_hang: string
          nhom_hang?: string | null
          ten_hang: string
          thuong_hieu?: string | null
          ton_kho?: number | null
          ton_kho_lon_nhat?: string | null
        }
        Update: {
          du_kien_het_hang?: string | null
          gia_ban?: number | null
          gia_von?: number | null
          id?: number
          ma_hang?: string
          nhom_hang?: string | null
          ten_hang?: string
          thuong_hieu?: string | null
          ton_kho?: number | null
          ton_kho_lon_nhat?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          gia_nhap: number
          id: number
          product_id: number | null
          purchase_order_id: number | null
          so_luong: number
          thanh_tien: number | null
        }
        Insert: {
          gia_nhap: number
          id?: number
          product_id?: number | null
          purchase_order_id?: number | null
          so_luong: number
          thanh_tien?: number | null
        }
        Update: {
          gia_nhap?: number
          id?: number
          product_id?: number | null
          purchase_order_id?: number | null
          so_luong?: number
          thanh_tien?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          ghi_chu: string | null
          id: number
          ma_don_nhap: string
          ngay_dat: string | null
          ngay_giao_hang: string | null
          supplier_id: number | null
          tong_tien: number | null
          trang_thai: string | null
        }
        Insert: {
          ghi_chu?: string | null
          id?: number
          ma_don_nhap: string
          ngay_dat?: string | null
          ngay_giao_hang?: string | null
          supplier_id?: number | null
          tong_tien?: number | null
          trang_thai?: string | null
        }
        Update: {
          ghi_chu?: string | null
          id?: number
          ma_don_nhap?: string
          ngay_dat?: string | null
          ngay_giao_hang?: string | null
          supplier_id?: number | null
          tong_tien?: number | null
          trang_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          gia_ban: number
          id: number
          product_id: number | null
          sale_id: number | null
          so_luong: number
          thanh_tien: number | null
        }
        Insert: {
          gia_ban: number
          id?: number
          product_id?: number | null
          sale_id?: number | null
          so_luong: number
          thanh_tien?: number | null
        }
        Update: {
          gia_ban?: number
          id?: number
          product_id?: number | null
          sale_id?: number | null
          so_luong?: number
          thanh_tien?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          customer_id: number | null
          ghi_chu: string | null
          id: number
          ma_don_hang: string
          ngay_ban: string | null
          tong_tien: number
          trang_thai: string | null
        }
        Insert: {
          customer_id?: number | null
          ghi_chu?: string | null
          id?: number
          ma_don_hang: string
          ngay_ban?: string | null
          tong_tien?: number
          trang_thai?: string | null
        }
        Update: {
          customer_id?: number | null
          ghi_chu?: string | null
          id?: number
          ma_don_hang?: string
          ngay_ban?: string | null
          tong_tien?: number
          trang_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          dien_thoai: string | null
          id: number
          ma_nha_cung_cap: string
          ten_nha_cung_cap: string
          tong_mua: number | null
        }
        Insert: {
          dien_thoai?: string | null
          id?: number
          ma_nha_cung_cap: string
          ten_nha_cung_cap: string
          tong_mua?: number | null
        }
        Update: {
          dien_thoai?: string | null
          id?: number
          ma_nha_cung_cap?: string
          ten_nha_cung_cap?: string
          tong_mua?: number | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          id: string
          email: string
          ten_nhan_vien: string
          username: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          ten_nhan_vien: string
          username: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          ten_nhan_vien?: string
          username?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
