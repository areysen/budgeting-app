# Budgeting App

A personal finance manager built with Next.js, Supabase, and Plaid. The application lets you connect bank accounts, track transactions, and organize money into vaults.

## Features

- Authenticate and store user data with Supabase
- Connect bank accounts through Plaid to import transactions
- Manage vaults and categorize expenses
- Dashboard showing recent activity and paycheck summaries

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Supabase CLI installed for local development

### Installation

```bash
npm install
cp .env.example .env  # add your Supabase and Plaid credentials
```

Start the local Supabase stack and run the dev server:

```bash
supabase start
npm run dev
```

Open <http://localhost:3000> in your browser.

## Environment Variables

The following variables must be provided in `.env`:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
PLAID_ENV=sandbox
PLAID_CLIENT_ID=
PLAID_SECRET=
```

`PLAID_ENV` supports `sandbox`, `development`, or `production`.

## Project Structure

- `app/` – Next.js routes and pages
- `components/` – Shared UI and feature components
- `lib/` – Utility libraries including Supabase helpers
- `supabase/` – Local Supabase configuration

Additional guides are available in the [docs](docs/) directory.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on developing and submitting changes.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

