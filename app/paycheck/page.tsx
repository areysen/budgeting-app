// @ts-nocheck
"use client";
import { normalizeFixedItem } from "@/lib/utils/fixedItem";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { generatePaycheckDates } from "@/lib/utils/generatePaycheckDates";
import { getPaycheckRange, getIncomeHitDate } from "@/lib/utils/date/paycheck";
import { formatDateRange, formatDisplayDate } from "@/lib/utils/date/format";
import { FixedItem } from "@/types";
import OneOffSection from "@/components/forecast/OneOffSection";
import { Skeleton } from "@/components/ui/skeleton";
import FixedItemForecastModal from "@/components/forecast/FixedItemForecastModal";

type PaycheckDate = {
  label: string;
  officialDate: string;
  adjustedDate: string;
};

export default function PaycheckPage() {
  // Removed unused vaultCount
  const [paycheckDates, setPaycheckDates] = useState<PaycheckDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<PaycheckDate | null>(null);

  const [isLoadingIncome, setIsLoadingIncome] = useState(true);
  const [isLoadingFixedItems, setIsLoadingFixedItems] = useState(true);

  type IncomeSource = {
    id: string;
    name: string;
    amount: number;
    start_date: string | null;
    frequency: string | null;
    due_days: string[] | null;
    notes: string | null;
    transaction_match_keywords: string[] | null;
    weekly_day: string | null;
  };

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);

  const [fixedItems, setFixedItems] = useState<FixedItem[]>([]);
  const [vaultItems, setVaultItems] = useState<FixedItem[]>([]);
  // Forecast adjustments state
  const [adjustments, setAdjustments] = useState([]);
  // One-off items state
  type OneOff = {
    id?: string;
    name?: string;
    amount: number;
    is_income?: boolean;
    forecast_start: string | null;
    [key: string]: any;
  };
  const [oneOffItems, setOneOffItems] = useState<OneOff[]>([]);

  // Function to refresh one-off items for the current period
  const refreshOneOffs = async () => {
    if (!start) return;
    const { data } = await supabase
      .from("forecast_oneoffs")
      .select("amount, is_income, forecast_start");

    const included =
      data?.filter((row) => {
        return row.forecast_start === start?.toISOString().slice(0, 10);
      }) || [];

    setOneOffItems(included);
  };

  // Function to refresh forecast adjustments for the current period
  const refreshAdjustments = async () => {
    if (!start) return;
    const { data } = await supabase
      .from("forecast_adjustments")
      .select("*")
      .eq("forecast_start", start.toISOString().slice(0, 10));
    setAdjustments(data ?? []);
  };

  // Removed vault count effect (no longer needed)

  // Helper to get all due dates for a fixed item (updated to check start_date)
  const getDueDatesForItem = (
    item: FixedItem,
    selectedDate: PaycheckDate | null,
    start: Date | null,
    end: Date | null
  ): Date[] => {
    if (!selectedDate || !start || !end) return [];

    const starts = item.start_date ? new Date(item.start_date) : null;

    // 💡 If item has a start_date and it's AFTER the current range, skip it
    if (starts && starts > end) return [];

    const frequency = item.frequency?.trim().toLowerCase();
    if (frequency === "per paycheck") {
      return [new Date(`${selectedDate.adjustedDate}T12:00:00`)];
    }
    // Additional log for monthly candidate date
    if (item.frequency === "monthly") {
      const monthDate = new Date(start);
      monthDate.setDate(parseInt(item.due_days?.[0] || "1"));
    }

    return getIncomeHitDate(
      {
        start_date: item.start_date ?? undefined, // keep as undefined if null
        frequency,
        due_days: item.due_days?.map(String),
        weekly_day: item.weekly_day ?? undefined,
        name: item.name,
      },
      start,
      end
    );
  };
  useEffect(() => {
    const all = generatePaycheckDates(
      new Date("2025-01-01"),
      new Date("2026-01-01")
    );

    const today = new Date();
    const upcoming = all
      .filter((pd) => new Date(pd.adjustedDate) >= today)
      .sort(
        (a, b) =>
          new Date(a.adjustedDate).getTime() -
          new Date(b.adjustedDate).getTime()
      );

    setPaycheckDates(upcoming);
    if (upcoming.length > 0) {
      setSelectedDate(upcoming[0]);
    }
  }, []);

  const handleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const adjustedDate = e.target.value;
    const found =
      paycheckDates.find((pd) => pd.adjustedDate === adjustedDate) ?? null;
    setSelectedDate(found);
  };

  // Compute current and next paycheck range and formatted label
  const currentIndex = paycheckDates.findIndex(
    (p) => p.officialDate === selectedDate?.officialDate
  );
  let nextPaycheck =
    currentIndex !== -1 ? paycheckDates[currentIndex + 1] : undefined;

  // Defensive fix: If selectedDate is a Month EOM, and nextPaycheck is also EOM (or not the 15th),
  // look ahead for the *true* next paycheck (which should be the 15th of the following month)
  if (
    selectedDate?.label.includes("EOM") &&
    nextPaycheck &&
    !nextPaycheck.label.includes("15") &&
    paycheckDates[currentIndex + 2]
  ) {
    nextPaycheck = paycheckDates[currentIndex + 2];
  }

  const { start, end } = useMemo(() => {
    if (!selectedDate) return { start: null, end: null };
    return getPaycheckRange(selectedDate, nextPaycheck);
  }, [selectedDate, nextPaycheck]);

  // Load forecast adjustments for the current period
  useEffect(() => {
    if (!start || !selectedDate) return;

    supabase
      .from("forecast_adjustments")
      .select("*")
      .eq("forecast_start", start.toISOString().slice(0, 10))
      .then(({ data }) => setAdjustments(data ?? []));
  }, [start, selectedDate]);

  const incomeBreakdown = useMemo(() => {
    if (!selectedDate || !start || !end) return [];
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

        const hitDates = getIncomeHitDate(
          {
            ...source,
            due_days: source.due_days?.map(String) ?? undefined,
            weekly_day: source.weekly_day ?? undefined,
            frequency: source.frequency ?? undefined,
            start_date: source.start_date ?? undefined,
          },
          start,
          end
        );
        if (!hitDates.length) return null;

        return {
          id: source.id,
          name: source.name,
          amount: source.amount,
          displayDate: formatDisplayDate(hitDates[0].toISOString()),
        };
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      amount: number;
      displayDate: string;
    }[];
  }, [incomeSources, selectedDate, start, end]);

  // State for income total
  const [incomeTotal, setIncomeTotal] = useState<number>(0);

  const fixedExpensesTotal = useMemo(() => {
    return fixedItems
      .flatMap((item) => {
        // Skip if deferred
        const skip = adjustments.some(
          (a) => a.fixed_item_id === item.id && a.defer_to_start !== null
        );
        if (skip) return [];

        const hitDates = getDueDatesForItem(item, selectedDate, start, end);
        const adjustedAmount =
          adjustments.find((a) => a.fixed_item_id === item.id)
            ?.override_amount ?? item.amount;

        return hitDates.map(() => adjustedAmount);
      })
      .reduce((sum, amount) => sum + amount, 0);
  }, [fixedItems, selectedDate, start, end, adjustments]);

  const vaultContributionsTotal = useMemo(() => {
    return vaultItems
      .flatMap((item) => {
        const starts = item.start_date ? new Date(item.start_date) : null;
        if (starts && starts > end) return [];

        const skip = adjustments.some(
          (a) => a.fixed_item_id === item.id && a.defer_to_start !== null
        );
        if (skip) return [];

        const hitDates = getDueDatesForItem(item, selectedDate, start, end);
        const adjustedAmount =
          adjustments.find((a) => a.fixed_item_id === item.id)
            ?.override_amount ?? item.amount;

        return hitDates.map(() => adjustedAmount);
      })
      .reduce((sum, amount) => sum + amount, 0);
  }, [vaultItems, selectedDate, start, end, adjustments]);

  // One-off income/expense totals
  const oneOffExpenseTotal = useMemo(() => {
    return oneOffItems
      .filter((o) => !o.is_income)
      .reduce((sum, o) => sum + o.amount, 0);
  }, [oneOffItems]);
  const oneOffIncomeTotal = useMemo(() => {
    return oneOffItems
      .filter((o) => o.is_income)
      .reduce((sum, o) => sum + o.amount, 0);
  }, [oneOffItems]);
  const unallocatedBalance =
    incomeTotal +
    oneOffIncomeTotal -
    fixedExpensesTotal -
    vaultContributionsTotal -
    oneOffExpenseTotal;
  // Load one-off items for the selected period
  useEffect(() => {
    if (!selectedDate || !start || !end) return;

    supabase
      .from("forecast_oneoffs")
      .select("amount, is_income, forecast_start")
      .then(({ data }) => {
        if (!data) {
          setOneOffItems([]);
          return;
        }

        // Only include items where forecast_start matches the exact date string (YYYY-MM-DD)
        const included = data.filter((row) => {
          return row.forecast_start === start.toISOString().slice(0, 10);
        });

        setOneOffItems(included);
      });
  }, [selectedDate, start, end]);

  // Load income from income_sources for the selected period
  useEffect(() => {
    if (!selectedDate || !start || !end) return;

    setIsLoadingIncome(true);

    const periodStart = start;
    const periodEnd = end;

    supabase
      .from("income_sources")
      .select("*")
      .then(({ data }) => {
        if (!data) {
          setIncomeTotal(0);
          setIncomeSources([]);
          setIsLoadingIncome(false);
          return;
        }

        const includedIncome = data
          .filter((row) => {
            const starts = row.start_date ? new Date(row.start_date) : null;
            const isPaycheck = row.name?.toLowerCase().includes("paycheck");
            const hitDates = getIncomeHitDate(
              {
                ...row,
                due_days: row.due_days ?? undefined,
                weekly_day: row.weekly_day ?? undefined,
                frequency: row.frequency ?? undefined,
                start_date: row.start_date ?? undefined,
              },
              periodStart,
              periodEnd
            );
            const hitsInPeriod = isPaycheck || hitDates.length > 0;
            return (!starts || starts <= periodEnd) && hitsInPeriod;
          })
          .sort(
            (a, b) =>
              new Date(a.start_date ?? "1970-01-01").getTime() -
              new Date(b.start_date ?? "1970-01-01").getTime()
          );

        const total = includedIncome.reduce(
          (sum, row) => sum + (row.amount ?? 0),
          0
        );
        setIncomeTotal(total);
        setIncomeSources(
          includedIncome.map((row) => ({
            ...row,
            due_days: row.due_days ? row.due_days.map(Number) : undefined,
          }))
        );
        setIsLoadingIncome(false);
      });
  }, [selectedDate, start, end, nextPaycheck]);

  useEffect(() => {
    if (!selectedDate || !start || !end) return;

    setIsLoadingFixedItems(true);

    const periodStart = start;
    const periodEnd = end;

    // Get userId for deferred query
    supabase.auth.getUser().then(({ data: { user } }) => {
      const userId = user?.id;
      // Fetch regular fixed items
      supabase
        .from("fixed_items")
        .select("*, frequency, categories(name)")
        .then(async ({ data }) => {
          if (!data) {
            setFixedItems([]);
            setIsLoadingFixedItems(false);
            return;
          }

          // Normalize each fixed item
          const normalizedItems = data.map(normalizeFixedItem);

          // Vault contributions: filter by related category name "vault"
          const vaultContributions = normalizedItems.filter(
            (row) => row.categories?.name?.trim().toLowerCase() === "vault"
          );

          // Fixed Expenses: exclude items with related category name "vault"
          let items = normalizedItems
            .filter((row) => {
              const isVault =
                row.categories?.name?.trim().toLowerCase() === "vault";
              if (isVault) return false;
              if (row.frequency === "monthly") {
                const monthDate = new Date(periodStart);
                monthDate.setDate(parseInt(row.due_days?.[0] || "1"));
              }

              const starts = row.start_date ? new Date(row.start_date) : null;
              const isPerPaycheck =
                row.frequency?.toLowerCase() === "per paycheck";

              const hitDates = isPerPaycheck
                ? [true]
                : getIncomeHitDate(
                    {
                      name: row.name,
                      start_date: row.start_date ?? undefined,
                      frequency: row.frequency,
                      due_days: row.due_days?.map(String),
                      weekly_day: row.weekly_day ?? undefined,
                    },
                    periodStart,
                    periodEnd
                  );

              const hits = isPerPaycheck || hitDates.length > 0;

              return (!starts || starts <= periodEnd) && hits;
            })
            .sort(
              (a, b) =>
                new Date(a.start_date ?? "1970-01-01").getTime() -
                new Date(b.start_date ?? "1970-01-01").getTime()
            );

          // --- Deferred fixed items ---
          if (userId) {
            const { data: deferredAdjustments, error: deferredError } =
              await supabase
                .from("forecast_adjustments")
                .select("*, fixed_items(*)")
                .eq("defer_to_start", periodStart.toISOString().slice(0, 10))
                .eq("user_id", userId);

            if (deferredError) {
              console.error(
                "Failed to fetch deferred forecast adjustments:",
                deferredError
              );
            } else {
              deferredAdjustments?.forEach((def) => {
                if (def.fixed_items) {
                  // Build deferred item, include originalForecastStart
                  const deferredItem = {
                    ...def.fixed_items,
                    id: `${def.fixed_item_id}-deferred`,
                    amount: def.override_amount ?? def.fixed_items.amount,
                    isDeferred: true,
                    source: "deferred",
                    adjustment_id: def.id,
                    // Pass real fixed_item_id and the originating forecast_start
                    originalFixedItemId: def.fixed_item_id,
                    forecastStart: def.defer_to_start,
                    originalForecastStart: def.forecast_start,
                  };
                  items.push(deferredItem);
                }
              });
            }
          }
          setFixedItems(items);
          setVaultItems(vaultContributions);
          setIsLoadingFixedItems(false);
        });
    });
  }, [selectedDate, start, end, nextPaycheck]);

  return (
    <AuthGuard>
      <div className="space-y-6">
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Select Paycheck
          </h2>
          <select
            className="w-full border border-border rounded-md p-2 bg-background text-foreground"
            value={selectedDate?.adjustedDate ?? ""}
            onChange={handleSelectChange}
          >
            <option value="" disabled>
              Choose a paycheck date
            </option>
            {paycheckDates.map(({ label, adjustedDate }) => (
              <option key={adjustedDate} value={adjustedDate}>
                {label} -{" "}
                {new Date(adjustedDate + "T00:00:00").toLocaleDateString()}
              </option>
            ))}
          </select>
        </section>

        <h1 className="text-3xl font-bold text-foreground">Paycheck Plan</h1>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Income Summary
          </h2>
          {isLoadingIncome ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                <strong>Paycheck Date:</strong>{" "}
                {formatDisplayDate(selectedDate.adjustedDate)}
              </div>
              <div>
                <strong>Pay Period:</strong>{" "}
                {formatDateRange(start.toISOString(), end.toISOString())}
              </div>
              <div>
                <strong>Total Income:</strong> ${incomeTotal.toLocaleString()}
              </div>
              <button
                onClick={() => setShowIncomeBreakdown((prev) => !prev)}
                className="text-xs text-blue-500 underline mt-1"
              >
                {showIncomeBreakdown ? "Hide" : "Show"} Breakdown
              </button>

              {showIncomeBreakdown && (
                <ul className="ml-4 mt-2 list-disc text-xs">
                  {incomeBreakdown.map((item) => (
                    <li key={item.id}>
                      {item.name} (${item.amount.toFixed(2)}) —{" "}
                      {item.displayDate}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-foreground">
              Fixed Expenses
            </h2>
          </div>
          {isLoadingFixedItems ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <div className="space-y-2">
              {[...fixedItems]
                .flatMap((item) => {
                  // For deferred items, always show (do not skip for defer_to_start)
                  if (item.source === "deferred") {
                    // Show as a single entry, with displayDate as periodStart
                    return [
                      {
                        ...item,
                        displayDate: start,
                        adjustedAmount: item.amount,
                        // Ensure originalForecastStart present
                        originalForecastStart: item.originalForecastStart,
                      },
                    ];
                  }
                  // Skip if an adjustment for this item defers it to another period
                  const skip = adjustments.some(
                    (a) =>
                      a.fixed_item_id === item.id && a.defer_to_start !== null
                  );
                  if (skip) return [];
                  const hitDates = getDueDatesForItem(
                    item,
                    selectedDate,
                    start,
                    end
                  );
                  // Use adjusted amount if present
                  const adjustedAmount =
                    adjustments.find((a) => a.fixed_item_id === item.id)
                      ?.override_amount ?? item.amount;
                  return hitDates.map((hitDate) => ({
                    ...item,
                    displayDate: hitDate,
                    adjustedAmount,
                  }));
                })
                .sort((a, b) => {
                  const aDate =
                    a.displayDate instanceof Date
                      ? a.displayDate
                      : new Date(a.displayDate);
                  const bDate =
                    b.displayDate instanceof Date
                      ? b.displayDate
                      : new Date(b.displayDate);
                  return aDate.getTime() - bDate.getTime();
                })
                .map((item, index) => (
                  <FixedItemForecastModal
                    key={`${item.id}-${index}`}
                    fixedItem={item}
                    // If deferred, use originalFixedItemId and originalForecastStart for modal logic.
                    fixedItemId={
                      item.source === "deferred"
                        ? item.originalFixedItemId ||
                          item.id.replace("-deferred", "")
                        : item.id
                    }
                    forecastStart={
                      item.source === "deferred"
                        ? (item.originalForecastStart ||
                            start?.toISOString().slice(0, 10)) ??
                          ""
                        : start?.toISOString().slice(0, 10) ?? ""
                    }
                    onSaved={refreshAdjustments}
                    trigger={
                      <div
                        className={`flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background hover:bg-muted transition cursor-pointer ${
                          item.source === "deferred" ? "opacity-60 italic" : ""
                        }`}
                        onClick={() => {
                          // Ensure selectedItem (if set anywhere) would include originalForecastStart if deferred
                          // If you have setSelectedItem, ensure you pass through originalForecastStart for deferreds
                        }}
                      >
                        <div className="text-sm font-medium text-foreground flex items-center gap-1">
                          {item.name}
                          {item.source === "deferred" && (
                            <span className="ml-2 text-xs italic text-muted-foreground">
                              (Deferred)
                            </span>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>${item.adjustedAmount.toFixed(2)}</div>
                          <div>
                            {item.displayDate
                              ? `Due ${formatDisplayDate(
                                  new Date(item.displayDate).toISOString()
                                )}`
                              : ""}
                          </div>
                        </div>
                      </div>
                    }
                  />
                ))}
            </div>
          )}
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-foreground">
              Vault Contributions
            </h2>
          </div>
          {!selectedDate ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <div className="space-y-2">
              {[...vaultItems]
                .flatMap((item) => {
                  const starts = item.start_date
                    ? new Date(item.start_date)
                    : null;
                  if (starts && starts > end) return [];
                  // Skip if an adjustment for this item defers it to another period
                  const skip = adjustments.some(
                    (a) =>
                      a.fixed_item_id === item.id && a.defer_to_start !== null
                  );
                  if (skip) return [];
                  const hitDates = getDueDatesForItem(
                    item,
                    selectedDate,
                    start,
                    end
                  );
                  // Use adjusted amount if present
                  const adjustedAmount =
                    adjustments.find((a) => a.fixed_item_id === item.id)
                      ?.override_amount ?? item.amount;
                  return hitDates.map((hitDate) => ({
                    ...item,
                    displayDate: hitDate,
                    adjustedAmount,
                  }));
                })
                .sort((a, b) => {
                  const aDate =
                    a.displayDate instanceof Date
                      ? a.displayDate
                      : new Date(a.displayDate);
                  const bDate =
                    b.displayDate instanceof Date
                      ? b.displayDate
                      : new Date(b.displayDate);
                  return aDate.getTime() - bDate.getTime();
                })
                .map((item, index) => (
                  <FixedItemForecastModal
                    key={`${item.id}-${index}`}
                    fixedItem={item}
                    fixedItemId={
                      item.source === "deferred"
                        ? item.originalFixedItemId ||
                          item.id.replace("-deferred", "")
                        : item.id
                    }
                    forecastStart={
                      item.source === "deferred"
                        ? (item.originalForecastStart ||
                            start?.toISOString().slice(0, 10)) ??
                          ""
                        : start?.toISOString().slice(0, 10) ?? ""
                    }
                    onSaved={refreshAdjustments}
                    trigger={
                      <div className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background hover:bg-muted transition cursor-pointer">
                        <div className="text-sm font-medium text-foreground">
                          {item.name}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>${item.adjustedAmount.toFixed(2)}</div>
                          <div>
                            {item.displayDate
                              ? `Due ${formatDisplayDate(
                                  new Date(item.displayDate).toISOString()
                                )}`
                              : ""}
                          </div>
                        </div>
                      </div>
                    }
                  />
                ))}
            </div>
          )}
        </section>

        {selectedDate && (
          <OneOffSection
            forecastStart={start?.toISOString().slice(0, 10) ?? null}
            onSaved={refreshOneOffs}
          />
        )}

        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Unallocated Balance
          </h2>
          {isLoadingIncome || isLoadingFixedItems ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
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
      </div>
    </AuthGuard>
  );
}
