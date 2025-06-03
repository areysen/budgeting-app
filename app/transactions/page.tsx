// Example: app/transactions/page.tsx
export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Transaction Log</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for recent synced transactions]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Manual Entry</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for adding transactions manually]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Sync Status</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for last sync status + time]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Categorization</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for vault matching, rounding, etc.]</div>
      </section>
    </div>
  )
}