import { AuthGuard } from "@/components/auth/AuthGuard";
import ConnectBank from "@/components/ConnectBank";
export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Profile Preferences
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for user preferences]
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Income Setup
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for income sources and schedules]
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Vault Settings
          </h2>
          <div className="text-sm text-muted-foreground">
            [Placeholder for managing vault names and goals]
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Fixed Budget Items
          </h2>
          <div className="text-sm text-muted-foreground">
            <a
              href="/settings/fixed-items"
              className="text-primary underline hover:opacity-80"
            >
              Manage recurring income and expenses
            </a>
          </div>
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg  p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Plaid Integration
          </h2>
          <div className="text-sm text-muted-foreground">
            <ConnectBank />
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
