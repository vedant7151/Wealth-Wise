"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createTransactionAction } from "@/actions/transactions";
import { CATEGORIES } from "@/lib/categories";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import { ReceiptScanner } from "./receipt-scanner";
import { Switch } from "@/components/ui/switch";

function CreateTransactionForm({
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
  accounts: { id: string; name: string; balance: number }[];
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
  setStatus: (v: string) => void;
  isRecurring: boolean;
  setIsRecurring: (v: boolean) => void;
  recurringInterval: string;
  setRecurringInterval: (v: string) => void;
  doneRef: React.MutableRefObject<() => void>;
}) {
  const [state, formAction, isPending] = useActionState(createTransactionAction, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success("Transaction added!");
      doneRef.current();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, doneRef]);

  const filteredCategories = CATEGORIES.filter(
    (c) => c.type === type.toLowerCase() || c.id === "other"
  );

  return (
    <form action={formAction} className="grid gap-4 py-4">
      <input type="hidden" name="type" value={type} />

      <div className="grid gap-2">
        <Label>Account</Label>
        <Select
          name="accountId"
          value={accountId}
          onValueChange={(v) => setAccountId(v ?? "")}
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
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="0.00"
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
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((cat) => (
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
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
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
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="E.g. Groceries at Target"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 shadow-sm border rounded-lg p-3 mt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="isRecurring" className="flex-1 cursor-pointer">
            Recurring Transaction
          </Label>
          <Switch
            id="isRecurring"
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

      <div className="pt-4 flex justify-end">
        <Button
          type="submit"
          disabled={isPending || accounts.length === 0}
          className={
            type === "INCOME"
              ? "bg-emerald-500 hover:bg-emerald-600"
              : "bg-red-500 hover:bg-red-600"
          }
        >
          {isPending ? "Adding..." : "Add Transaction"}
        </Button>
      </div>
    </form>
  );
}

export function CreateTransactionDialog({
  accounts,
  defaultAccountId,
}: {
  accounts: { id: string; name: string; balance: number }[];
  defaultAccountId?: string;
}) {
  const defaultAccount = defaultAccountId ?? (accounts.length > 0 ? accounts[0].id : "");

  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState(defaultAccount);
  const [status, setStatus] = useState("COMPLETED");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("MONTHLY");

  const doneRef = useRef<() => void>(() => {});

  function resetForm() {
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setCategory("");
    setType("EXPENSE");
    setAccountId(defaultAccount);
    setStatus("COMPLETED");
    setIsRecurring(false);
    setRecurringInterval("MONTHLY");
  }

  useLayoutEffect(() => {
    doneRef.current = () => {
      resetForm();
      setOpen(false);
    };
  });

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    setOpen(next);
    if (next) {
      setAccountId(defaultAccount);
      setFormKey((k) => k + 1);
    }
  }

  function handleTypeChange(newType: "INCOME" | "EXPENSE") {
    setType(newType);
    setCategory("");
  }

  return (
    <>
      <div
        onClick={() => handleOpenChange(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Add Transaction
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
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
              onClick={() => handleTypeChange("EXPENSE")}
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
              onClick={() => handleTypeChange("INCOME")}
            >
              Income
            </Button>
          </div>

          {type === "EXPENSE" && (
            <ReceiptScanner
              onScanSuccess={(data) => {
                if (data.amount) setAmount(data.amount.toString());
                if (data.date) setDate(data.date);
                if (data.description || data.merchantName) {
                  const desc = data.merchantName
                    ? `${data.merchantName}${data.description ? `: ${data.description}` : ""}`
                    : data.description;
                  setDescription(desc);
                }
                if (data.category) setCategory(data.category);
                toast.success("Receipt scanned successfully");
              }}
            />
          )}

          <CreateTransactionForm
            key={formKey}
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
