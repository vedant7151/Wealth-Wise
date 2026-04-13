import { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { checkUser } from "@/lib/checkUser";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await checkUser();
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-md">
        <nav className="hidden md:flex flex-col gap-6 text-lg font-medium md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base text-emerald-400">
            Wealth
          </Link>
          <Link href="/dashboard" className="text-foreground transition-colors hover:text-emerald-400">
            Dashboard
          </Link>
          <Link href="/transactions" className="text-muted-foreground transition-colors hover:text-foreground">
            Transactions
          </Link>
          <Link href="/accounts" className="text-muted-foreground transition-colors hover:text-foreground">
            Accounts
          </Link>
        </nav>
        <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <UserButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
