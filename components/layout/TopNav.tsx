"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { cn } from "@/lib/utils";

export function TopNav() {
  const pathname = usePathname();

  // Don't show nav on login page
  if (pathname === "/login") return null;

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b border-border ">
      <div className="mx-auto max-w-7xl px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-xl font-bold text-foreground">
            Budgeting App
          </Link>
          <nav className="space-x-4">
            <Link
              href="/dashboard"
              className={cn(
                "px-2 py-1 rounded-md transition-colors",
                pathname === "/dashboard"
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/paycheck"
              className={cn(
                "px-2 py-1 rounded-md transition-colors",
                pathname === "/paycheck"
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Paycheck
            </Link>
            <Link
              href="/vaults"
              className={cn(
                "px-2 py-1 rounded-md transition-colors",
                pathname === "/vaults"
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Vaults
            </Link>
            <Link
              href="/transactions"
              className={cn(
                "px-2 py-1 rounded-md transition-colors",
                pathname === "/transactions"
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Transactions
            </Link>
            <Link
              href="/settings"
              className={cn(
                "px-2 py-1 rounded-md transition-colors",
                pathname === "/settings"
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
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
