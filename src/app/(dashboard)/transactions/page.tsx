import { getUserTransactions } from "@/actions/transactions";
import { getUserAccounts } from "@/actions/accounts";
import { CreateTransactionDialog } from "@/components/create-transaction-dialog";
import { CATEGORIES } from "@/lib/categories";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Note: To use useSearchParams, this needs to be a Page that passes searchParams as props in Next.js 16
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; category?: string; account?: string; isRecurring?: string }>
}) {
  const resolvedParams = await searchParams;
  const accountId = resolvedParams.account === "ALL" ? undefined : resolvedParams.account;
  const search = resolvedParams.search;
  const type = resolvedParams.type === "INCOME" || resolvedParams.type === "EXPENSE" ? resolvedParams.type : undefined;
  const category = resolvedParams.category === "ALL" ? undefined : resolvedParams.category;
  const isRecurring =
    resolvedParams.isRecurring === "true" ? true : resolvedParams.isRecurring === "false" ? false : undefined;

  const { transactions } = await getUserTransactions({ accountId, type, search, category, isRecurring });
  const accounts = await getUserAccounts();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">Transactions</h1>
        <CreateTransactionDialog accounts={accounts} />
      </div>

      {/* Simple filtering form - Server Side */}
      <form className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search descriptions..."
            className="pl-8"
            defaultValue={search}
          />
        </div>
        <div className="flex gap-2 sm:w-auto">
          <Select name="type" defaultValue={type || "ALL"}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
          
          <Select name="account" defaultValue={accountId || "ALL"}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Accounts</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select name="isRecurring" defaultValue={resolvedParams.isRecurring || "ALL"}>
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
        </div>
      </form>

      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] pl-6">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions && transactions.length > 0 ? (
                transactions.map((t) => {
                  const cat = CATEGORIES.find(c => c.id === t.category);
                  const Icon = cat?.icon;
                  
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium pl-6">
                        {format(new Date(t.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{t.description || "No description"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize flex w-fit items-center gap-1">
                          {Icon && <Icon className="w-3 h-3" />}
                          {cat ? cat.name : t.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.account?.name}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === 'COMPLETED' ? 'default' : t.status === 'PENDING' ? 'secondary' : 'destructive'} className="capitalize">
                          {t.status.toLowerCase()}
                        </Badge>
                        {t.isRecurring ? (
                          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                            Recurring
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-slate-50 text-slate-500 border-slate-200">
                            Non-recurring
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <span className={`inline-flex items-center font-bold ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-foreground'}`}>
                          {t.type === 'INCOME' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          {t.type === 'INCOME' ? <ArrowUpRight className="ml-1 w-4 h-4" /> : <ArrowDownRight className="ml-1 w-4 h-4 text-red-500" />}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
