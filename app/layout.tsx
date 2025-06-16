import "./globals.css";
import { cn } from "@/lib/utils";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { Inter } from "next/font/google";

const interFont = Inter({ subsets: ["latin"] });
const isCodex = process.env.CI === "true"; // or set a custom flag in Codex
const inter = isCodex ? { className: "" } : interFont;

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
    <html lang="en" className="bg-background text-foreground">
      <body
        className={cn(
          "min-h-screen font-sans antialiased bg-background ring-offset-background",
          inter.className
        )}
      >
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 pb-26">
              {children}
            </div>
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
