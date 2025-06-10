# Project Setup

This document explains how to configure a local development environment for the Budgeting App.

## Requirements

- Node.js 18 or higher
- npm or another compatible package manager
- Supabase CLI for running the local database

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Supabase and Plaid keys.
3. Start the Supabase stack locally:
   ```bash
   supabase start
   ```
4. Launch the development server:
   ```bash
   npm run dev
   ```

The application will be available at <http://localhost:3000>.

