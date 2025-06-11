export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          sort_order: number | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          sort_order?: number | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          sort_order?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          category: string | null;
          category_id: string | null;
          created_at: string | null;
          id: string;
          label: string;
          paycheck_id: string | null;
          user_id: string | null;
          vault_id: string | null;
        };
        Insert: {
          amount: number;
          category?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          id?: string;
          label: string;
          paycheck_id?: string | null;
          user_id?: string | null;
          vault_id?: string | null;
        };
        Update: {
          amount?: number;
          category?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          id?: string;
          label?: string;
          paycheck_id?: string | null;
          user_id?: string | null;
          vault_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_paycheck_id_fkey";
            columns: ["paycheck_id"];
            isOneToOne: false;
            referencedRelation: "paychecks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_vault_id_fkey";
            columns: ["vault_id"];
            isOneToOne: false;
            referencedRelation: "vaults";
            referencedColumns: ["id"];
          }
        ];
      };
      fixed_items: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string | null;
          due_days: string[] | null;
          frequency: string;
          id: string;
          name: string;
          notes: string | null;
          start_date: string | null;
          transaction_match_keywords: string[] | null;
          updated_at: string | null;
          user_id: string | null;
          vault_id: string | null;
          weekly_day: string | null;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string | null;
          due_days?: string[] | null;
          frequency: string;
          id?: string;
          name: string;
          notes?: string | null;
          start_date?: string | null;
          transaction_match_keywords?: string[] | null;
          updated_at?: string | null;
          user_id?: string | null;
          vault_id?: string | null;
          weekly_day?: string | null;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string | null;
          due_days?: string[] | null;
          frequency?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          start_date?: string | null;
          transaction_match_keywords?: string[] | null;
          updated_at?: string | null;
          user_id?: string | null;
          vault_id?: string | null;
          weekly_day?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fixed_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fixed_items_vault_id_fkey";
            columns: ["vault_id"];
            isOneToOne: false;
            referencedRelation: "vaults";
            referencedColumns: ["id"];
          }
        ];
      };
      income_sources: {
        Row: {
          amount: number;
          created_at: string | null;
          due_days: string[] | null;
          frequency: string;
          id: string;
          name: string;
          notes: string | null;
          start_date: string | null;
          transaction_match_keywords: string[] | null;
          updated_at: string | null;
          user_id: string | null;
          weekly_day: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          due_days?: string[] | null;
          frequency: string;
          id?: string;
          name: string;
          notes?: string | null;
          start_date?: string | null;
          transaction_match_keywords?: string[] | null;
          updated_at?: string | null;
          user_id?: string | null;
          weekly_day?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          due_days?: string[] | null;
          frequency?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          start_date?: string | null;
          transaction_match_keywords?: string[] | null;
          updated_at?: string | null;
          user_id?: string | null;
          weekly_day?: string | null;
        };
        Relationships: [];
      };
      paychecks: {
        Row: {
          created_at: string | null;
          id: string;
          notes: string | null;
          paycheck_date: string;
          total_amount: number;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          paycheck_date: string;
          total_amount: number;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          paycheck_date?: string;
          total_amount?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };
      plaid_accounts: {
        Row: {
          available_balance: number | null;
          created_at: string | null;
          current_balance: number | null;
          id: string;
          iso_currency_code: string | null;
          mask: string | null;
          name: string | null;
          plaid_account_id: string;
          plaid_item_id: string | null;
          subtype: string | null;
          type: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          available_balance?: number | null;
          created_at?: string | null;
          current_balance?: number | null;
          id?: string;
          iso_currency_code?: string | null;
          mask?: string | null;
          name?: string | null;
          plaid_account_id: string;
          plaid_item_id?: string | null;
          subtype?: string | null;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          available_balance?: number | null;
          created_at?: string | null;
          current_balance?: number | null;
          id?: string;
          iso_currency_code?: string | null;
          mask?: string | null;
          name?: string | null;
          plaid_account_id?: string;
          plaid_item_id?: string | null;
          subtype?: string | null;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "plaid_accounts_plaid_item_id_fkey";
            columns: ["plaid_item_id"];
            isOneToOne: false;
            referencedRelation: "plaid_items";
            referencedColumns: ["plaid_item_id"];
          }
        ];
      };
      plaid_items: {
        Row: {
          access_token: string | null;
          created_at: string | null;
          id: string;
          institution_name: string | null;
          last_cursor: string | null;
          plaid_item_id: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          access_token?: string | null;
          created_at?: string | null;
          id?: string;
          institution_name?: string | null;
          last_cursor?: string | null;
          plaid_item_id?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          access_token?: string | null;
          created_at?: string | null;
          id?: string;
          institution_name?: string | null;
          last_cursor?: string | null;
          plaid_item_id?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      plaid_transactions: {
        Row: {
          account_id: string | null;
          amount: number | null;
          authorized_date: string | null;
          category: string[] | null;
          created_at: string | null;
          date: string | null;
          id: string;
          iso_currency_code: string | null;
          merchant_name: string | null;
          name: string | null;
          payment_channel: string | null;
          pending: boolean | null;
          pending_transaction_id: string | null;
          plaid_transaction_id: string;
          transaction_type: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          account_id?: string | null;
          amount?: number | null;
          authorized_date?: string | null;
          category?: string[] | null;
          created_at?: string | null;
          date?: string | null;
          id?: string;
          iso_currency_code?: string | null;
          merchant_name?: string | null;
          name?: string | null;
          payment_channel?: string | null;
          pending?: boolean | null;
          pending_transaction_id?: string | null;
          plaid_transaction_id: string;
          transaction_type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          account_id?: string | null;
          amount?: number | null;
          authorized_date?: string | null;
          category?: string[] | null;
          created_at?: string | null;
          date?: string | null;
          id?: string;
          iso_currency_code?: string | null;
          merchant_name?: string | null;
          name?: string | null;
          payment_channel?: string | null;
          pending?: boolean | null;
          pending_transaction_id?: string | null;
          plaid_transaction_id?: string;
          transaction_type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "plaid_transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "plaid_accounts";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          amount: number;
          created_at: string | null;
          description: string | null;
          id: string;
          plaid_transaction_id: string | null;
          posted_at: string | null;
          source: string | null;
          user_id: string | null;
          vault_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          plaid_transaction_id?: string | null;
          posted_at?: string | null;
          source?: string | null;
          user_id?: string | null;
          vault_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          plaid_transaction_id?: string | null;
          posted_at?: string | null;
          source?: string | null;
          user_id?: string | null;
          vault_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_transactions_plaid_transaction";
            columns: ["plaid_transaction_id"];
            isOneToOne: false;
            referencedRelation: "plaid_transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_plaid_transaction_id_fkey";
            columns: ["plaid_transaction_id"];
            isOneToOne: false;
            referencedRelation: "plaid_transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_vault_id_fkey";
            columns: ["vault_id"];
            isOneToOne: false;
            referencedRelation: "vaults";
            referencedColumns: ["id"];
          }
        ];
      };
      vaults: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          target_amount: number | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          target_amount?: number | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          target_amount?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      forecast_adjustments: {
        Row: {
          id: string;
          user_id: string;
          fixed_item_id: string;
          forecast_start: string;
          defer_to_start: string | null;
          override_amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fixed_item_id: string;
          forecast_start: string;
          defer_to_start?: string | null;
          override_amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fixed_item_id?: string;
          forecast_start?: string;
          defer_to_start?: string | null;
          override_amount?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forecast_adjustments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "auth.users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forecast_adjustments_fixed_item_id_fkey";
            columns: ["fixed_item_id"];
            referencedRelation: "fixed_items";
            referencedColumns: ["id"];
          }
        ];
      };
      forecast_oneoffs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          is_income: boolean;
          category_id: string | null;
          vault_id: string | null;
          date: string | null;
          transaction_match_keywords: string[] | null;
          forecast_start: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          is_income?: boolean;
          category_id?: string | null;
          vault_id?: string | null;
          date?: string | null;
          transaction_match_keywords?: string[] | null;
          forecast_start: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          is_income?: boolean;
          category_id?: string | null;
          vault_id?: string | null;
          date?: string | null;
          transaction_match_keywords?: string[] | null;
          forecast_start?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forecast_oneoffs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "auth.users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forecast_oneoffs_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forecast_oneoffs_vault_id_fkey";
            columns: ["vault_id"];
            referencedRelation: "vaults";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
