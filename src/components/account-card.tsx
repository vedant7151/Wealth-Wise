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
        <Link href={`/account/${acc.id}`} className="block group">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                        <Wallet className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium text-sm group-hover:underline">{acc.name}</p>
                        <div className="flex gap-1 mt-0.5">
                            <Badge variant="outline" className="text-xs py-0">{acc.type}</Badge>
                            {acc.isDefault && (
                                <Badge className="text-xs py-0 bg-emerald-500">Default</Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <p className="font-semibold text-sm">
                        ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <DefaultAccountSwitch accountId={acc.id} isDefault={acc.isDefault} />
                    </div>
                </div>
            </div>
        </Link>
    );
}