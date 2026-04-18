"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addFundsAction, withdrawFundsAction } from "@/actions/wallet";
import { toast } from "sonner";

const transferSchema = z.object({
  accountId: z.string().min(1, "Please select an account"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
});

interface WalletTransferDialogProps {
  type: "add" | "withdraw";
  accounts: { id: string; name: string; balance: number }[];
  walletBalance: number;
}

export function WalletTransferDialog({ type, accounts, walletBalance }: WalletTransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      accountId: "",
      amount: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof transferSchema>) => {
    if (type === "withdraw" && values.amount > walletBalance) {
      toast.error("Insufficient wallet balance");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("accountId", values.accountId);
      formData.append("amount", values.amount.toString());

      const res = type === "add" 
        ? await addFundsAction(null, formData)
        : await withdrawFundsAction(null, formData);

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(type === "add" ? "Funds added successfully" : "Funds withdrawn successfully");
        setOpen(false);
        form.reset();
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = type === "add" ? "Add Funds to Wallet" : "Withdraw to Bank Account";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={type === "add" ? "default" : "outline"} className="w-full sm:w-auto">
          {type === "add" ? "Top Up Wallet" : "Withdraw Funds"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type === "add" ? "From Bank Account" : "To Bank Account"}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map(acc => (
                         <SelectItem key={acc.id} value={acc.id}>
                           {acc.name} (${acc.balance.toFixed(2)})
                         </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
