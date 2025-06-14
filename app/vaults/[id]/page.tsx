"use client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import VaultActivityList from "@/components/vaults/VaultActivityList";

type Vault = { id: string; name: string };

export default function VaultDetailPage() {
  const params = useParams<{ id: string }>();
  const vaultId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [vault, setVault] = useState<Vault | null>(null);

  useEffect(() => {
    if (!vaultId) return;
    supabase
      .from("vaults")
      .select("id, name")
      .eq("id", vaultId as string)
      .single()
      .then(({ data }) => setVault(data));
  }, [vaultId]);

  if (!vault)
    return (
      <AuthGuard>
        <p className="text-muted-foreground">Loading...</p>
      </AuthGuard>
    );

  return (
    <AuthGuard>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">{vault.name}</h1>
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">Activity</h2>
          <VaultActivityList vaultId={vault.id} />
        </section>
      </div>
    </AuthGuard>
  );
}
