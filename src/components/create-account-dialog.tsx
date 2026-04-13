"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createAccountAction } from "@/actions/accounts";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

function CreateAccountForm({ doneRef }: { doneRef: React.MutableRefObject<() => void> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createAccountAction, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success("Account created successfully!");
      formRef.current?.reset();
      doneRef.current();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, doneRef]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Account Name</Label>
        <Input id="name" name="name" placeholder="E.g. Main Checking" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type">Account Type</Label>
        <Select name="type" required defaultValue="CURRENT">
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CURRENT">Current / Checking</SelectItem>
            <SelectItem value="SAVINGS">Savings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="balance">Initial Balance</Label>
        <Input id="balance" name="balance" type="number" step="0.01" min="0" placeholder="0.00" />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch id="isDefault" name="isDefault" />
        <Label htmlFor="isDefault">Set as default account</Label>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600">
          {isPending ? "Creating..." : "Create Account"}
        </Button>
      </div>
    </form>
  );
}

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const doneRef = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    doneRef.current = () => setOpen(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setFormKey((k) => k + 1);
        }
      }}
    >
      <DialogTrigger>
        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer">
          <Plus className="h-4 w-4" />
          Create Account
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
        </DialogHeader>
        <CreateAccountForm key={formKey} doneRef={doneRef} />
      </DialogContent>
    </Dialog>
  );
}
