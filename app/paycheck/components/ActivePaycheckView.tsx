"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { formatDisplayDate, formatDateRange } from "@/lib/utils/date/format";
import { generatePaycheckDates } from "@/lib/utils/generatePaycheckDates";
import { getPaycheckRange } from "@/lib/utils/date/paycheck";
import type { Database } from "@/types/supabase";

interface ActivePaycheckViewProps {
  paycheckId: string;
}

// Minimal row types for selects
type PaycheckRecord = {
  id: string;
  paycheck_date: string;
  approved: boolean | null;
};

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: { name: string | null } | null;
  vaults: { name: string | null } | null;
};

type VaultContributionRow =
  Database["public"]["Tables"]["vault_contributions"]["Row"] & {
    vaults: { name: string | null } | null;
  };

type IncomeRecordRow = Database["public"]["Tables"]["income_records"]["Row"];

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"] & {
  vaults: { name: string | null } | null;
};

export default function ActivePaycheckView({
  paycheckId,
}: ActivePaycheckViewProps) {
  const [paycheck, setPaycheck] = useState<PaycheckRecord | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [vaults, setVaults] = useState<VaultContributionRow[]>([]);
  const [income, setIncome] = useState<IncomeRecordRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [paycheckDate, setPaycheckDate] = useState<string | null>(null);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  // Load paycheck record
  useEffect(() => {
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

  // Compute pay period range
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
    const next = currentIndex !== -1 ? all[currentIndex + 1] : undefined;
    if (!found) {
      setStart(null);
      setEnd(null);
      return;
    }
    const { start, end } = getPaycheckRange(found, next);
    setStart(start);
    setEnd(end);
  }, [paycheckDate]);

  // Fetch data for paycheck
  useEffect(() => {
    async function load() {
      if (!paycheckId) return;
      setLoading(true);
      const { data: exp } = await supabase
        .from("expenses")
        .select("*, categories(name), vaults(name)")
        .eq("paycheck_id", paycheckId)
        .returns<ExpenseRow[]>();
      setExpenses(exp ?? []);

      const { data: vc } = await supabase
        .from("vault_contributions")
        .select("*, vaults(name)")
        .eq("paycheck_id", paycheckId)
        .returns<VaultContributionRow[]>();
      setVaults(vc ?? []);

      const { data: inc } = await supabase
        .from("income_records")
        .select("*")
        .eq("paycheck_id", paycheckId)
        .returns<IncomeRecordRow[]>();
      setIncome(inc ?? []);

      if (start && end) {
        const { data: txns } = await supabase
          .from("transactions")
          .select("*, vaults(name)")
          .gte("posted_at", start.toISOString())
          .lte("posted_at", end.toISOString())
          .returns<TransactionRow[]>();
        setTransactions(txns ?? []);
      }

      setLoading(false);
    }
    load();
  }, [paycheckId, start, end]);

  const incomeTotal = useMemo(
    () => income.reduce((sum, i) => sum + (i.amount ?? 0), 0),
    [income]
  );
  const expenseTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [expenses]
  );
  const vaultTotal = useMemo(
    () => vaults.reduce((sum, v) => sum + (v.amount ?? 0), 0),
    [vaults]
  );
  const remaining = incomeTotal - expenseTotal - vaultTotal;

  // Placeholder matching logic - in future this will look at linked transaction ids
  const matchedTxns: TransactionRow[] = [];
  const unmatchedTxns = transactions;

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
        {/* Summary */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">Paycheck Summary</h2>
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
              <strong>Total Income:</strong> ${incomeTotal.toFixed(2)}
            </div>
            <div>
              <strong>Total Allocated:</strong> ${(expenseTotal + vaultTotal).toFixed(2)}
            </div>
            <div>
              <strong>Remaining Balance:</strong> ${remaining.toFixed(2)}
            </div>
          </div>
        </section>

        {/* Income Breakdown */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">Income</h2>
          {income.length === 0 ? (
            <div className="text-sm text-muted-foreground">No income records</div>
          ) : (
            <div className="space-y-2">
              {income.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background"
                >
                  <div className="text-sm font-medium text-foreground">
                    {item.source}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>${Number(item.amount).toFixed(2)}</div>
                    {item.received_date && (
                      <div className="text-xs">{formatDisplayDate(item.received_date)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Expenses */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">Expenses</h2>
          {expenses.length === 0 ? (
            <div className="text-sm text-muted-foreground">None</div>
          ) : (
            <div className="space-y-2">
              {expenses.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background"
                >
                  <div className="text-sm font-medium text-foreground">
                    {item.label}
                    {item.origin === "oneoff" && (
                      <span className="ml-2 text-xs text-purple-500">(One-Off)</span>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>${Number(item.amount).toFixed(2)}</div>
                    {item.expense_date && (
                      <div className="text-xs">{formatDisplayDate(item.expense_date)}</div>
                    )}
                    {item.categories?.name && (
                      <div className="text-xs">{item.categories.name}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Vault Contributions */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">Vault Contributions</h2>
          {vaults.length === 0 ? (
            <div className="text-sm text-muted-foreground">None</div>
          ) : (
            <div className="space-y-2">
              {vaults.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background"
                >
                  <div className="text-sm font-medium text-foreground">
                    {item.vaults?.name ?? ""}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>${Number(item.amount).toFixed(2)}</div>
                    {item.contribution_date && (
                      <div className="text-xs">{formatDisplayDate(item.contribution_date)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Transactions Log */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">Transactions</h2>
          {transactions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No transactions</div>
          ) : (
            <div className="space-y-4">
              {/* Matched */}
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">Matched</h3>
                {matchedTxns.length === 0 && (
                  <div className="text-xs text-muted-foreground">None</div>
                )}
                {matchedTxns.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-green-50 dark:bg-green-900/20"
                  >
                    <div className="text-sm font-medium text-foreground">
                      {t.description}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>${Number(t.amount).toFixed(2)}</div>
                      {t.posted_at && (
                        <div className="text-xs">{formatDisplayDate(t.posted_at)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Unmatched */}
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">Unmatched</h3>
                {unmatchedTxns.length === 0 && (
                  <div className="text-xs text-muted-foreground">None</div>
                )}
                {unmatchedTxns.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background"
                  >
                    <div className="text-sm font-medium text-foreground">
                      {t.description}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>${Number(t.amount).toFixed(2)}</div>
                      {t.posted_at && (
                        <div className="text-xs">{formatDisplayDate(t.posted_at)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </AuthGuard>
  );
}
