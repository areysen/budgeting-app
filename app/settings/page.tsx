// Example: app/settings/page.tsx
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Profile Preferences</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for user preferences]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Income Setup</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for income sources and schedules]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Vault Settings</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for managing vault names and goals]</div>
      </section>

      <section className="bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Plaid Integration</h2>
        <div className="text-sm text-muted-foreground">[Placeholder for Plaid link and sync settings]</div>
      </section>
    </div>
  )
}