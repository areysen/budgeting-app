// @ts-nocheck
"use client";
import { normalizeFixedItem } from "@/lib/utils/fixedItem";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { generatePaycheckDates } from "@/lib/utils/generatePaycheckDates";
import { getPaycheckRange, getIncomeHitDate } from "@/lib/utils/date/paycheck";
import { formatDateRange, formatDisplayDate } from "@/lib/utils/date/format";
import { FixedItem, Deferral } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

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

  const [fixedItems, setFixedItems] = useState<(FixedItem & { deferred?: boolean; carriedOver?: boolean })[]>([]);
  const [vaultItems, setVaultItems] = useState<(FixedItem & { deferred?: boolean; carriedOver?: boolean })[]>([]);
  const [currentDeferrals, setCurrentDeferrals] = useState<Deferral[]>([]);
  const [prevDeferrals, setPrevDeferrals] = useState<Deferral[]>([]);

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

    // 🧠 Hit Date Check Triggered For:
    console.log("🧠 Hit Date Check Triggered For:", {
      name: item.name,
      frequency: item.frequency,
      due_days: item.due_days,
      weekly_day: item.weekly_day,
      start_date: item.start_date,
      start: start.toISOString(),
      end: end.toISOString(),
    });

    // Additional log for monthly candidate date
    if (item.frequency === "monthly") {
      const monthDate = new Date(start);
      monthDate.setDate(parseInt(item.due_days?.[0] || "1"));
      console.log("🧪 Monthly candidate date:", monthDate.toISOString());
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

  const handleToggleDeferral = async (itemId: string, isDeferred: boolean) => {
    if (!selectedDate) return;
    if (isDeferred) {
      await supabase
        .from("deferrals")
        .delete()
        .match({ paycheck_id: selectedDate.officialDate, fixed_item_id: itemId });
    } else {
      await supabase
        .from("deferrals")
        .insert([{ paycheck_id: selectedDate.officialDate, fixed_item_id: itemId }]);
    }
    const { data } = await supabase
      .from("deferrals")
      .select("id, fixed_item_id, paycheck_id")
      .eq("paycheck_id", selectedDate.officialDate);
    setCurrentDeferrals(data ?? []);
  };

  // Compute current and next paycheck range and formatted label
  const currentIndex = paycheckDates.findIndex(
    (p) => p.officialDate === selectedDate?.officialDate
  );
  let nextPaycheck =
    currentIndex !== -1 ? paycheckDates[currentIndex + 1] : undefined;
  const prevPaycheck =
    currentIndex > 0 ? paycheckDates[currentIndex - 1] : undefined;

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

  // Load deferrals for the current and previous paycheck
  useEffect(() => {
    if (!selectedDate) return;
    async function fetchDeferrals() {
      const { data: curr } = await supabase
        .from("deferrals")
        .select("id, fixed_item_id, paycheck_id")
        .eq("paycheck_id", selectedDate.officialDate);
      setCurrentDeferrals(curr ?? []);
      if (prevPaycheck) {
        const { data: prev } = await supabase
          .from("deferrals")
          .select("id, fixed_item_id, paycheck_id")
          .eq("paycheck_id", prevPaycheck.officialDate);
        setPrevDeferrals(prev ?? []);
      } else {
        setPrevDeferrals([]);
      }
    }
    fetchDeferrals();
  }, [selectedDate, prevPaycheck]);

  const { start, end } = useMemo(() => {
    if (!selectedDate) return { start: null, end: null };
    return getPaycheckRange(selectedDate, nextPaycheck);
  }, [selectedDate, nextPaycheck]);

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
      .filter((item) => !currentDeferrals.some((d) => d.fixed_item_id === item.id))
      .flatMap((item) => {
        const hitDates = getDueDatesForItem(item, selectedDate, start, end);
        return hitDates.map(() => item.amount);
      })
      .reduce((sum, amount) => sum + amount, 0);
  }, [fixedItems, selectedDate, start, end, currentDeferrals]);

  const vaultContributionsTotal = useMemo(() => {
    return vaultItems
      .filter((item) => !currentDeferrals.some((d) => d.fixed_item_id === item.id))
      .flatMap((item) => {
        const starts = item.start_date ? new Date(item.start_date) : null;
        if (starts && starts > end) return [];
        const hitDates = getDueDatesForItem(item, selectedDate, start, end);
        return hitDates.map(() => item.amount);
      })
      .reduce((sum, amount) => sum + amount, 0);
  }, [vaultItems, selectedDate, start, end, currentDeferrals]);

  const unallocatedBalance =
    incomeTotal - fixedExpensesTotal - vaultContributionsTotal;

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
  }, [selectedDate, start, end, nextPaycheck, currentDeferrals, prevDeferrals]);

  useEffect(() => {
    if (!selectedDate || !start || !end) return;

    setIsLoadingFixedItems(true);

    const periodStart = start;
    const periodEnd = end;

    supabase
      .from("fixed_items")
      .select("*, frequency, categories(name)")
      .then(({ data }) => {
        if (!data) {
          setFixedItems([]);
          setIsLoadingFixedItems(false);
          return;
        }

        // Normalize each fixed item
        const normalizedItems = data.map(normalizeFixedItem);

        // Vault contributions: filter by related category name "vault"
        const vaultContributions = normalizedItems
          .filter((row) => row.categories?.name?.trim().toLowerCase() === "vault")
          .map((row) => ({
            ...row,
            deferred: currentDeferrals.some((d) => d.fixed_item_id === row.id),
            carriedOver: prevDeferrals.some((d) => d.fixed_item_id === row.id),
          }));

        // Fixed Expenses: exclude items with related category name "vault"
        const items = normalizedItems
          .filter((row) => {
            const isVault =
              row.categories?.name?.trim().toLowerCase() === "vault";
            if (isVault) return false;

            // 🧠 Hit Date Check Triggered For:
            console.log("🧠 Hit Date Check Triggered For:", {
              name: row.name,
              frequency: row.frequency,
              due_days: row.due_days,
              weekly_day: row.weekly_day,
              start_date: row.start_date,
              start: periodStart.toISOString(),
              end: periodEnd.toISOString(),
            });
            if (row.frequency === "monthly") {
              const monthDate = new Date(periodStart);
              monthDate.setDate(parseInt(row.due_days?.[0] || "1"));
              console.log(
                "🧪 Monthly candidate date:",
                monthDate.toISOString()
              );
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

            console.log("🧾 Evaluating Fixed Item:", {
              name: row.name,
              isPerPaycheck,
              start_date: starts,
              periodStart,
              periodEnd,
              hitDates: hitDates.map((d: Date) => d.toISOString?.() ?? d),
              include: (!starts || starts <= periodEnd) && hits,
            });

            const include = (!starts || starts <= periodEnd) && (hits || prevDeferrals.some((d) => d.fixed_item_id === row.id));
            return include;
          })
          .map((row) => ({
            ...row,
            deferred: currentDeferrals.some((d) => d.fixed_item_id === row.id),
            carriedOver: prevDeferrals.some((d) => d.fixed_item_id === row.id),
          }))
          .sort(
            (a, b) =>
              new Date(a.start_date ?? "1970-01-01").getTime() -
              new Date(b.start_date ?? "1970-01-01").getTime()
          );

        setFixedItems(items);
        setVaultItems(vaultContributions);
        setIsLoadingFixedItems(false);
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
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Fixed Expenses
          </h2>
          {isLoadingFixedItems ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <ul className="ml-4 mt-2 list-disc text-sm space-y-1">
              {[...fixedItems]
                .flatMap((item) => {
                  const hitDates = getDueDatesForItem(
                    item,
                    selectedDate,
                    start,
                    end
                  );
                  if (hitDates.length === 0 && (item as any).carriedOver) {
                    return [{ ...item, displayDate: start }];
                  }
                  return hitDates.map((hitDate) => ({
                    ...item,
                    displayDate: hitDate,
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
                  <li key={`${item.id}-${index}`} className="flex justify-between gap-2">
                    <span>
                      {item.name} (${item.amount.toFixed(2)})
                      {item.displayDate
                        ? ` — due ${formatDisplayDate(
                            new Date(item.displayDate).toISOString()
                          )}`
                        : ""}
                    </span>
                    <span className="flex items-center gap-2">
                      {(item as any).carriedOver && (
                        <span className="text-xs text-emerald-600">Carried Over</span>
                      )}
                      {(item as any).deferred && (
                        <span className="text-xs text-orange-600">Deferred ⏩</span>
                      )}
                      <button
                        onClick={() => handleToggleDeferral(item.id, (item as any).deferred)}
                        className="text-xs text-blue-500 underline"
                      >
                        {(item as any).deferred ? "Undo Deferral" : "Defer to Next Paycheck"}
                      </button>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Vault Contributions
          </h2>
          {!selectedDate ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <ul className="ml-4 mt-2 list-disc text-sm space-y-1">
              {[...vaultItems]
                .flatMap((item) => {
                  const starts = item.start_date ? new Date(item.start_date) : null;
                  if (starts && starts > end) return [];
                  const hitDates = getDueDatesForItem(
                    item,
                    selectedDate,
                    start,
                    end
                  );
                  if (hitDates.length === 0 && (item as any).carriedOver) {
                    return [{ ...item, displayDate: start }];
                  }
                  return hitDates.map((hitDate) => ({
                    ...item,
                    displayDate: hitDate,
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
                  <li key={`${item.id}-${index}`} className="flex justify-between gap-2">
                    <span>
                      {item.name} (${item.amount.toFixed(2)})
                      {item.displayDate
                        ? ` — due ${formatDisplayDate(
                            new Date(item.displayDate).toISOString()
                          )}`
                        : ""}
                    </span>
                    <span className="flex items-center gap-2">
                      {(item as any).carriedOver && (
                        <span className="text-xs text-emerald-600">Carried Over</span>
                      )}
                      {(item as any).deferred && (
                        <span className="text-xs text-orange-600">Deferred ⏩</span>
                      )}
                      <button
                        onClick={() => handleToggleDeferral(item.id, (item as any).deferred)}
                        className="text-xs text-blue-500 underline"
                      >
                        {(item as any).deferred ? "Undo Deferral" : "Defer to Next Paycheck"}
                      </button>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>

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
            <div className="text-sm text-muted-foreground">
              ${unallocatedBalance.toFixed(2)} available
            </div>
          )}
        </section>
      </div>
    </AuthGuard>
  );
}
