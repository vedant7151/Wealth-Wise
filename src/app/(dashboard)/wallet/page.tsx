import { getWallet } from "@/actions/wallet";
import { getUserAccounts } from "@/actions/accounts";
import { WalletTransferDialog } from "@/components/wallet/wallet-transfer-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default async function WalletPage() {
  const [walletRes, accounts] = await Promise.all([
    getWallet(),
    getUserAccounts().catch(() => [])
  ]);

  if (walletRes.error || !walletRes.wallet) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-red-500">Failed to load wallet.</p>
      </div>
    );
  }

  const { wallet } = walletRes;
  const transactions = wallet.transactions || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">Trading Wallet</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg opacity-80">Available Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-6">
              ${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex gap-3">
              <WalletTransferDialog type="add" accounts={accounts} walletBalance={wallet.balance} />
              <WalletTransferDialog type="withdraw" accounts={accounts} walletBalance={wallet.balance} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Your Wallet</CardTitle>
            <CardDescription>
              Your wallet is a dedicated brokerage cash account used strictly for buying and selling stocks on the platform. Keeping this separate from your standard bank accounts ensures your monthly budget tracking remains accurate and unaffected by your trading volumes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent LEDGER</CardTitle>
          <CardDescription>A history of cash moving in and out of your wallet.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No wallet transactions found.</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0 hover:bg-muted/30 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {tx.type === 'CREDIT' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), 'PPpp')}</p>
                    </div>
                  </div>
                  <div className={`font-semibold ${tx.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
