"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { formatDisplayDate, formatDateRange } from "@/lib/utils/date/format";
import { generatePaycheckDates } from "@/lib/utils/generatePaycheckDates";
import { getPaycheckRange } from "@/lib/utils/date/paycheck";
import type { Database } from "@/types/supabase";

interface ApprovedBudgetViewProps {
  paycheckId: string;
}

type PaycheckRecord = {
  id: string;
  paycheck_date: string;
  approved?: boolean | null;
};

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: { name: string | null } | null;
};

type VaultContribution =
  Database["public"]["Tables"]["vault_contributions"]["Row"] & {
    vaults: { name: string | null } | null;
  };

type IncomeSourceRow = Database["public"]["Tables"]["income_sources"]["Row"];

export default function ApprovedBudgetView({
  paycheckId,
}: ApprovedBudgetViewProps) {
  // Data state
  const [paycheck, setPaycheck] = useState<PaycheckRecord | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [vaults, setVaults] = useState<VaultContribution[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);

  // For date range
  const [paycheckDate, setPaycheckDate] = useState<string | null>(null);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  // Fetch paycheck record (get the date)
  useEffect(() => {
    setLoading(true);
    supabase
      .from("paychecks")
      .select("id, paycheck_date, approved")
      .eq("id", paycheckId)
      .single()
      .then(({ data }) => {
        if (data) {
          setPaycheck(data as PaycheckRecord);
          setPaycheckDate(data.paycheck_date);
        }
      });
  }, [paycheckId]);

  // Compute pay period range using generatePaycheckDates and getPaycheckRange (parity with BudgetPlanningForm)
  useEffect(() => {
    if (!paycheckDate) return;
    const all = generatePaycheckDates(
      new Date("2025-01-01"),
      new Date("2026-01-01")
    );
    const found = all.find((p) => p.adjustedDate === paycheckDate);
    const currentIndex = found
      ? all.findIndex((p) => p.officialDate === found.officialDate)
      : -1;
    const nextPaycheck =
      currentIndex !== -1 ? all[currentIndex + 1] : undefined;
    if (!found) {
      setStart(null);
      setEnd(null);
      return;
    }
    const { start, end } = getPaycheckRange(found, nextPaycheck);
    setStart(start);
    setEnd(end);
  }, [paycheckDate]);

  // Fetch all budget data for this paycheckId
  useEffect(() => {
    async function fetchData() {
      if (!paycheckId) return;
      setLoading(true);
      // Expenses (with categories, include expense_date)
      const { data: exp } = await supabase
        .from("expenses")
        .select("*, categories(name), expense_date")
        .eq("paycheck_id", paycheckId)
        .returns<ExpenseRow[]>();
      setExpenses(exp ?? []);
      // Vault contributions (with vaults, include contribution_date)
      const { data: vc } = await supabase
        .from("vault_contributions")
        .select("*, vaults(name)")
        .eq("paycheck_id", paycheckId)
        .returns<VaultContribution[]>();
      setVaults(vc ?? []);
      setLoading(false);
    }
    fetchData();
  }, [paycheckId]);

  // Fetch income sources for this period
  useEffect(() => {
    async function fetchIncomeSources() {
      if (!start || !end) return;
      const { data } = await supabase.from("income_sources").select("*");
      if (!data) {
        setIncomeSources([]);
        return;
      }
      // Filter by start_date if present and if it falls before end
      const included = data.filter((row) => {
        const starts = row.start_date ? new Date(row.start_date) : null;
        return !starts || starts <= end;
      });
      setIncomeSources(included);
    }
    fetchIncomeSources();
  }, [start, end]);

  // Combine all expenses (fixed + one-off) sorted by expense_date
  const allExpenses = useMemo(() => {
    return [...expenses].sort(
      (a, b) =>
        new Date(a.expense_date ?? "").getTime() -
        new Date(b.expense_date ?? "").getTime()
    );
  }, [expenses]);

  // Fetch income records for this paycheck
  const [incomeRecords, setIncomeRecords] = useState<
    {
      id: string;
      user_id: string | null;
      paycheck_id: string | null;
      source: string | null;
      amount: number;
      received_date: string | null;
      forecast_oneoff_id: string | null;
      income_source_id: string | null;
      created_at: string | null;
    }[]
  >([]);
  useEffect(() => {
    if (!paycheckId) return;
    supabase
      .from("income_records")
      .select("*")
      .eq("paycheck_id", paycheckId)
      .then(({ data }) => setIncomeRecords(data ?? []));
  }, [paycheckId]);

  // Income summary: use income_records if present, else fallback to incomeSources
  const incomeBreakdown = useMemo(() => {
    if (incomeRecords.length > 0) {
      return incomeRecords.map((rec) => ({
        id: rec.id,
        name: rec.source ?? "",
        amount: rec.amount,
        displayDate: rec.received_date
          ? formatDisplayDate(rec.received_date)
          : "",
      }));
    }
    // fallback to planned
    if (!paycheckDate) return [];
    return incomeSources.map((source) => ({
      id: source.id,
      name: source.name,
      amount: source.amount,
      displayDate: formatDisplayDate(paycheckDate),
    }));
  }, [incomeRecords, incomeSources, paycheckDate]);

  const incomeTotal = useMemo(
    () => incomeBreakdown.reduce((sum, s) => sum + (s.amount ?? 0), 0),
    [incomeBreakdown]
  );

  // Fixed expense total (for backward compatibility)
  const fixedExpensesTotal = useMemo(
    () =>
      expenses
        .filter((e) => e.origin !== "oneoff")
        .reduce((sum, i) => sum + (i.amount ?? 0), 0),
    [expenses]
  );
  // Vault total
  const vaultContributionsTotal = useMemo(
    () => vaults.reduce((sum, i) => sum + (i.amount ?? 0), 0),
    [vaults]
  );
  // One-off expense total (for backward compatibility)
  const oneOffExpenseTotal = useMemo(
    () =>
      expenses
        .filter((e) => e.origin === "oneoff")
        .reduce((sum, i) => sum + (i.amount ?? 0), 0),
    [expenses]
  );
  // Unallocated balance
  const unallocatedBalance =
    incomeTotal -
    fixedExpensesTotal -
    vaultContributionsTotal -
    oneOffExpenseTotal;

  // Loading state
  if (!paycheck || !paycheckDate || loading) {
    return (
      <AuthGuard>
        <p className="text-muted-foreground">Loading...</p>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Income Summary */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Income Summary
          </h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>
              <strong>Paycheck Date:</strong> {formatDisplayDate(paycheckDate)}
            </div>
            {start && end && (
              <div>
                <strong>Pay Period:</strong>{" "}
                {formatDateRange(start.toISOString(), end.toISOString())}
              </div>
            )}
            <div>
              <strong>Total Income:</strong> $
              {incomeTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <button
              onClick={() => setShowIncomeBreakdown((p) => !p)}
              className="text-xs text-blue-500 underline mt-1"
              type="button"
            >
              {showIncomeBreakdown ? "Hide" : "Show"} Breakdown
            </button>
            {showIncomeBreakdown && (
              <ul className="ml-4 mt-2 list-disc text-xs">
                {incomeBreakdown.map((i) => (
                  <li key={i.id}>
                    {i.name} (${i.amount?.toFixed(2)}) — {i.displayDate}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Expenses */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-foreground">Expenses</h2>
          </div>
          <div className="space-y-2">
            {allExpenses.length === 0 && (
              <div className="text-sm text-muted-foreground">None</div>
            )}
            {allExpenses.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background"
              >
                <div className="text-sm font-medium text-foreground">
                  {item.label}
                  {item.origin === "oneoff" && (
                    <span className="ml-2 text-xs text-purple-500">
                      (One-Off)
                    </span>
                  )}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>${Number(item.amount).toFixed(2)}</div>
                  {item.expense_date && (
                    <div className="text-xs">
                      {formatDisplayDate(item.expense_date)}
                    </div>
                  )}
                  {item.categories?.name && (
                    <div className="text-xs">{item.categories.name}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vault Contributions */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-foreground">
              Vault Contributions
            </h2>
          </div>
          <div className="space-y-2">
            {vaults.length === 0 && (
              <div className="text-sm text-muted-foreground">None</div>
            )}
            {vaults.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background"
              >
                <div className="text-sm font-medium text-foreground">
                  {item.vaults?.name ?? ""}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>${Number(item.amount).toFixed(2)}</div>
                  {item.contribution_date && (
                    <div className="text-xs">
                      {formatDisplayDate(item.contribution_date)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Unallocated Balance */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Unallocated Balance
          </h2>
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
        </section>
      </div>
    </AuthGuard>
  );
}
