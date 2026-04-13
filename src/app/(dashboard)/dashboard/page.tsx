import { getUserAccounts } from "@/actions/accounts";
import { getUserTransactions } from "@/actions/transactions";
import { getBudgetProgress } from "@/actions/budgets";
import { CreateTransactionDialog } from "@/components/create-transaction-dialog";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditBudgetDialog } from "@/components/edit-budget-dialog";
import { DefaultAccountSwitch } from "@/components/default-account-switch";
import { AccountCard } from "@/components/account-card";


export default async function DashboardPage() {
  let accounts: any[] = [];
  let transactions: any[] = [];
  let budgetData: any = { spent: 0, progress: 0, budget: null };

  try {
    accounts = await getUserAccounts();
    const resTx = await getUserTransactions();
    if (resTx.success) {
      transactions = resTx.transactions || [];
    }
    const resBudget = await getBudgetProgress();
    if (resBudget.success) {
      budgetData = resBudget;
    }
  } catch (error) {
    // Expected if unauthenticated or server fails
  }

  const primaryAccount = accounts?.find((a) => a.isDefault) || accounts?.[0];

  if (primaryAccount) {
    transactions = transactions.filter((tx) => tx.accountId === primaryAccount.id);
  }

  // --- Total balance across all accounts ---
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const now = new Date();
  const startOfThisMonth = startOfMonth(now);

  // --- Monthly income & expenses ---
  const completedTransactions = transactions.filter(t => t.status === "COMPLETED");

  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  completedTransactions.forEach((tx) => {
    if (new Date(tx.date) >= startOfThisMonth) {
      if (tx.type === "INCOME") monthlyIncome += tx.amount;
      else monthlyExpenses += tx.amount;
    }
  });

  // --- Cash flow: last 6 months ---
  const cashFlowData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(now, 5 - i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    let income = 0;
    let expenses = 0;
    completedTransactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d >= start && d <= end) {
        if (tx.type === "INCOME") income += tx.amount;
        else expenses += tx.amount;
      }
    });
    return {
      month: format(monthDate, "MMM yy"),
      income: parseFloat(income.toFixed(2)),
      expenses: parseFloat(expenses.toFixed(2)),
    };
  });

  // --- Category breakdown (expenses only) for pie chart ---
  const catMap: Record<string, number> = {};
  completedTransactions.forEach((tx) => {
    if (tx.type === "EXPENSE") {
      catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
    }
  });
  const categoryData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {accounts.length > 0 && (
          <CreateTransactionDialog accounts={accounts} defaultAccountId={primaryAccount?.id} />
        )}
      </div>

      {!primaryAccount ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-40 space-y-4 pt-6">
            <p className="text-muted-foreground">No accounts found. Create one to get started.</p>
            <Link href="/accounts">
              <Button>Go to Accounts</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Total balance */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
                <Wallet className="w-32 h-32" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-slate-300">Total Balance</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">
                  ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            {/* Monthly income */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  ${monthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>

            {/* Monthly expenses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  ${monthlyExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>

          </div>

          {/* Monthly Budget Wide Card */}
          <Card className="w-full mt-4">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Monthly Budget (Default Account)
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      ${(budgetData.spent || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} of ${(budgetData.budget?.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} spent
                    </span>
                    <EditBudgetDialog currentBudget={budgetData.budget?.amount || null} />
                  </div>
                </div>
                <Progress value={budgetData.progress || 0} className="h-2 w-full" />
                <div className="flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {(budgetData.progress || 0).toFixed(1)}% used
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Cash flow bar chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Cash Flow</CardTitle>
                <CardDescription>Income vs Expenses — Last 6 Months</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <CashFlowChart data={cashFlowData} />
              </CardContent>
            </Card>

            {/* Expense category pie */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>All-time expense breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryPieChart data={categoryData} />
              </CardContent>
            </Card>
          </div>

          {/* Accounts & Recent transactions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* All accounts */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Your Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {accounts.map((acc) => (
                  <AccountCard key={acc.id} acc={acc} />
                ))}
              </CardContent>
            </Card>

            {/* Recent transactions */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-full ${t.type === "INCOME"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                              }`}
                          >
                            {t.type === "INCOME" ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {t.description || "No description"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(t.date), "MMM dd, yyyy")}
                              {t.account && (
                                <span className="ml-1 text-muted-foreground/70">
                                  · {t.account.name}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`font-semibold ${t.type === "INCOME" ? "text-emerald-500" : ""
                            }`}
                        >
                          {t.type === "INCOME" ? "+" : "-"}$
                          {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent transactions.</p>
                  )}

                  {recentTransactions.length > 0 && (
                    <Link href="/transactions" className="w-full block">
                      <Button variant="ghost" className="w-full text-sm text-center">
                        View All
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
