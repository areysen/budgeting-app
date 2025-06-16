# Contributing to Budgeting App

Thank you for taking the time to contribute! The following guidelines will help you set up a development environment and submit changes.

## Repository Context

**Important:** The `areysen/rork-paycheck-budget-tracker` repository included in this project is a reference example only, not the main working repository. When discussing code changes, new features, or development work, do not assume this reference repository is the target for modifications unless explicitly stated. Use the reference repository for understanding patterns, architecture, and implementation examples, but always clarify which repository or project the user wants to work on before making specific recommendations.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and fill in the required keys.
4. Start the local Supabase stack with `supabase start`.
5. Run the development server using `npm run dev`.

## Development

- Use `npm run lint` to check code style before committing.
- Commit descriptive messages and open a pull request targeting the `main` branch.
- If adding a new feature or fixing a bug, please include relevant documentation updates in the `docs/` directory.

## Communication

For major changes or proposals, open an issue to discuss them before creating a pull request.