import { supabase } from "@/lib/supabase/client";
import { getIncomeHitDate } from "@/lib/utils/date/paycheck";
import { normalizeFixedItem } from "@/lib/utils/fixedItem";

export interface ForecastIncome {
  id: string;
  name: string;
  amount: number;
  source: "income_source" | "one_off";
}

export interface ForecastExpense {
  id: string;
  name: string;
  amount: number;
  source: "fixed_item" | "one_off";
  isDeferred?: boolean;
  isOverridden?: boolean;
}

export interface ForecastResult {
  income: ForecastIncome[];
  expenses: ForecastExpense[];
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function loadForecastForPeriod(
  startDate: Date,
  endDate: Date
): Promise<ForecastResult> {
  const forecastStart = iso(startDate);

  const [
    { data: incomeSources },
    { data: fixedItems },
    { data: adjustments },
    { data: oneOffs },
  ] = await Promise.all([
    supabase.from("income_sources").select("*"),
    supabase.from("fixed_items").select("*"),
    supabase
      .from("forecast_adjustments")
      .select("*")
      .eq("forecast_start", forecastStart),
    supabase
      .from("forecast_oneoffs")
      .select("*")
      .eq("forecast_start", forecastStart),
  ]);

  type Adjustment = {
    fixed_item_id?: string | null;
    defer_to_start?: string | null;
    override_amount?: number | null;
  };

  const adjustmentMap = new Map<string, Adjustment>();
  (adjustments as Adjustment[] | undefined)?.forEach((adj) => {
    if (adj.fixed_item_id) {
      adjustmentMap.set(adj.fixed_item_id, adj);
    }
  });

  const income: ForecastIncome[] = [];
  const expenses: ForecastExpense[] = [];

  incomeSources?.forEach((src) => {
    const hits = getIncomeHitDate(
      {
        start_date: src.start_date ?? undefined,
        frequency: src.frequency,
        due_days: src.due_days ?? undefined,
        weekly_day: src.weekly_day ?? undefined,
        name: src.name,
      },
      startDate,
      endDate
    );
    if (hits.length > 0 || src.name?.toLowerCase().includes("paycheck")) {
      income.push({
        id: src.id,
        name: src.name,
        amount: src.amount,
        source: "income_source",
      });
    }
  });

  fixedItems?.map(normalizeFixedItem).forEach((item) => {
    const hits = getIncomeHitDate(
      {
        start_date: item.start_date ?? undefined,
        frequency: item.frequency,
        due_days: item.due_days?.map(String),
        weekly_day: item.weekly_day ?? undefined,
        name: item.name,
      },
      startDate,
      endDate
    );
    if (hits.length > 0 || item.frequency.toLowerCase() === "per paycheck") {
      const adj = adjustmentMap.get(item.id);
      if (adj?.defer_to_start && adj.defer_to_start !== forecastStart) {
        return; // Skip this item – it's deferred to a future paycheck
      }
      const isDeferred = Boolean(adj?.defer_to_start);
      const amount = adj?.override_amount ?? item.amount;
      expenses.push({
        id: item.id,
        name: item.name,
        amount,
        source: "fixed_item",
        isDeferred,
        isOverridden: adj?.override_amount != null,
      });
    }
  });

  oneOffs
    ?.filter((o) => o.is_income)
    .forEach((o) => {
      income.push({
        id: o.id,
        name: o.name,
        amount: o.amount,
        source: "one_off",
      });
    });

  oneOffs
    ?.filter((o) => !o.is_income)
    .forEach((o) => {
      expenses.push({
        id: o.id,
        name: o.name,
        amount: o.amount,
        source: "one_off",
      });
    });

  return { income, expenses };
}
