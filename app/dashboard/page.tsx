"use client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import ConnectBank from "@/components/ConnectBank";

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
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <section className="bg-muted p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">
            Current Paycheck Period
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for active paycheck summary]
          </div>
        </section>

        <section className="bg-muted p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for recent expenses and transfers]
          </div>
        </section>

        <section className="bg-muted p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Vault Overview</h2>
          <div className="text-sm text-muted-foreground">
            {vaultCount === null
              ? "Loading..."
              : `You have ${vaultCount} vaults.`}
          </div>
        </section>

        <section className="bg-muted p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Insights</h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for trends and advice]
          </div>
        </section>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Bank Connections</h2>
          <ConnectBank />
        </div>
      </div>
    </AuthGuard>
  );
}
