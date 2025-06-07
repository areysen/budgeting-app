"use client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function TransactionsPage() {
  const [vaultCount, setVaultCount] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id;
      if (userId) {
        supabase
          .from("vaults")
          .select("*")
          .eq("user_id", userId)
          .then(({ data }) => {
            setVaultCount(data?.length ?? 0);
          });
      }
    });
  }, []);

  return (
    <AuthGuard>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Transactions</h1>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Transaction Log
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for recent synced transactions]
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Manual Entry
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for adding transactions manually]
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Sync Status
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for last sync status + time]
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Categorization
          </h2>
          <div className="text-sm text-muted-foreground">
            {vaultCount === null
              ? "Loading vaults..."
              : `Using ${vaultCount} vaults for categorization.`}
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
