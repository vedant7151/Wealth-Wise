import { getUserAccounts, switchPrimaryAccount } from "@/actions/accounts";
import { CreateAccountDialog } from "@/components/create-account-dialog";
import { EditAccountDialog } from "@/components/edit-account-dialog";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { DefaultAccountSwitch } from "@/components/default-account-switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";


export default async function AccountsPage() {
  const accounts = await getUserAccounts().catch((e) => {
    console.error("getUserAccounts failed:", e);
    return [];
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">Accounts</h1>
        <CreateAccountDialog />
      </div>

      {accounts.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No accounts found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              You haven&apos;t added any bank accounts yet.
            </p>
            <CreateAccountDialog />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="relative overflow-hidden group">
              {account.isDefault && (
                <div className="absolute top-0 right-0 h-10 w-10">
                  <div className="absolute transform rotate-45 bg-emerald-500 text-center text-white font-semibold py-1 right-[-35px] top-[10px] w-[110px] text-[10px]">
                    DEFAULT
                  </div>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{account.name}</CardTitle>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditAccountDialog account={account as any} />
                    <DeleteAccountDialog account={account} />
                  </div>
                </div>
                <CardDescription>
                  <Badge variant="outline" className="mt-1">
                    {account.type}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center bg-muted/50 py-3">
                <div className="min-w-[110px] flex items-center">
                  <DefaultAccountSwitch accountId={account.id} isDefault={account.isDefault} />
                </div>

                <Link href={`/account/${account.id}`} className="text-sm font-medium text-emerald-500 hover:text-emerald-600 flex items-center">
                  View Details <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
