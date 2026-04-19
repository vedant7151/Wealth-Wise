"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DefaultAccountSwitch } from "@/components/default-account-switch";

interface AccountCardProps {
    acc: {
        id: string;
        name: string;
        type: string;
        isDefault: boolean;
        balance: number;
    };
}

export function AccountCard({ acc }: AccountCardProps) {
    return (
        <div className="relative p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors group">
            <Link href={`/account/${acc.id}`} className="absolute inset-0 z-0" aria-label={`View account ${acc.name}`} />
            
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 relative z-10 pointer-events-none">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 flex-shrink-0 rounded-full bg-primary/10">
                        <Wallet className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-sm group-hover:underline truncate">{acc.name}</p>
                        <div className="flex gap-1 mt-0.5 pointer-events-auto">
                            <Badge variant="outline" className="text-xs py-0">{acc.type}</Badge>
                            {acc.isDefault && (
                                <Badge className="text-xs py-0 bg-emerald-500">Default</Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right flex flex-col sm:items-end gap-2 flex-shrink-0 pointer-events-auto">
                    <p className="font-semibold text-sm">
                        ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <DefaultAccountSwitch accountId={acc.id} isDefault={acc.isDefault} />
                </div>
            </div>
        </div>
    );
}