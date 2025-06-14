"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { formatDisplayDate, formatDateRange } from "@/lib/utils/date/format";
import { generatePaycheckDates } from "@/lib/utils/generatePaycheckDates";
import { getPaycheckRange } from "@/lib/utils/date/paycheck";
import type { Database } from "@/types/supabase";
import VaultActivityList from "@/components/vaults/VaultActivityList";

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
  // Add transaction_id for one-to-one matching (nullable)
  transaction_id?: string | null;
};

type VaultContributionRow =
  Database["public"]["Tables"]["vault_contributions"]["Row"] & {
    vaults: { name: string | null } | null;
  };

type IncomeRecordRow = Database["public"]["Tables"]["income_records"]["Row"];

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"] & {
  vaults: { name: string | null } | null;
  // Add source for constraint tracking
  source?: "manual" | "plaid" | "from_expense" | string | null;
};

// ExpenseTransactionLink: for many-to-one/partial matches
type ExpenseTransactionLink = {
  id: string;
  expense_id: string;
  transaction_id: string;
  matched_amount: number;
  created_at: string | null;
};

export default function ActivePaycheckView({
  paycheckId,
}: ActivePaycheckViewProps) {
  const [paycheck, setPaycheck] = useState<PaycheckRecord | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [vaults, setVaults] = useState<VaultContributionRow[]>([]);
  const [income, setIncome] = useState<IncomeRecordRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [expenseTransactionLinks, setExpenseTransactionLinks] = useState<
    ExpenseTransactionLink[]
  >([]);
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

  // Fetch data for paycheck, including expense_transaction_links
  useEffect(() => {
    async function load() {
      if (!paycheckId) return;
      setLoading(true);
      const { data: exp } = await supabase
        .from("expenses")
        .select("*, categories(name), vaults(name), transaction_id")
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
          .select("*, vaults(name), source")
          .gte("posted_at", start.toISOString())
          .lte("posted_at", end.toISOString())
          .returns<TransactionRow[]>();
        setTransactions(txns ?? []);
      }

      // Fetch expense_transaction_links for this paycheck's expenses
      // First, get all expense ids for this paycheck
      let expenseIds: string[] = [];
      if (exp && Array.isArray(exp)) {
        expenseIds = exp.map((e) => e.id);
      }
      if (expenseIds.length > 0) {
        const { data: links } = await supabase
          .from("expense_transaction_links")
          .select("*")
          .in("expense_id", expenseIds)
          .returns<ExpenseTransactionLink[]>();
        setExpenseTransactionLinks(links ?? []);
      } else {
        setExpenseTransactionLinks([]);
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

  // Matching logic: use expense_transaction_links and transaction_id (one-to-one) from expenses
  // Build sets of matched transaction IDs
  const matchedTransactionIds = useMemo(() => {
    // From expense_transaction_links
    const linkTxnIds = new Set(
      expenseTransactionLinks.map((l) => l.transaction_id)
    );
    // From one-to-one expense.transaction_id
    expenses.forEach((e) => {
      if (e.transaction_id) linkTxnIds.add(e.transaction_id);
    });
    return linkTxnIds;
  }, [expenseTransactionLinks, expenses]);

  const matchedTxns = useMemo(
    () => transactions.filter((t) => t.id && matchedTransactionIds.has(t.id)),
    [transactions, matchedTransactionIds]
  );
  const unmatchedTxns = useMemo(
    () => transactions.filter((t) => !t.id || !matchedTransactionIds.has(t.id)),
    [transactions, matchedTransactionIds]
  );

  // Sort expenses by expense_date ascending for rendering
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort(
      (a, b) =>
        new Date(a.expense_date ?? "").getTime() -
        new Date(b.expense_date ?? "").getTime()
    );
  }, [expenses]);

  // Expense status counts
  const paidCount = useMemo(
    () => expenses.filter((e) => e.status === "paid").length,
    [expenses]
  );
  const unpaidCount = useMemo(
    () => expenses.filter((e) => e.status !== "paid").length,
    [expenses]
  );
  const totalCount = expenses.length;

  const paycheckVaults = useMemo(() => {
    const map = new Map<string, string>();
    vaults.forEach((v) => map.set(v.vault_id, v.vaults?.name ?? ""));
    expenses.forEach((e) => {
      if (e.vault_id) map.set(e.vault_id, e.vaults?.name ?? "");
    });
    return Array.from(map.entries());
  }, [vaults, expenses]);

  async function handleMarkAsPaid(id: string) {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;

    const prevStatus = expense.status;
    // Optimistically mark as paid in local state
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "paid" } : e))
    );

    const { error: statusError } = await supabase
      .from("expenses")
      .update({ status: "paid" })
      .eq("id", id);

    if (statusError) {
      // Revert if error
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, status: prevStatus ?? e.status } : e
        )
      );
      return;
    }

    // Create transaction if one doesn't exist
    if (!expense.transaction_id) {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id ?? null;

      const { data: txn, error: txnError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId ?? "default_user_id",
          vault_id: expense.vault_id,
          amount: expense.amount,
          description: expense.label,
          source: "manual",
          posted_at: new Date().toISOString().slice(0, 10),
          category_id: expense.category_id,
        })
        .select("*")
        .single();

      if (!txnError && txn) {
        if (txn.vault_id) {
          await supabase.from("vault_activity").insert({
            user_id: userId ?? "default_user_id",
            vault_id: txn.vault_id,
            amount: -txn.amount,
            activity_date:
              txn.posted_at ?? new Date().toISOString().slice(0, 10),
            source: "transaction",
            related_id: txn.id,
            notes: "Spent from vault",
          });
        }
        await supabase
          .from("expenses")
          .update({ transaction_id: txn.id })
          .eq("id", expense.id);

        // Update local expense record and transactions list
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, transaction_id: txn.id, status: "paid" } : e
          )
        );
        setTransactions((prev) => [...prev, { ...txn, vaults: null }]);

        const { data: link } = await supabase
          .from("expense_transaction_links")
          .insert({
            expense_id: expense.id,
            transaction_id: txn.id,
            matched_amount: expense.amount,
          })
          .select("*")
          .single();

        if (link) {
          setExpenseTransactionLinks((prev) => [...prev, link]);
        }
      }
    }
  }

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
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Paycheck Summary
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
              <strong>Total Income:</strong> ${incomeTotal.toFixed(2)}
            </div>
            <div>
              <strong>Total Allocated:</strong> $
              {(expenseTotal + vaultTotal).toFixed(2)}
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
            <div className="text-sm text-muted-foreground">
              No income records
            </div>
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
                      <div className="text-xs">
                        {formatDisplayDate(item.received_date)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Expenses */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Expenses
          </h2>
          <div className="text-sm text-muted-foreground mb-2">
            {totalCount} items — {paidCount} paid / {unpaidCount} unpaid
          </div>
          {sortedExpenses.length === 0 ? (
            <div className="text-sm text-muted-foreground">None</div>
          ) : (
            <div className="space-y-2">
              {sortedExpenses.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background"
                >
                  <div className="text-sm font-medium text-foreground flex items-center">
                    {item.label}
                    {item.origin === "oneoff" && (
                      <span className="ml-2 text-xs text-purple-500">
                        (One-Off)
                      </span>
                    )}
                    {item.status === "paid" ? (
                      <span className="ml-2 text-xs text-green-600">
                        ✔ Paid
                      </span>
                    ) : (
                      <>
                        <span className="ml-2 text-xs text-yellow-600">
                          🟡 Planned
                        </span>
                        <button
                          onClick={() => handleMarkAsPaid(item.id)}
                          className="ml-2 text-xs text-blue-500 underline"
                          type="button"
                        >
                          Mark as Paid
                        </button>
                      </>
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
          )}
        </section>

        {/* Vault Contributions */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Vault Contributions
          </h2>
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
                      <div className="text-xs">
                        {formatDisplayDate(item.contribution_date)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Transactions Log */}
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Transactions
          </h2>
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
                {matchedTxns.map((t) => {
                  // Find all links for this transaction
                  const links = expenseTransactionLinks.filter(
                    (l) => l.transaction_id === t.id
                  );
                  // Find direct expense match (one-to-one)
                  const directExpense = expenses.find(
                    (e) => e.transaction_id === t.id
                  );
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-green-50 dark:bg-green-900/20"
                    >
                      <div className="text-sm font-medium text-foreground">
                        {t.description}
                        {/* Show source if present */}
                        {t.source && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            [{t.source}]
                          </span>
                        )}
                        {/* Show linked expense(s) */}
                        {links.length > 0 && (
                          <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Linked to expense{links.length > 1 ? "s" : ""}:{" "}
                            {links
                              .map((l) => {
                                const exp = expenses.find(
                                  (e) => e.id === l.expense_id
                                );
                                return exp
                                  ? `${exp.label} ($${l.matched_amount})`
                                  : l.expense_id;
                              })
                              .join(", ")}
                          </div>
                        )}
                        {directExpense && (
                          <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Linked to expense: {directExpense.label} (full
                            match)
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>${Number(t.amount).toFixed(2)}</div>
                        {t.posted_at && (
                          <div className="text-xs">
                            {formatDisplayDate(t.posted_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                      {t.source && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          [{t.source}]
                        </span>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>${Number(t.amount).toFixed(2)}</div>
                      {t.posted_at && (
                        <div className="text-xs">
                          {formatDisplayDate(t.posted_at)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {paycheckVaults.length > 0 && (
          <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Vault Activity
            </h2>
            {paycheckVaults.map(([id, name]) => (
              <div key={id} className="space-y-1">
                <h3 className="font-semibold text-sm">{name}</h3>
                <VaultActivityList vaultId={id} />
              </div>
            ))}
          </section>
        )}
      </div>
    </AuthGuard>
  );
}
