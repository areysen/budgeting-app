"use client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { seedVaults } from "@/lib/supabase/seedVaults";

type Vault = {
  id: string;
  name: string;
};

export default function VaultsPage() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;
      if (!userId) return;

      // Optionally seed if no vaults yet
      const { data: existingVaults, error } = await supabase
        .from("vaults")
        .select("id, name")
        .eq("user_id", userId);

      if (error) {
        console.error("Error loading vaults:", error.message);
        setLoading(false);
        return;
      }

      if (existingVaults.length === 0) {
        await seedVaults(userId);
        const { data: newVaults } = await supabase
          .from("vaults")
          .select("id, name")
          .eq("user_id", userId);
        setVaults(newVaults || []);
      } else {
        setVaults(existingVaults);
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <AuthGuard>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Vaults</h1>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Your Vaults
          </h2>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : vaults.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No vaults found.
            </div>
          ) : (
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {vaults.map((vault) => (
                <li key={vault.id}>{vault.name}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Create New Vault
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for vault creation form]
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Contribution Summary
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for recent vault deposits]
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Vault Spending
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for spending activity tied to vaults]
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
