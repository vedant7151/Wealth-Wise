"use client";

import { useState } from "react";
import { deleteTransaction } from "@/actions/transactions";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import { CATEGORIES } from "@/lib/categories";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description?: string | null;
  date: Date | string;
  category: string;
  accountId: string;
  status?: "PENDING" | "COMPLETED" | "FAILED";
  isRecurring: boolean;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface AccountTransactionsTableProps {
  transactions: Transaction[];
  accounts: Account[];
}

export function AccountTransactionsTable({
  transactions,
  accounts,
}: AccountTransactionsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteTransaction(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Transaction deleted");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <>
      {/* Delete Confirm Dialog */}
      <Dialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              This will permanently delete this transaction and reverse its
              effect on your account balance. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!!deletingId}
              onClick={() => confirmId && handleDelete(confirmId)}
            >
              {deletingId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[110px] pl-6">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[90px] text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length > 0 ? (
            transactions.map((t) => {
              const cat = CATEGORIES.find((c) => c.id === t.category);
              const Icon = cat?.icon;

              return (
                <TableRow key={t.id} className="group">
                  <TableCell className="font-medium pl-6">
                    {format(new Date(t.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {t.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="capitalize flex w-fit items-center gap-1"
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      {cat ? cat.name : t.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t.status && (
                      <Badge
                        variant={
                          t.status === "COMPLETED"
                            ? "default"
                            : t.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          t.status === "COMPLETED"
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : ""
                        }
                      >
                        {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                      </Badge>
                    )}
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
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center font-bold ${
                        t.type === "INCOME"
                          ? "text-emerald-500"
                          : "text-foreground"
                      }`}
                    >
                      {t.type === "INCOME" ? "+" : "-"}$
                      {t.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                      {t.type === "INCOME" ? (
                        <ArrowUpRight className="ml-1 w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="ml-1 w-4 h-4 text-red-500" />
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <EditTransactionDialog
                        transaction={t}
                        accounts={accounts}
                      />
                      <button
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Delete transaction"
                        onClick={() => setConfirmId(t.id)}
                        disabled={deletingId === t.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No transactions found for this account.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
