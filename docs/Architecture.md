# Project Architecture

The Budgeting App is built with the Next.js App Router and TypeScript. Supabase provides the database and authentication layer, while Plaid is used to link bank accounts and fetch transactions.

```
Next.js (App Router)
└── Supabase (database & auth)
    └── Plaid integration for bank data
```

### Key Directories

- `app/` – Application routes and pages
- `components/` – Reusable React components
- `lib/` – Utility functions and Supabase helpers
- `supabase/` – Local Supabase configuration

### Data Flow

1. Users authenticate via Supabase.
2. Connected bank accounts through Plaid are stored in Supabase.
3. Transactions are synced from Plaid to Supabase using API routes.
4. Pages query Supabase to display data in the dashboard.

This layered approach keeps the front‑end and back‑end loosely coupled while leveraging Supabase as a hosted database and authentication service.

