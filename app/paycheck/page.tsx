"use client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { generatePaycheckDates } from "@/lib/utils/generatePaycheckDates";
import { getPaycheckRange, getIncomeHitDate } from "@/lib/utils/date/paycheck";
import { formatDateRange, formatDisplayDate } from "@/lib/utils/date/format";
import { addDays } from "date-fns";
import { FixedItem } from "@/types";

type PaycheckDate = {
  label: string;
  officialDate: string;
  adjustedDate: string;
};

export default function PaycheckPage() {
  // Removed unused vaultCount
  const [paycheckDates, setPaycheckDates] = useState<PaycheckDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<PaycheckDate | null>(null);

  type IncomeSource = {
    id: string;
    name: string;
    amount: number;
    start_date: string | null;
    frequency?: string;
    due_days?: number[];
  };

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);

  const [fixedItems, setFixedItems] = useState<FixedItem[]>([]);

  // Removed vault count effect (no longer needed)

  // Helper to get due date for a fixed item
  const getDueDateForItem = (
    item: FixedItem,
    selectedDate: PaycheckDate | null,
    start: Date | null,
    end: Date | null
  ): Date | null => {
    if (!selectedDate) return null;
    if (item.frequency?.toLowerCase() === "per paycheck") {
      return new Date(selectedDate.adjustedDate);
    }
    if (start && end) {
      // getIncomeHitDate now returns a Date object or null.
      return getIncomeHitDate(
        {
          // Removed 'name' as it is not part of the expected type
          // Removed 'amount' as it is not part of the expected type
          start_date: item.start_date ?? undefined,
          frequency: item.frequency,
          due_days: item.due_days?.map(String),
        },
        start,
        end
      );
    }
    return null;
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
    (p) => p.adjustedDate === selectedDate?.adjustedDate
  );
  const nextPaycheck =
    currentIndex !== -1 ? paycheckDates[currentIndex + 1] : undefined;

  const { start, end } = useMemo(() => {
    if (!selectedDate) return { start: null, end: null };
    return getPaycheckRange(selectedDate, nextPaycheck);
  }, [selectedDate, nextPaycheck]);

  // State for income total
  const [incomeTotal, setIncomeTotal] = useState<number>(0);

  // Load income from income_sources for the selected period
  useEffect(() => {
    if (!selectedDate || !start || !end) return;

    const periodStart = new Date(selectedDate.adjustedDate);
    const periodEnd = nextPaycheck
      ? new Date(nextPaycheck.adjustedDate)
      : addDays(periodStart, 13);
    periodEnd.setDate(periodEnd.getDate() - 1);

    supabase
      .from("income_sources")
      .select("*")
      .then(({ data }) => {
        if (!data) {
          setIncomeTotal(0);
          setIncomeSources([]);
          return;
        }

        const includedIncome = data
          .filter((row) => {
            const starts = row.start_date ? new Date(row.start_date) : null;
            const isPaycheck = row.name?.toLowerCase().includes("paycheck");
            const hitsInPeriod =
              isPaycheck || getIncomeHitDate(row, periodStart, periodEnd);
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
        setIncomeSources(includedIncome);
      });
  }, [selectedDate, start, end, nextPaycheck]);

  useEffect(() => {
    if (!selectedDate || !start || !end) return;

    const periodStart = new Date(selectedDate.adjustedDate);
    const periodEnd = nextPaycheck
      ? new Date(nextPaycheck.adjustedDate)
      : addDays(periodStart, 13);
    periodEnd.setDate(periodEnd.getDate() - 1);

    supabase
      .from("fixed_items")
      .select("*, frequency")
      .eq("is_income", false)
      .then(({ data }) => {
        if (!data) {
          setFixedItems([]);
          return;
        }

        const items = data
          .filter((row) => {
            const starts = row.start_date ? new Date(row.start_date) : null;
            const isPerPaycheck =
              row.frequency?.toLowerCase() === "per paycheck";
            const hits =
              isPerPaycheck || getIncomeHitDate(row, periodStart, periodEnd);
            return (!starts || starts <= periodEnd) && hits;
          })
          .sort(
            (a, b) =>
              new Date(a.start_date ?? "1970-01-01").getTime() -
              new Date(b.start_date ?? "1970-01-01").getTime()
          );

        setFixedItems(items);
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
          {!selectedDate || !start || !end ? (
            <div className="text-sm text-muted-foreground">
              Select a paycheck to begin planning.
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
                  {incomeSources.map((source) => {
                    // Always display dates using formatDisplayDate for consistency
                    const displayDate = (() => {
                      if (source.name === "Paycheck") {
                        return formatDisplayDate(selectedDate.adjustedDate);
                      }
                      const hit = getIncomeHitDate(
                        {
                          ...source,
                          due_days: source.due_days?.map(String),
                          start_date: source.start_date ?? undefined,
                        },
                        start,
                        end
                      );
                      return hit ? formatDisplayDate(hit.toISOString()) : "";
                    })();
                    return (
                      <li key={source.id}>
                        {source.name} (${source.amount.toFixed(2)})
                        {displayDate ? ` — ${displayDate}` : ""}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Fixed Expenses
          </h2>
          {!selectedDate ? (
            <div className="text-sm text-muted-foreground">
              Select a paycheck to view.
            </div>
          ) : (
            <ul className="ml-4 mt-2 list-disc text-sm">
              {[...fixedItems]
                .map((item) => {
                  // Calculate hitDate once
                  const hitDate =
                    item.frequency?.toLowerCase() === "per paycheck"
                      ? new Date(`${selectedDate.adjustedDate}T00:00:00`)
                      : getDueDateForItem(item, selectedDate, start, end);

                  const displayDate =
                    item.frequency?.toLowerCase() === "per paycheck"
                      ? new Date(`${selectedDate.adjustedDate}T00:00:00`)
                      : getDueDateForItem(item, selectedDate, start, end);

                  // Debug frequency logic with detailed info
                  console.log("🧪 Checking frequency logic:", {
                    name: item.name,
                    frequency: item.frequency,
                    start_date: item.start_date,
                    due_days: item.due_days,
                    resultHitDate: hitDate,
                  });

                  console.log(
                    "📅 Final displayDate:",
                    item.name,
                    displayDate?.toISOString?.()
                  );

                  return {
                    ...item,
                    dueDate: hitDate,
                    displayDate: displayDate,
                  };
                })
                .sort((a, b) => {
                  const aDate =
                    a.displayDate instanceof Date
                      ? a.displayDate
                      : a.displayDate
                      ? new Date(a.displayDate)
                      : new Date();
                  const bDate =
                    b.displayDate instanceof Date
                      ? b.displayDate
                      : b.displayDate
                      ? new Date(b.displayDate)
                      : new Date();
                  return aDate.getTime() - bDate.getTime();
                })
                .map((item) => (
                  <li key={item.id}>
                    {item.name} (${item.amount.toFixed(2)})
                    {item.displayDate
                      ? ` — due ${formatDisplayDate(
                          new Date(item.displayDate).toISOString()
                        )}`
                      : ""}
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
            <div className="text-sm text-muted-foreground">
              Select a paycheck to view.
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              [Placeholder for content related to {selectedDate.adjustedDate}]
            </div>
          )}
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Unallocated Balance
          </h2>
          {!selectedDate ? (
            <div className="text-sm text-muted-foreground">
              Select a paycheck to view.
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              [Placeholder for content related to {selectedDate.adjustedDate}]
            </div>
          )}
        </section>
      </div>
    </AuthGuard>
  );
}
