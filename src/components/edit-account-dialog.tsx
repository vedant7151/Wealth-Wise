"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import { updateAccountAction } from "@/actions/accounts";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";

interface AccountData {
  id: string;
  name: string;
  type: "CURRENT" | "SAVINGS";
  balance: number;
  isDefault: boolean;
}

function EditAccountForm({
  account,
  name,
  setName,
  type,
  setType,
  isDefault,
  setIsDefault,
  doneRef,
}: {
  account: AccountData;
  name: string;
  setName: (v: string) => void;
  type: "CURRENT" | "SAVINGS";
  setType: (v: "CURRENT" | "SAVINGS") => void;
  isDefault: boolean;
  setIsDefault: (v: boolean) => void;
  doneRef: React.MutableRefObject<() => void>;
}) {
  const [state, formAction, isPending] = useActionState(updateAccountAction, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success("Account updated successfully!");
      doneRef.current();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, doneRef]);

  return (
    <form action={formAction} className="grid gap-4 py-4">
      <input type="hidden" name="accountId" value={account.id} />

      <div className="grid gap-2">
        <Label htmlFor="edit-account-name">Account Name</Label>
        <Input
          id="edit-account-name"
          name="name"
          placeholder="E.g. Main Checking"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-account-type">Account Type</Label>
        <Select
          name="type"
          required
          value={type}
          onValueChange={(v) => setType(v as "CURRENT" | "SAVINGS")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CURRENT">Current / Checking</SelectItem>
            <SelectItem value="SAVINGS">Savings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch
          id="edit-isDefault"
          name="isDefault"
          checked={isDefault}
          onCheckedChange={setIsDefault}
        />
        <Label htmlFor="edit-isDefault">Set as default account</Label>
      </div>

      <div className="pt-4 flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export function EditAccountDialog({ account }: { account: AccountData }) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<"CURRENT" | "SAVINGS">(account.type);
  const [isDefault, setIsDefault] = useState(account.isDefault);

  const doneRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    doneRef.current = () => setOpen(false);
  });

  function syncFromAccount() {
    setName(account.name);
    setType(account.type);
    setIsDefault(account.isDefault);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      syncFromAccount();
      setFormKey((k) => k + 1);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleOpenChange(true);
        }}
        className="p-1.5 rounded-md text-muted-foreground hover:text-emerald-500 hover:bg-muted transition-colors"
        aria-label="Edit account"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <EditAccountForm
            key={formKey}
            account={account}
            name={name}
            setName={setName}
            type={type}
            setType={setType}
            isDefault={isDefault}
            setIsDefault={setIsDefault}
            doneRef={doneRef}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
