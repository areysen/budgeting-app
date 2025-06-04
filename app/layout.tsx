import "./globals.css";
import { cn } from "@/lib/utils";
import { TopNav } from "@/components/layout/TopNav";
import ClientProviders from "@/components/auth/ClientProviders";
import { Inter } from "next/font/google";

const isCodex = process.env.CI === "true"; // or set a custom flag in Codex
const inter = isCodex ? { className: "" } : Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Budgeting App",
  description: "Smart budget tracking with vaults and paychecks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        <ClientProviders>
          <div className="min-h-screen flex flex-col">
            <TopNav />
            <main className="flex-1">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                {children}
              </div>
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
