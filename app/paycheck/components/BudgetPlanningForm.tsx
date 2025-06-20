"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { generatePaycheckDates } from "@/lib/utils/generatePaycheckDates";
import { getIncomeHitDate, getPaycheckRange } from "@/lib/utils/date/paycheck";
import { formatDateRange, formatDisplayDate } from "@/lib/utils/date/format";
import { normalizeFixedItem } from "@/lib/utils/fixedItem";
import { FixedItem } from "@/types";
import type { Database } from "@/types/supabase";
import OneOffSection from "@/components/forecast/OneOffSection";
import FixedItemForecastModal from "@/components/forecast/FixedItemForecastModal";
import { Skeleton } from "@/components/ui/skeleton";

interface BudgetPlanningFormProps {
  paycheckId: string;
  onApproved?: () => void;
}

type PaycheckRecord = {
  id: string;
  paycheck_date: string;
  approved?: boolean | null;
};

type PaycheckDate = {
  label: string;
  officialDate: string;
  adjustedDate: string;
};

function getDueDatesForItem(
  item: FixedItem,
  selectedDate: PaycheckDate | null,
  start: Date | null,
  end: Date | null
) {
  if (!selectedDate || !start || !end) return [] as Date[];
  const starts = item.start_date ? new Date(item.start_date) : null;
  if (starts && starts > end) return [];
  const frequency = item.frequency?.trim().toLowerCase();
  if (frequency === "per paycheck") {
    return [new Date(`${selectedDate.adjustedDate}T12:00:00`)];
  }
  return getIncomeHitDate(
    {
      start_date: item.start_date ?? undefined,
      frequency,
      due_days: item.due_days?.map(String),
      weekly_day: item.weekly_day ?? undefined,
      name: item.name,
    },
    start,
    end
  );
}

