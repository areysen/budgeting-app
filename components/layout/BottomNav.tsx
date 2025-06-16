"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Wallet, List, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/paycheck", label: "Budget", icon: Calendar },
  { href: "/vaults", label: "Vaults", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: List },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on login page
  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-4 left-0 right-0 mx-4 z-50 bg-background/80 backdrop-blur-md border border-border shadow-lg rounded-3xl flex justify-around items-center h-16 md:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors px-2 py-1",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={label}
          >
            <Icon
              className={cn(
                "w-6 h-6 mb-0.5",
                isActive ? "stroke-[2.5]" : "stroke-2"
              )}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;
