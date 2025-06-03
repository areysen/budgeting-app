// Example: app/paycheck/page.tsx
export default function PaycheckPage() {
  return (
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
        <div className="text-sm text-muted-foreground">[Placeholder for vault allocations]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Unallocated Balance</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for remaining funds]</div>
      </section>
    </div>
  )
}