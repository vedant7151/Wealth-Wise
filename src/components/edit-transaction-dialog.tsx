"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import { updateTransactionAction } from "@/actions/transactions";
import { CATEGORIES } from "@/lib/categories";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

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
  recurringInterval?: string | null;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface EditTransactionDialogProps {
  transaction: Transaction;
  accounts: Account[];
  onSuccess?: () => void;
}

function EditTransactionForm({
  transaction,
  accounts,
  type,
  amount,
  setAmount,
  date,
  setDate,
  description,
  setDescription,
  category,
  setCategory,
  accountId,
  setAccountId,
  status,
  setStatus,
  isRecurring,
  setIsRecurring,
  recurringInterval,
  setRecurringInterval,
  doneRef,
}: {
  transaction: Transaction;
  accounts: Account[];
  type: "INCOME" | "EXPENSE";
  amount: string;
  setAmount: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  accountId: string;
  setAccountId: (v: string) => void;
  status: string;
  setStatus: (v: any) => void;
  isRecurring: boolean;
  setIsRecurring: (v: boolean) => void;
  recurringInterval: string;
  setRecurringInterval: (v: any) => void;
  doneRef: React.MutableRefObject<() => void>;
}) {
  const [state, formAction, isPending] = useActionState(updateTransactionAction, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success("Transaction updated!");
      doneRef.current();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, doneRef]);

  return (
    <form action={formAction} className="grid gap-4 py-2">
      <input type="hidden" name="transactionId" value={transaction.id} />
      <input type="hidden" name="type" value={type} />

      <div className="grid gap-2">
        <Label>Account</Label>
        <Select
          name="accountId"
          value={accountId}
          onValueChange={(v) => setAccountId(v ?? "")}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name} (${acc.balance.toFixed(2)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-amount">Amount</Label>
        <Input
          id="edit-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label>Category</Label>
        <Select
          key={type}
          name="category"
          value={category}
          onValueChange={(v) => setCategory(v ?? "")}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.filter(
              (c) => c.type === type.toLowerCase() || c.id === "other"
            ).map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <cat.icon className="w-4 h-4" />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-date">Date</Label>
        <Input
          id="edit-date"
          name="date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label>Status</Label>
        <Select
          name="status"
          value={status}
          onValueChange={(v) => setStatus(v ?? "")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-desc">Description (Optional)</Label>
        <Input
          id="edit-desc"
          name="description"
          placeholder="E.g. Groceries at Target"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 shadow-sm border rounded-lg p-3 mt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="edit-isRecurring" className="flex-1 cursor-pointer">
            Recurring Transaction
          </Label>
          <Switch
            id="edit-isRecurring"
            name="isRecurring"
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
          />
        </div>

        {isRecurring && (
          <div className="grid gap-2 pt-2 border-t">
            <Label>Interval</Label>
            <Select
              name="recurringInterval"
              value={recurringInterval}
              onValueChange={setRecurringInterval}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className={
            type === "INCOME"
              ? "bg-emerald-500 hover:bg-emerald-600"
              : "bg-red-500 hover:bg-red-600"
          }
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export function EditTransactionDialog({
  transaction,
  accounts,
  onSuccess,
}: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [date, setDate] = useState(format(new Date(transaction.date), "yyyy-MM-dd"));
  const [description, setDescription] = useState(transaction.description ?? "");
  const [category, setCategory] = useState(transaction.category);
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [status, setStatus] = useState(transaction.status ?? "COMPLETED");
  const [isRecurring, setIsRecurring] = useState(transaction.isRecurring);
  const [recurringInterval, setRecurringInterval] = useState(transaction.recurringInterval ?? "MONTHLY");
  const onSuccessRef = useRef(onSuccess);

  const doneRef = useRef<() => void>(() => { });

  useLayoutEffect(() => {
    onSuccessRef.current = onSuccess;
    doneRef.current = () => {
      setOpen(false);
      onSuccessRef.current?.();
    };
  });

  function syncFromTransaction() {
    setType(transaction.type);
    setAmount(transaction.amount.toString());
    setDate(format(new Date(transaction.date), "yyyy-MM-dd"));
    setDescription(transaction.description ?? "");
    setCategory(transaction.category);
    setAccountId(transaction.accountId);
    setStatus(transaction.status ?? "COMPLETED");
    setIsRecurring(transaction.isRecurring);
    setRecurringInterval(transaction.recurringInterval ?? "MONTHLY");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      syncFromTransaction();
      setFormKey((k) => k + 1);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Edit transaction"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 mb-4 mt-2">
            <Button
              type="button"
              variant={type === "EXPENSE" ? "default" : "outline"}
              className={
                type === "EXPENSE"
                  ? "w-1/2 bg-red-500 hover:bg-red-600 text-white"
                  : "w-1/2"
              }
              onClick={() => {
                setType("EXPENSE");
                setCategory("");
              }}
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={type === "INCOME" ? "default" : "outline"}
              className={
                type === "INCOME"
                  ? "w-1/2 bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "w-1/2"
              }
              onClick={() => {
                setType("INCOME");
                setCategory("");
              }}
            >
              Income
            </Button>
          </div>

          <EditTransactionForm
            key={formKey}
            transaction={transaction}
            accounts={accounts}
            type={type}
            amount={amount}
            setAmount={setAmount}
            date={date}
            setDate={setDate}
            description={description}
            setDescription={setDescription}
            category={category}
            setCategory={setCategory}
            accountId={accountId}
            setAccountId={setAccountId}
            status={status}
            setStatus={setStatus}
            isRecurring={isRecurring}
            setIsRecurring={setIsRecurring}
            recurringInterval={recurringInterval}
            setRecurringInterval={setRecurringInterval}
            doneRef={doneRef}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
