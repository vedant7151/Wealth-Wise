"use client";

import { useTransition, useState, useLayoutEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertBudget } from "@/actions/budgets";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

export function EditBudgetDialog({
  currentBudget,
  children,
}: {
  currentBudget: number | null;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(currentBudget ? currentBudget.toString() : "");
  const [isPending, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    if (!next) {
      setAmount(currentBudget ? currentBudget.toString() : "");
    }
    setOpen(next);
  }

  function handleSubmit(formData: FormData) {
    const newAmount = Number(formData.get("amount"));
    if (isNaN(newAmount) || newAmount <= 0) {
      toast.error("Please enter a valid positive budget amount");
      return;
    }

    startTransition(async () => {
      const res = await upsertBudget(newAmount);
      if (res.success) {
        toast.success(currentBudget ? "Budget updated successfully" : "Budget set successfully");
        setOpen(false);
      } else {
        toast.error(res.error || "Failed to update budget");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? (
        <DialogTrigger render={children as React.ReactElement} />
      ) : (
        <DialogTrigger className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{currentBudget ? "Edit Monthly Budget" : "Set Monthly Budget"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Budget Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="1"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1000"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600">
              {isPending ? "Saving..." : currentBudget ? "Update Budget" : "Save Budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
