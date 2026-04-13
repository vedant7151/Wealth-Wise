"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { switchPrimaryAccount } from "@/actions/accounts";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export function DefaultAccountSwitch({ accountId, isDefault }: { accountId: string, isDefault: boolean }) {
  const [isPending, startTransition] = useTransition();

  function onCheckedChange(checked: boolean) {
    if (checked && !isDefault) {
      startTransition(async () => {
        const res = await switchPrimaryAccount(accountId);
        if (res.success) {
          toast.success("Default account updated");
        } else {
          toast.error(res.error || "Failed to update default account");
        }
      });
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch 
        checked={isDefault}
        onCheckedChange={onCheckedChange}
        disabled={isDefault || isPending}
        id={`default-${accountId}`}
      />
      <Label htmlFor={`default-${accountId}`} className="text-sm cursor-pointer whitespace-nowrap">
        {isDefault ? "Default" : "Set as Default"}
      </Label>
    </div>
  );
}
