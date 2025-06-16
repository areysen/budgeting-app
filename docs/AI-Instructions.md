# AI Development Instructions

## Project Overview

Budgeting App built with Next.js 15, TypeScript, Supabase, and Plaid integration. Uses App Router, Tailwind CSS, and shadcn/ui components.

## Tech Stack Rules

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict typing required)
- **Database**: Supabase for backend/auth
- **Banking**: Plaid for bank integrations
- **Styling**: Tailwind CSS + shadcn/ui components
- **Notifications**: React Hot Toast

## Code Generation Standards

### Component Patterns

- Use TypeScript with proper type definitions from `types/supabase.ts`
- Follow shadcn/ui conventions for UI components
- Import utilities from `@/lib/utils` for className merging
- Use established Supabase client patterns from `lib/supabase/`
- Implement proper error handling with toast notifications
- Follow existing auth patterns using AuthGuard

### File Organization

- Components go in `/components/` with logical subfolder grouping
- Utilities in `/lib/` (database, utils, etc.)
- Pages in `/app/` following App Router conventions
- Types in `/types/` directory

### Database & API Patterns

- Use server/client patterns appropriately for database calls
- Follow established Plaid integration patterns in `lib/plaid.ts`
- Reference Supabase types from `types/supabase.ts`
- Implement proper data validation and error boundaries

### UI/UX Standards

- Use existing UI components from `components/ui/`
- Follow established navigation patterns with TopNav (desktop) and BottomNav (mobile)
- BottomNav is fixed at bottom with floating rounded design (mobile only)
- TopNav shows on desktop with menu dialog for mobile
- Maintain consistent styling with Tailwind classes
- Implement proper loading states and skeletons
- Use React Hot Toast for user feedback
- Consider mobile-first responsive design patterns

### Development Workflow

- Always run `npm run lint` before suggesting commits
- Follow ESLint configuration
- Consider edge cases and error states
- Write code that passes type checking
- Reference existing patterns for similar functionality

### Feature Implementation

- Study existing features (vaults, transactions, fixed items) before building new ones
- Follow forecasting logic patterns in `lib/forecasting.ts`
- Use established date utilities from `lib/utils/date/`
- Implement proper form validation and user feedback
- Maintain consistency with existing data models

## Environment Setup

- Copy `.env.example` to `.env` for local development
- Run `supabase start` before `npm run dev`
- Use `npm run lint` to check code style

## Important Notes

- Always reference existing code patterns before creating new ones
- Maintain type safety throughout the application
- Follow the established component architecture
- Use proper error handling and loading states
