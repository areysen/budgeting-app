"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Don't show nav on login page
  if (pathname === "/login") return null;

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/paycheck", label: "Paycheck" },
    { href: "/vaults", label: "Vaults" },
    { href: "/transactions", label: "Transactions" },
    { href: "/settings", label: "Settings" },
  ];

  const renderLinks = (onClick?: () => void) => (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClick}
          className={cn(
            "px-2 py-1 rounded-md transition-colors block",
            pathname === link.href
              ? "text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-foreground">
            Budgeting App
          </Link>
          <nav className="hidden md:flex space-x-4">
            {renderLinks()}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="md:hidden text-foreground" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </button>
            </DialogTrigger>
            <DialogContent className="md:hidden max-w-xs" header={<DialogTitle>Menu</DialogTitle>}>
              <nav className="flex flex-col space-y-2">
                {renderLinks(() => setOpen(false))}
              </nav>
              <div className="mt-4">
                <LogoutButton />
              </div>
            </DialogContent>
          </Dialog>
          <div className="hidden md:block">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
