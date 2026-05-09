import { getAccountWithTransactions } from "@/actions/accounts";
import { getUserAccounts } from "@/actions/accounts";
import { CreateTransactionDialog } from "@/components/create-transaction-dialog";
import { AccountTransactionsTable } from "@/components/account-transactions-table";
import { AccountBalanceChart } from "@/components/charts/account-balance-chart";
import { AccountCategoryChart } from "@/components/charts/account-category-chart";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Wallet, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ManageRecurringDialog } from "@/components/manage-recurring-dialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default async function AccountDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ isRecurring?: string }> }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const isRecurringFilter = resolvedSearchParams?.isRecurring;
  const account = await getAccountWithTransactions(id);

  if (!account) {
    notFound();
  }

  const accounts = await getUserAccounts();

  const completedTransactions = account.transactions.filter(t => t.status === "COMPLETED");

  // --- Compute running balance chart data (oldest → newest) ---
  const sortedAsc = [...completedTransactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let runningBalance = account.balance;
  // Walk backwards to find opening balance
  for (const t of completedTransactions) {
    runningBalance -= t.type === "INCOME" ? t.amount : -t.amount;
  }

  const balanceChartData: { date: string; balance: number }[] = [];
  let bal = runningBalance;
  for (const t of sortedAsc) {
    bal += t.type === "INCOME" ? t.amount : -t.amount;
    balanceChartData.push({
      date: format(new Date(t.date), "MMM dd"),
      balance: parseFloat(bal.toFixed(2)),
    });
  }
  // Deduplicate same-date entries by keeping last per date
  const balanceDedupe = Object.values(
    balanceChartData.reduce((acc, point) => {
      acc[point.date] = point;
      return acc;
    }, {} as Record<string, { date: string; balance: number }>)
  );

  // --- Category breakdown for this account ---
  const categoryMap: Record<string, { amount: number; type: "INCOME" | "EXPENSE" }> = {};
  for (const t of completedTransactions) {
    if (!categoryMap[t.category]) {
      categoryMap[t.category] = { amount: 0, type: t.type as "INCOME" | "EXPENSE" };
    }
    categoryMap[t.category].amount += t.amount;
  }
  const categoryChartData = Object.entries(categoryMap)
    .map(([category, { amount, type }]) => ({ category, amount: parseFloat(amount.toFixed(2)), type }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // --- Monthly stats ---
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  for (const t of completedTransactions) {
    if (new Date(t.date) >= startOfMonth) {
      if (t.type === "INCOME") monthlyIncome += t.amount;
      else monthlyExpenses += t.amount;
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link href="/accounts" className="hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Wallet className="w-5 h-5" />
            <span>Account Details</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
          <div className="flex gap-2">
            <Badge variant="outline">{account.type}</Badge>
            {account.isDefault && (
              <Badge className="bg-emerald-500 hover:bg-emerald-600">Default Account</Badge>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <ManageRecurringDialog accountId={account.id} accounts={accounts} />
          <CreateTransactionDialog accounts={accounts} defaultAccountId={account.id} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">{account._count.transactions} total transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month's Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              +${monthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monthly income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month's Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              -${monthlyExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monthly expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {account.transactions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Balance Over Time</CardTitle>
              <CardDescription>Running account balance</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <AccountBalanceChart data={balanceDedupe} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Breakdown by Category</CardTitle>
              <CardDescription>Top categories by amount</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <AccountCategoryChart data={categoryChartData} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Transactions</h2>
          <form className="flex gap-2">
            <Select name="isRecurring" defaultValue={isRecurringFilter || "ALL"}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Reccurence</SelectItem>
                <SelectItem value="true">Recurring</SelectItem>
                <SelectItem value="false">Non-Recurring</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary">Filter</Button>
          </form>
        </div>
        <Card>
          <CardContent className="p-0">
            <AccountTransactionsTable
              transactions={
                isRecurringFilter === "true"
                  ? account.transactions.filter((t) => t.isRecurring)
                  : isRecurringFilter === "false"
                  ? account.transactions.filter((t) => !t.isRecurring)
                  : account.transactions
              }
              accounts={accounts}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
