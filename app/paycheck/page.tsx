'use client'
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export default function PaycheckPage() {
  const [vaultCount, setVaultCount] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id
      if (userId) {
        supabase.from("vaults").select("*").eq("user_id", userId).then(({ data }) => {
          setVaultCount(data?.length ?? 0)
        })
      }
    })
  }, [])

  return (
    <AuthGuard>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Paycheck Plan</h1>

        <section className="bg-muted p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Income Summary</h2>
          <div className="text-sm text-muted-foreground">[Placeholder for paycheck breakdown]</div>
        </section>

        <section className="bg-muted p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Fixed Expenses</h2>
          <div className="text-sm text-muted-foreground">[Placeholder for bills due this period]</div>
        </section>

        <section className="bg-muted p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Vault Contributions</h2>
          <div className="text-sm text-muted-foreground">
            {vaultCount === null ? "Loading..." : `There are ${vaultCount} vaults available for allocation.`}
          </div>
        </section>

        <section className="bg-muted p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Unallocated Balance</h2>
          <div className="text-sm text-muted-foreground">[Placeholder for remaining funds]</div>
        </section>
      </div>
    </AuthGuard>
  )
}