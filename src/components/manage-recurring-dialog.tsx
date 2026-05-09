"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Repeat, XCircle, CalendarClock } from "lucide-react";
import { getRecurringTemplates, cancelRecurringTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import { format } from "date-fns";
import { CATEGORIES } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";

interface ManageRecurringDialogProps {
  accountId?: string;
  accounts: any[];
}

export function ManageRecurringDialog({ accountId, accounts }: ManageRecurringDialogProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, accountId]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await getRecurringTemplates(accountId);
      if (res.success && res.transactions) {
        setTemplates(res.transactions);
      } else {
        toast.error(res.error || "Failed to load recurring templates");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(transactionId: string) {
    setCancelingId(transactionId);
    try {
      const res = await cancelRecurringTransaction(transactionId);
      if (res.success) {
        toast.success("Recurring transaction stopped");
        setTemplates(templates.filter(t => t.id !== transactionId));
      } else {
        toast.error(res.error || "Failed to stop recurring transaction");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Repeat className="w-4 h-4" />
          Manage Recurring
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-blue-500" />
            Active Recurring Transactions
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-2">
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <CalendarClock className="w-12 h-12 mb-4 text-muted-foreground/50" />
              <p>No active recurring transactions found.</p>
            </div>
          ) : (
            templates.map((t) => {
              const cat = CATEGORIES.find(c => c.id === t.category);
              const Icon = cat?.icon;

              return (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`p-2 rounded-full shrink-0 ${t.type === "INCOME" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                      {Icon ? <Icon className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-base">{t.description || "No description"}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className={`font-semibold ${t.type === "INCOME" ? "text-emerald-500" : "text-foreground"}`}>
                          {t.type === "INCOME" ? "+" : "-"}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span>•</span>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {t.recurringInterval || 'UNKNOWN'}
                        </Badge>
                        {t.account && (
                          <>
                            <span>•</span>
                            <span>{t.account.name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Next due: {t.nextRecurringDate ? format(new Date(t.nextRecurringDate), "MMM dd, yyyy") : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <EditTransactionDialog 
                      transaction={t} 
                      accounts={accounts} 
                      onSuccess={loadTemplates}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={cancelingId === t.id}
                      onClick={() => handleCancel(t.id)}
                    >
                      {cancelingId === t.id ? (
                        "Stopping..."
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Stop
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
