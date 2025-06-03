// Example: app/vaults/page.tsx
export default function VaultsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vaults</h1>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Your Vaults</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for vault list and balances]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Create New Vault</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for vault creation form]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Contribution Summary</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for recent vault deposits]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Vault Spending</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for spending activity tied to vaults]</div>
      </section>
    </div>
  )
}