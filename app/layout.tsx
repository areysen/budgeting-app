import "./globals.css"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Budgeting App",
  description: "Smart budget tracking with vaults and paychecks",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <div className="min-h-screen flex flex-col">
          <nav className="w-full px-4 py-4 bg-gray-100 border-b dark:bg-gray-900 dark:border-gray-800">
            <ul className="flex flex-wrap gap-4 sm:gap-6 text-sm font-medium text-gray-700 dark:text-gray-200 overflow-x-auto sm:overflow-visible">
              <li>
                <a href="/dashboard" className="hover:underline whitespace-nowrap">Dashboard</a>
              </li>
              <li>
                <a href="/vaults" className="hover:underline whitespace-nowrap">Vaults</a>
              </li>
              <li>
                <a href="/paycheck" className="hover:underline whitespace-nowrap">Paycheck</a>
              </li>
              <li>
                <a href="/transactions" className="hover:underline whitespace-nowrap">Transactions</a>
              </li>
              <li>
                <a href="/settings" className="hover:underline whitespace-nowrap">Settings</a>
              </li>
            </ul>
          </nav>
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}