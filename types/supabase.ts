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
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      expense_transaction_links: {
        Row: {
          created_at: string | null
          expense_id: string
          id: string
          matched_amount: number
          transaction_id: string
        }
        Insert: {
          created_at?: string | null
          expense_id: string
          id?: string
          matched_amount: number
          transaction_id: string
        }
        Update: {
          created_at?: string | null
          expense_id?: string
          id?: string
          matched_amount?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_transaction_links_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_transaction_links_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          category_id: string | null
          created_at: string | null
          expense_date: string | null
          fixed_item_id: string | null
          forecast_oneoff_id: string | null
          id: string
          label: string
          origin: string | null
          paycheck_id: string | null
          status: string | null
          transaction_id: string | null
          user_id: string | null
          vault_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          expense_date?: string | null
          fixed_item_id?: string | null
          forecast_oneoff_id?: string | null
          id?: string
          label: string
          origin?: string | null
          paycheck_id?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
          vault_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          expense_date?: string | null
          fixed_item_id?: string | null
          forecast_oneoff_id?: string | null
          id?: string
          label?: string
          origin?: string | null
          paycheck_id?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_fixed_item_id_fkey"
            columns: ["fixed_item_id"]
            isOneToOne: false
            referencedRelation: "fixed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_forecast_oneoff_id_fkey"
            columns: ["forecast_oneoff_id"]
            isOneToOne: false
            referencedRelation: "forecast_oneoffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paycheck_id_fkey"
            columns: ["paycheck_id"]
            isOneToOne: false
            referencedRelation: "paychecks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_items: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          due_days: string[] | null
          frequency: string
          id: string
          is_income: boolean
          name: string
          notes: string | null
          start_date: string | null
          transaction_match_keywords: string[] | null
          updated_at: string | null
          user_id: string | null
          vault_id: string | null
          weekly_day: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          due_days?: string[] | null
          frequency: string
          id?: string
          is_income?: boolean
          name: string
          notes?: string | null
          start_date?: string | null
          transaction_match_keywords?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          vault_id?: string | null
          weekly_day?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          due_days?: string[] | null
          frequency?: string
          id?: string
          is_income?: boolean
          name?: string
          notes?: string | null
          start_date?: string | null
          transaction_match_keywords?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          vault_id?: string | null
          weekly_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_items_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_adjustments: {
        Row: {
          created_at: string | null
          defer_to_start: string | null
          fixed_item_id: string
          forecast_start: string
          id: string
          override_amount: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          defer_to_start?: string | null
          fixed_item_id: string
          forecast_start: string
          id?: string
          override_amount?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          defer_to_start?: string | null
          fixed_item_id?: string
          forecast_start?: string
          id?: string
          override_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecast_adjustments_fixed_item_id_fkey"
            columns: ["fixed_item_id"]
            isOneToOne: false
            referencedRelation: "fixed_items"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_oneoffs: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date: string | null
          forecast_start: string
          id: string
          is_income: boolean | null
          name: string
          notes: string | null
          transaction_match_keywords: string[] | null
          user_id: string
          vault_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date?: string | null
          forecast_start: string
          id?: string
          is_income?: boolean | null
          name: string
          notes?: string | null
          transaction_match_keywords?: string[] | null
          user_id: string
          vault_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string | null
          forecast_start?: string
          id?: string
          is_income?: boolean | null
          name?: string
          notes?: string | null
          transaction_match_keywords?: string[] | null
          user_id?: string
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forecast_oneoffs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forecast_oneoffs_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      income_records: {
        Row: {
          amount: number
          created_at: string | null
          forecast_oneoff_id: string | null
          id: string
          income_source_id: string | null
          paycheck_id: string | null
          received_date: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          forecast_oneoff_id?: string | null
          id?: string
          income_source_id?: string | null
          paycheck_id?: string | null
          received_date?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          forecast_oneoff_id?: string | null
          id?: string
          income_source_id?: string | null
          paycheck_id?: string | null
          received_date?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_records_forecast_oneoff_id_fkey"
            columns: ["forecast_oneoff_id"]
            isOneToOne: false
            referencedRelation: "forecast_oneoffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_records_income_source_id_fkey"
            columns: ["income_source_id"]
            isOneToOne: false
            referencedRelation: "income_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_records_paycheck_id_fkey"
            columns: ["paycheck_id"]
            isOneToOne: false
            referencedRelation: "paychecks"
            referencedColumns: ["id"]
          },
        ]
      }
      income_sources: {
        Row: {
          amount: number
          created_at: string | null
          due_days: string[] | null
          frequency: string
          id: string
          name: string
          notes: string | null
          start_date: string | null
          transaction_match_keywords: string[] | null
          updated_at: string | null
          user_id: string | null
          weekly_day: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_days?: string[] | null
          frequency: string
          id?: string
          name: string
          notes?: string | null
          start_date?: string | null
          transaction_match_keywords?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          weekly_day?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_days?: string[] | null
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          start_date?: string | null
          transaction_match_keywords?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          weekly_day?: string | null
        }
        Relationships: []
      }
      paychecks: {
        Row: {
          approved: boolean | null
          created_at: string | null
          id: string
          notes: string | null
          paycheck_date: string
          total_amount: number
          user_id: string | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paycheck_date: string
          total_amount: number
          user_id?: string | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paycheck_date?: string
          total_amount?: number
          user_id?: string | null
        }
        Relationships: []
      }
      plaid_accounts: {
        Row: {
          available_balance: number | null
          created_at: string | null
          current_balance: number | null
          id: string
          iso_currency_code: string | null
          mask: string | null
          name: string | null
          plaid_account_id: string
          plaid_item_id: string | null
          subtype: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          available_balance?: number | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          iso_currency_code?: string | null
          mask?: string | null
          name?: string | null
          plaid_account_id: string
          plaid_item_id?: string | null
          subtype?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          available_balance?: number | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          iso_currency_code?: string | null
          mask?: string | null
          name?: string | null
          plaid_account_id?: string
          plaid_item_id?: string | null
          subtype?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plaid_accounts_plaid_item_id_fkey"
            columns: ["plaid_item_id"]
            isOneToOne: false
            referencedRelation: "plaid_items"
            referencedColumns: ["plaid_item_id"]
          },
        ]
      }
      plaid_items: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          institution_name: string | null
          last_cursor: string | null
          plaid_item_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          institution_name?: string | null
          last_cursor?: string | null
          plaid_item_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          institution_name?: string | null
          last_cursor?: string | null
          plaid_item_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      plaid_transactions: {
        Row: {
          account_id: string | null
          amount: number | null
          authorized_date: string | null
          category: string[] | null
          created_at: string | null
          date: string | null
          id: string
          iso_currency_code: string | null
          merchant_name: string | null
          name: string | null
          payment_channel: string | null
          pending: boolean | null
          pending_transaction_id: string | null
          plaid_transaction_id: string
          transaction_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          authorized_date?: string | null
          category?: string[] | null
          created_at?: string | null
          date?: string | null
          id?: string
          iso_currency_code?: string | null
          merchant_name?: string | null
          name?: string | null
          payment_channel?: string | null
          pending?: boolean | null
          pending_transaction_id?: string | null
          plaid_transaction_id: string
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          authorized_date?: string | null
          category?: string[] | null
          created_at?: string | null
          date?: string | null
          id?: string
          iso_currency_code?: string | null
          merchant_name?: string | null
          name?: string | null
          payment_channel?: string | null
          pending?: boolean | null
          pending_transaction_id?: string | null
          plaid_transaction_id?: string
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plaid_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "plaid_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          plaid_transaction_id: string | null
          posted_at: string | null
          source: string | null
          user_id: string | null
          vault_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          plaid_transaction_id?: string | null
          posted_at?: string | null
          source?: string | null
          user_id?: string | null
          vault_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          plaid_transaction_id?: string | null
          posted_at?: string | null
          source?: string | null
          user_id?: string | null
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_plaid_transaction"
            columns: ["plaid_transaction_id"]
            isOneToOne: false
            referencedRelation: "plaid_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_plaid_transaction_id_fkey"
            columns: ["plaid_transaction_id"]
            isOneToOne: false
            referencedRelation: "plaid_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_contributions: {
        Row: {
          amount: number
          contribution_date: string | null
          created_at: string | null
          id: string
          paycheck_id: string
          source: string | null
          status: string | null
          user_id: string | null
          vault_id: string
        }
        Insert: {
          amount: number
          contribution_date?: string | null
          created_at?: string | null
          id?: string
          paycheck_id: string
          source?: string | null
          status?: string | null
          user_id?: string | null
          vault_id: string
        }
        Update: {
          amount?: number
          contribution_date?: string | null
          created_at?: string | null
          id?: string
          paycheck_id?: string
          source?: string | null
          status?: string | null
          user_id?: string | null
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_contributions_paycheck_id_fkey"
            columns: ["paycheck_id"]
            isOneToOne: false
            referencedRelation: "paychecks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_contributions_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vaults: {
        Row: {
          created_at: string | null
          id: string
          name: string
          target_amount: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          target_amount?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          target_amount?: number | null
          user_id?: string | null
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
