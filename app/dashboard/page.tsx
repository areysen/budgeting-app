export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Current Paycheck Period</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for active paycheck summary]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for recent expenses and transfers]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Vault Overview</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for vault balances and progress]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Insights</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for trends and advice]</div>
      </section>
    </div>
  )
}