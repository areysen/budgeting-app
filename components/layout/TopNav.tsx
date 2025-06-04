"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function TopNav() {
  const pathname = usePathname();

  // Don't show nav on login page
  if (pathname === "/login") return null;

  return (
    <header className="bg-white shadow dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Budgeting App
          </Link>
          <nav className="space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-300 hover:underline"
            >
              Dashboard
            </Link>
            <Link
              href="/paycheck"
              className="text-gray-600 dark:text-gray-300 hover:underline"
            >
              Paycheck
            </Link>
            <Link
              href="/vaults"
              className="text-gray-600 dark:text-gray-300 hover:underline"
            >
              Vaults
            </Link>
            <Link
              href="/transactions"
              className="text-gray-600 dark:text-gray-300 hover:underline"
            >
              Transactions
            </Link>
            <Link
              href="/settings"
              className="text-gray-600 dark:text-gray-300 hover:underline"
            >
              Settings
            </Link>
          </nav>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
