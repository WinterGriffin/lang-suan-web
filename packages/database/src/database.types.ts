// Generated from the tested local Supabase schema on 2026-09-22.
// Regenerate with: npm exec -- supabase gen types typescript --local --schema public
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: { action: string; actor_id: string | null; farm_id: string; id: number; new_data: Json | null; occurred_at: string; old_data: Json | null; record_key: Json; table_name: string; transaction_id: number }
        Insert: { action: string; actor_id?: string | null; farm_id: string; id?: never; new_data?: Json | null; occurred_at?: string; old_data?: Json | null; record_key: Json; table_name: string; transaction_id?: number }
        Update: { action?: string; actor_id?: string | null; farm_id?: string; id?: never; new_data?: Json | null; occurred_at?: string; old_data?: Json | null; record_key?: Json; table_name?: string; transaction_id?: number }
        Relationships: [{ foreignKeyName: "audit_logs_actor_id_fkey"; columns: ["actor_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }, { foreignKeyName: "audit_logs_farm_id_fkey"; columns: ["farm_id"]; isOneToOne: false; referencedRelation: "farms"; referencedColumns: ["id"] }]
      }
      farms: {
        Row: { created_at: string; created_by: string; default_share_input: Database["public"]["Enums"]["share_input"]; id: string; is_active: boolean; name: string; produce_name: string; updated_at: string; updated_by: string; version: number }
        Insert: { created_at?: string; created_by: string; default_share_input?: Database["public"]["Enums"]["share_input"]; id?: string; is_active?: boolean; name: string; produce_name: string; updated_at?: string; updated_by: string; version?: number }
        Update: { created_at?: string; created_by?: string; default_share_input?: Database["public"]["Enums"]["share_input"]; id?: string; is_active?: boolean; name?: string; produce_name?: string; updated_at?: string; updated_by?: string; version?: number }
        Relationships: [{ foreignKeyName: "farms_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }, { foreignKeyName: "farms_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      profiles: { Row: { created_at: string; display_name: string; id: string; updated_at: string }; Insert: { created_at?: string; display_name: string; id: string; updated_at?: string }; Update: { created_at?: string; display_name?: string; id?: string; updated_at?: string }; Relationships: [] }
      sales: {
        Row: { created_at: string; created_by: string; farm_id: string; id: string; input_share: number; owner_share: number | null; produce_name_snapshot: string; sale_date: string; share_input_type: Database["public"]["Enums"]["share_input"]; total_amount: number | null; unit_price: number; updated_at: string; updated_by: string; version: number; weight_kg: number; worker_share: number | null }
        Insert: { created_at?: string; created_by: string; farm_id: string; id: string; input_share: number; owner_share?: number | null; produce_name_snapshot: string; sale_date?: string; share_input_type: Database["public"]["Enums"]["share_input"]; total_amount?: number | null; unit_price: number; updated_at?: string; updated_by: string; version?: number; weight_kg: number; worker_share?: number | null }
        Update: { created_at?: string; created_by?: string; farm_id?: string; id?: string; input_share?: number; owner_share?: number | null; produce_name_snapshot?: string; sale_date?: string; share_input_type?: Database["public"]["Enums"]["share_input"]; total_amount?: number | null; unit_price?: number; updated_at?: string; updated_by?: string; version?: number; weight_kg?: number; worker_share?: number | null }
        Relationships: [{ foreignKeyName: "sales_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }, { foreignKeyName: "sales_farm_id_fkey"; columns: ["farm_id"]; isOneToOne: false; referencedRelation: "farms"; referencedColumns: ["id"] }, { foreignKeyName: "sales_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      user_farm_roles: {
        Row: { created_at: string; created_by: string; farm_id: string; role: Database["public"]["Enums"]["farm_role"]; updated_at: string; updated_by: string; user_id: string }
        Insert: { created_at?: string; created_by: string; farm_id: string; role: Database["public"]["Enums"]["farm_role"]; updated_at?: string; updated_by: string; user_id: string }
        Update: { created_at?: string; created_by?: string; farm_id?: string; role?: Database["public"]["Enums"]["farm_role"]; updated_at?: string; updated_by?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "user_farm_roles_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }, { foreignKeyName: "user_farm_roles_farm_id_fkey"; columns: ["farm_id"]; isOneToOne: false; referencedRelation: "farms"; referencedColumns: ["id"] }, { foreignKeyName: "user_farm_roles_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }, { foreignKeyName: "user_farm_roles_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_farm: { Args: { p_id: string; p_name: string; p_produce_name: string; p_share_input: Database["public"]["Enums"]["share_input"] }; Returns: Database["public"]["Tables"]["farms"]["Row"] }
      ensure_profile: { Args: { p_display_name: string }; Returns: Database["public"]["Tables"]["profiles"]["Row"] }
      sales_summary: { Args: { p_end: string; p_farm_id?: string; p_start: string }; Returns: { average_price: number; farm_id: string; month_start: string; owner_share: number; sale_count: number; total_amount: number; weight_kg: number; worker_share: number }[] }
      save_sale: { Args: { p_expected_version?: number; p_farm_id: string; p_id: string; p_input_share: number; p_sale_date: string; p_unit_price: number; p_weight_kg: number }; Returns: Database["public"]["Tables"]["sales"]["Row"] }
      set_farm_member: { Args: { p_farm_id: string; p_role: Database["public"]["Enums"]["farm_role"]; p_user_id: string }; Returns: undefined }
      update_farm: { Args: { p_expected_version: number; p_id: string; p_is_active: boolean; p_name: string; p_produce_name: string; p_share_input: Database["public"]["Enums"]["share_input"] }; Returns: Database["public"]["Tables"]["farms"]["Row"] }
    }
    Enums: { farm_role: "ADMIN" | "EDITOR" | "VIEWER"; share_input: "OWNER" | "WORKER" }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
