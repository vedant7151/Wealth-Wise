"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import { deleteAccount } from "@/actions/accounts";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";

interface AccountData {
  id: string;
  name: string;
}

export function DeleteAccountDialog({ account }: { account: AccountData }) {
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setConfirmName("");
    }
  };

  const handleDelete = async () => {
    if (confirmName !== account.name) return;

    setIsPending(true);
    try {
      const result = await deleteAccount(account.id);
      if (result.success) {
        toast.success("Account deleted successfully!");
        setOpen(false);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleOpenChange(true);
        }}
        className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
        aria-label="Delete account"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and all associated data.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                To confirm, type <span className="font-bold italic">"{account.name}"</span> below:
              </p>
              <Input
                id="confirm-name"
                placeholder="Enter account name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending || confirmName !== account.name}
            >
              {isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
