export type FixedItem = {
  id: string;
  name: string;
  category_id?: string;
  categories?: {
    id: string;
    name: string;
  } | null;
  transaction_match_keywords?: string[] | null;
  amount: number;
  frequency: string;
  due_days?: string[];
  start_date: string | null;
  is_income: boolean;
  notes: string | null;
  vaults?: {
    id: string;
    name: string;
  } | null;
  vault_id?: string | null;
  vault_direction?: string | null;
  weekly_day?: string;
};

export type Vault = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
  sort_order: number | null;
};

export type FixedItemFormProps = {
  item?: FixedItem | null;
  onClose: () => void;
  onSave: () => void;
};

export type PlaidAccount = {
  account_id: string;
  name: string;
  type: string;
  subtype: string | null;
  mask: string | null;
  balances: {
    available: number | null;
    current: number;
    iso_currency_code: string | null;
  };
};

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  name: string;
  amount: number;
  date: string;
  category?: string[];
  iso_currency_code: string | null;
  pending: boolean;
}
