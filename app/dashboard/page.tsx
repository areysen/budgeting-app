"use client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function DashboardPage() {
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
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Current Paycheck Period
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for active paycheck summary]
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Recent Activity
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for recent expenses and transfers]
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Vault Overview
          </h2>
          <div className="text-sm text-muted-foreground">
            {vaultCount === null
              ? "Loading..."
              : `You have ${vaultCount} vaults.`}
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Insights
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for trends and advice]
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