export default function BudgetPlanningForm({
  paycheckId,
  onApproved,
}: BudgetPlanningFormProps) {
  const [record, setRecord] = useState<PaycheckRecord | null>(null);
  const [paycheckDates, setPaycheckDates] = useState<PaycheckDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<PaycheckDate | null>(null);

  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);

  const [incomeSources, setIncomeSources] = useState<
    Database["public"]["Tables"]["income_sources"]["Row"][]
  >([]);
  const [fixedItems, setFixedItems] = useState<FixedItem[]>([]);
  const [vaultItems, setVaultItems] = useState<FixedItem[]>([]);

  const [oneOffItems, setOneOffItems] = useState<
    Database["public"]["Tables"]["forecast_oneoffs"]["Row"][]
  >([]);
  const [adjustments, setAdjustments] = useState<
    Database["public"]["Tables"]["forecast_adjustments"]["Row"][]
  >([]);

  const [isLoadingIncome, setIsLoadingIncome] = useState(true);
  const [isLoadingFixedItems, setIsLoadingFixedItems] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    supabase
      .from("paychecks")
      .select("id, paycheck_date, approved")
      .eq("id", paycheckId)
      .single()
      .then(({ data }) => {
        if (data) setRecord(data as PaycheckRecord);
      });
  }, [paycheckId]);

  useEffect(() => {
    const all = generatePaycheckDates(
      new Date("2025-01-01"),
      new Date("2026-01-01")
    );
    setPaycheckDates(all);
  }, []);

  useEffect(() => {
    if (!record || paycheckDates.length === 0) return;
    const found = paycheckDates.find(
      (p) => p.adjustedDate === record.paycheck_date
    );
    setSelectedDate(found ?? null);
  }, [record, paycheckDates]);

  const currentIndex = useMemo(() => {
    if (!selectedDate) return -1;
    return paycheckDates.findIndex(
      (p) => p.officialDate === selectedDate.officialDate
    );
  }, [selectedDate, paycheckDates]);

  const nextPaycheck = useMemo(() => {
    if (currentIndex === -1) return undefined;
    return paycheckDates[currentIndex + 1];
  }, [currentIndex, paycheckDates]);

  const { start, end } = useMemo(() => {
    if (!selectedDate)
      return { start: null, end: null } as {
        start: Date | null;
        end: Date | null;
      };
    return getPaycheckRange(selectedDate, nextPaycheck);
  }, [selectedDate, nextPaycheck]);

  // Income
  useEffect(() => {
    if (!start || !end) return;
    setIsLoadingIncome(true);
    const periodStart = start;
    const periodEnd = end;
    supabase
      .from("income_sources")
      .select("*")
      .then(({ data }) => {
        if (!data) {
          setIncomeSources([]);
          setIsLoadingIncome(false);
          return;
        }
        const included = data.filter((row) => {
          const starts = row.start_date ? new Date(row.start_date) : null;
          const isPaycheck = row.name?.toLowerCase().includes("paycheck");
          const hits =
            isPaycheck ||
            getIncomeHitDate(
              {
                ...row,
                due_days: row.due_days ?? undefined,
                weekly_day: row.weekly_day ?? undefined,
                frequency: row.frequency ?? undefined,
                start_date: row.start_date ?? undefined,
              },
              periodStart,
              periodEnd
            ).length > 0;
          return (!starts || starts <= periodEnd) && hits;
        });
        setIncomeSources(included);
        setIsLoadingIncome(false);
      });
  }, [start, end]);

  // Fixed items
  useEffect(() => {
    if (!start || !end) return;
    setIsLoadingFixedItems(true);
    supabase
      .from("fixed_items")
      .select("*, categories(id, name)")
      .then(({ data }) => {
        if (!data) return;
        const items = data.map(normalizeFixedItem);
        const vaults = items.filter(
          (i) => i.categories?.name?.trim().toLowerCase() === "vault"
        );
        const fixed = items.filter(
          (i) => i.categories?.name?.trim().toLowerCase() !== "vault"
        );
        setVaultItems(vaults);
        setFixedItems(fixed);
        setIsLoadingFixedItems(false);
      });
  }, [start, end]);

  // Refresh forecast adjustments for this period
  const refreshAdjustments = () => {
    if (!start) return;
    supabase
      .from("forecast_adjustments")
      .select("*")
      .eq("forecast_start", start.toISOString().slice(0, 10))
      .then(({ data }) => {
        setAdjustments(data ?? []);
      });
  };

  // Forecast adjustments for this period
  useEffect(() => {
    refreshAdjustments();
  }, [start]);

  // One-off items
  useEffect(() => {
    if (!start) return;
    supabase
      .from("forecast_oneoffs")
      .select(
        "id, name, amount, is_income, forecast_start, category_id, vault_id"
      )
      .eq("forecast_start", start.toISOString().slice(0, 10))
      .then(({ data }) => {
        setOneOffItems(
          (data ?? []).map((item) => ({
            ...item,
            created_at: null,
            date: null,
            notes: null,
            transaction_match_keywords: null,
            user_id: "",
          }))
        );
      });
  }, [start]);

  const incomeBreakdown = useMemo(() => {
    if (!selectedDate || !start || !end)
      return [] as {
        id: string;
        name: string;
        amount: number;
        displayDate: string;
      }[];
    return incomeSources
      .map((source) => {
        if (source.name === "Paycheck") {
          return {
            id: source.id,
            name: source.name,
            amount: source.amount,
            displayDate: formatDisplayDate(selectedDate.adjustedDate),
          };
        }
        const hits = getIncomeHitDate(
          {
            ...source,
            due_days: source.due_days ?? undefined,
            weekly_day: source.weekly_day ?? undefined,
            frequency: source.frequency ?? undefined,
            start_date: source.start_date ?? undefined,
          },
          start,
          end
        );
        if (!hits.length) return null;
        return {
          id: source.id,
          name: source.name,
          amount: source.amount,
          displayDate: formatDisplayDate(hits[0].toISOString()),
        };
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      amount: number;
      displayDate: string;
    }[];
  }, [incomeSources, selectedDate, start, end]);

  const incomeTotal = useMemo(
    () => incomeBreakdown.reduce((sum, s) => sum + (s.amount ?? 0), 0),
    [incomeBreakdown]
  );

  const fixedDisplayItems = useMemo(() => {
    return fixedItems
      .flatMap((item) => {
        const skip = adjustments.some(
          (a) => a.fixed_item_id === item.id && a.defer_to_start !== null
        );
        if (skip)
          return [] as {
            id: string;
            name: string;
            displayDate: Date;
            adjustedAmount: number;
          }[];
        const hitDates = getDueDatesForItem(item, selectedDate, start, end);
        const adjustedAmount =
          adjustments.find((a) => a.fixed_item_id === item.id)
            ?.override_amount ?? item.amount;
        return hitDates.map((d) => ({
          id: item.id,
          name: item.name,
          displayDate: d,
          adjustedAmount,
        }));
      })
      .sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());
  }, [fixedItems, selectedDate, start, end, adjustments]);

  const vaultDisplayItems = useMemo(() => {
    return vaultItems
      .flatMap((item) => {
        const starts = item.start_date ? new Date(item.start_date) : null;
        if (starts && end && starts > end)
          return [] as {
            id: string;
            name: string;
            displayDate: Date;
            adjustedAmount: number;
          }[];
        const skip = adjustments.some(
          (a) => a.fixed_item_id === item.id && a.defer_to_start !== null
        );
        if (skip) return [];
        const hitDates = getDueDatesForItem(item, selectedDate, start, end);
        const adjustedAmount =
          adjustments.find((a) => a.fixed_item_id === item.id)
            ?.override_amount ?? item.amount;
        return hitDates.map((d) => ({
          id: item.id,
          name: item.name,
          displayDate: d,
          adjustedAmount,
        }));
      })
      .sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());
  }, [vaultItems, selectedDate, start, end, adjustments]);

  const fixedExpensesTotal = useMemo(
    () => fixedDisplayItems.reduce((sum, i) => sum + i.adjustedAmount, 0),
    [fixedDisplayItems]
  );
  const vaultContributionsTotal = useMemo(
    () => vaultDisplayItems.reduce((sum, i) => sum + i.adjustedAmount, 0),
    [vaultDisplayItems]
  );
  const oneOffExpenseTotal = useMemo(
    () =>
      oneOffItems.filter((o) => !o.is_income).reduce((s, o) => s + o.amount, 0),
    [oneOffItems]
  );
  const oneOffIncomeTotal = useMemo(
    () =>
      oneOffItems.filter((o) => o.is_income).reduce((s, o) => s + o.amount, 0),
    [oneOffItems]
  );
  const unallocatedBalance =
    incomeTotal +
    oneOffIncomeTotal -
    fixedExpensesTotal -
    vaultContributionsTotal -
    oneOffExpenseTotal;

  const handleApproveBudget = async () => {
    if (isApproving || !start) return;
    const confirmed = window.confirm(
      "Are you sure you want to approve this budget?"
    );
    if (!confirmed) return;
    setIsApproving(true);

    const { data: user } = await supabase.auth.getUser();
    const userId = user?.user?.id;
    if (!userId) {
      setIsApproving(false);
      return;
    }

    const { data: paycheck } = await supabase
      .from("paychecks")
      .select("approved")
      .eq("id", paycheckId)
      .single();

    if (paycheck?.approved) {
      setIsApproving(false);
      return;
    }

    // Add expense_date and contribution_date to inserts
    const expenseDate =
      selectedDate?.adjustedDate ?? start?.toISOString().slice(0, 10) ?? null;
    const fixedRows = fixedDisplayItems.map((item) => {
      const fullItem = fixedItems.find((f) => f.id === item.id);
      return {
        user_id: userId,
        paycheck_id: paycheckId,
        label: item.name,
        amount: item.adjustedAmount,
        origin: "fixed",
        status: "planned",
        fixed_item_id: item.id,
        expense_date: item.displayDate
          ? item.displayDate.toISOString().slice(0, 10)
          : expenseDate,
        category_id: fullItem?.category_id ?? null,
      };
    });

    const vaultRows = vaultDisplayItems.map((item) => ({
      user_id: userId,
      paycheck_id: paycheckId,
      vault_id: vaultItems.find((v) => v.id === item.id)?.vault_id as string,
      amount: item.adjustedAmount,
      status: "pending",
      source: "fixed_item",
      contribution_date: item.displayDate
        ? item.displayDate.toISOString().slice(0, 10)
        : expenseDate,
    }));

    const oneOffRows = oneOffItems
      .filter((o) => !o.is_income)
      .map((item) => ({
        user_id: userId,
        paycheck_id: paycheckId,
        label: item.name,
        amount: item.amount,
        origin: "oneoff",
        status: "planned",
        forecast_oneoff_id: item.id,
        category_id: item.category_id,
        vault_id: item.vault_id,
        expense_date: expenseDate,
      }));

    await supabase.from("expenses").insert([...fixedRows, ...oneOffRows]);
    const { data: insertedContribs } = await supabase
      .from("vault_contributions")
      .insert(vaultRows)
      .select("id, vault_id, amount, contribution_date");

    if (insertedContribs) {
      const activityRows = insertedContribs.map((c) => ({
        user_id: userId,
        vault_id: c.vault_id,
        amount: c.amount,
        activity_date:
          c.contribution_date ?? new Date().toISOString().slice(0, 10),
        source: "paycheck",
        related_id: c.id,
        notes: "Paycheck vault contribution",
      }));
      await supabase.from("vault_activity").insert(activityRows);
    }

    // Insert income records for actual income at time of approval
    const incomeRows = incomeBreakdown.map((income) => ({
      user_id: userId,
      paycheck_id: paycheckId,
      source: income.name,
      amount: income.amount,
      received_date:
        oneOffItems.find((o) => o.name === income.name && o.is_income)?.date ??
        expenseDate,
      // Try to match to forecast_oneoff or income_source if possible
      forecast_oneoff_id: oneOffItems.find(
        (o) => o.name === income.name && o.is_income
      )?.id,
      income_source_id: incomeSources.find((s) => s.name === income.name)?.id,
    }));
    // Add income records for forecast_oneoffs with is_income = true (using the date column if available)
    const oneOffIncomeRows = oneOffItems
      .filter((o) => o.is_income)
      .map((item) => ({
        user_id: userId,
        paycheck_id: paycheckId,
        source: item.name,
        amount: item.amount,
        received_date: item.date ?? expenseDate, // Use the date column if available
        forecast_oneoff_id: item.id,
        income_source_id: null,
      }));

    // Combine incomeRows and oneOffIncomeRows, ensuring dates are correctly assigned
    const allIncomeRows = [
      ...incomeRows.map((income) => ({
        ...income,
        received_date: income.received_date ?? expenseDate, // Use calculated dates for income_sources
      })),
      ...oneOffIncomeRows,
    ];

    await supabase.from("income_records").insert(allIncomeRows);

    // Calculate total amount using same formula as unallocatedBalance
    const totalApprovedAmount = incomeTotal + oneOffIncomeTotal;

    await supabase
      .from("paychecks")
      .update({
        approved: true,
        total_amount: totalApprovedAmount,
      })
      .eq("id", paycheckId);

    // Fetch updated paycheck record and update local state so UI re-renders
    const updated = await supabase
      .from("paychecks")
      .select("id, paycheck_date, approved")
      .eq("id", paycheckId)
      .single();
    if (updated.data) setRecord(updated.data as PaycheckRecord);

    setIsApproving(false);
    if (updated.data) {
      onApproved?.();
    }
  };

  if (!record || !selectedDate) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Income Summary
          </h2>
          {isLoadingIncome ? (
            <Skeleton className="h-4 w-1/2" />
          ) : (
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                <strong>Paycheck Date:</strong>{" "}
                {formatDisplayDate(selectedDate.adjustedDate)}
              </div>
              {start && end && (
                <div>
                  <strong>Pay Period:</strong>{" "}
                  {formatDateRange(start.toISOString(), end.toISOString())}
                </div>
              )}
              <div>
                <strong>Total Income:</strong> ${incomeTotal.toLocaleString()}
              </div>
              <button
                onClick={() => setShowIncomeBreakdown((p) => !p)}
                className="text-xs text-blue-500 underline mt-1"
              >
                {showIncomeBreakdown ? "Hide" : "Show"} Breakdown
              </button>
              {showIncomeBreakdown && (
                <ul className="ml-4 mt-2 list-disc text-xs">
                  {incomeBreakdown.map((i) => (
                    <li key={i.id}>
                      {i.name} (${i.amount.toFixed(2)}) — {i.displayDate}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-foreground">
              Fixed Expenses
            </h2>
          </div>
          {isLoadingFixedItems ? (
            <Skeleton className="h-4 w-1/2" />
          ) : (
            <div className="space-y-2">
              {fixedDisplayItems.map((item, idx) => (
                <FixedItemForecastModal
                  key={`${item.id}-${idx}`}
                  fixedItem={{ ...fixedItems.find((f) => f.id === item.id)! }}
                  fixedItemId={item.id}
                  forecastStart={start?.toISOString().slice(0, 10) ?? ""}
                  onSaved={refreshAdjustments}
                  trigger={
                    <div className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background hover:bg-muted transition">
                      <div className="text-sm font-medium text-foreground">
                        {item.name}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>${item.adjustedAmount.toFixed(2)}</div>
                        <div>
                          Due{" "}
                          {formatDisplayDate(item.displayDate.toISOString())}
                        </div>
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-foreground">
              Vault Contributions
            </h2>
          </div>
          {isLoadingFixedItems ? (
            <Skeleton className="h-4 w-1/2" />
          ) : (
            <div className="space-y-2">
              {vaultDisplayItems.map((item, idx) => (
                <FixedItemForecastModal
                  key={`${item.id}-${idx}`}
                  fixedItem={{ ...vaultItems.find((v) => v.id === item.id)! }}
                  fixedItemId={item.id}
                  forecastStart={start?.toISOString().slice(0, 10) ?? ""}
                  onSaved={refreshAdjustments}
                  trigger={
                    <div className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background hover:bg-muted transition">
                      <div className="text-sm font-medium text-foreground">
                        {item.name}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>${item.adjustedAmount.toFixed(2)}</div>
                        <div>
                          Due{" "}
                          {formatDisplayDate(item.displayDate.toISOString())}
                        </div>
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {start && (
          <OneOffSection
            forecastStart={start.toISOString().slice(0, 10)}
            onSaved={() => {}}
          />
        )}

        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Unallocated Balance
          </h2>
          {isLoadingIncome || isLoadingFixedItems ? (
            <Skeleton className="h-4 w-1/2" />
          ) : (
            <div
              className={`text-2xl font-bold ${
                unallocatedBalance > 0
                  ? "text-green-600"
                  : unallocatedBalance < 0
                  ? "text-red-600"
                  : "text-yellow-500"
              }`}
            >
              ${unallocatedBalance.toFixed(2)} available
            </div>
          )}
        </section>

        <button
          className="w-full bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleApproveBudget}
          disabled={isApproving}
        >
          Approve Budget
        </button>
      </div>
    </AuthGuard>
  );
}
