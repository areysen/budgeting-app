"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import type { Database } from "@/types/supabase";

interface ApprovedBudgetViewProps {
  paycheckId: string;
}

interface ExpenseRow {
  id: string;
  label: string;
  amount: number;
  category_name: string | null;
}

interface VaultContribution {
  id: string;
  amount: number;
  vault_name: string | null;
}

export default function ApprovedBudgetView({
  paycheckId,
}: ApprovedBudgetViewProps) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [vaults, setVaults] = useState<VaultContribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: exp } = await supabase
        .from("expenses")
        .select("id, label, amount, categories(name)")
        .eq("paycheck_id", paycheckId)
        .returns<
          (Database["public"]["Tables"]["expenses"]["Row"] & {
            categories: { name: string | null } | null;
          })[]
        >();

      const { data: vc } = await supabase
        .from("vault_contributions")
        .select("id, amount, vaults(name)")
        .eq("paycheck_id", paycheckId)
        .returns<
          (Database["public"]["Tables"]["vault_contributions"]["Row"] & {
            vaults: { name: string | null } | null;
          })[]
        >();

      setExpenses(
        (exp ?? []).map((e) => ({
          id: e.id,
          label: e.label,
          amount: e.amount,
          category_name: e.categories?.name ?? null,
        }))
      );

      setVaults(
        (vc ?? []).map((v) => ({
          id: v.id,
          amount: v.amount,
          vault_name: v.vaults?.name ?? null,
        }))
      );
      setLoading(false);
    }
    fetchData();
  }, [paycheckId]);

  const expenseTotal =
    expenses.reduce((sum, e) => sum + e.amount, 0) +
    vaults.reduce((s, v) => s + v.amount, 0);

  return (
    <AuthGuard>
      <div className="space-y-6">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <>
            <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Expenses
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-1">Label</th>
                    <th className="py-1">Amount</th>
                    <th className="py-1">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-1">{e.label}</td>
                      <td className="py-1">${e.amount.toFixed(2)}</td>
                      <td className="py-1">{e.category_name ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Vault Contributions
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-1">Vault</th>
                    <th className="py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {vaults.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-1">{v.vault_name ?? ""}</td>
                      <td className="py-1">${v.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Summary
              </h2>
              <div className="text-sm text-muted-foreground">
                Total Expense: ${expenseTotal.toFixed(2)}
              </div>
            </section>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
