"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function getWallet() {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
    if (!user) throw new Error("User not found")

    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        }
      }
    })

    if (!wallet) {
      // Auto-provision wallet
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
        include: {
          transactions: true
        }
      })
    }

    return { success: true, wallet }
  } catch (error: any) {
    return { error: error.message }
  }
}

const fundSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01")
})

export type WalletFormState = { error?: string; success?: boolean }

export async function addFundsAction(
  _prev: WalletFormState | null,
  formData: FormData
): Promise<WalletFormState> {
  const accountId = String(formData.get("accountId") ?? "")
  const amountRaw = formData.get("amount")
  
  const parsed = fundSchema.safeParse({
    accountId,
    amount: amountRaw,
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
    if (!user) throw new Error("User not found")

    const { amount, accountId: srcAccountId } = parsed.data

    // Begin transaction for safety
    await prisma.$transaction(async (tx) => {
      // 1. Check account
      const account = await tx.account.findUnique({
        where: { id: srcAccountId, userId: user.id }
      })
      if (!account) throw new Error("Bank account not found")
      
      // We don't block on account balance being low, typical for overdrafts or credit, but we update its balance
      await tx.account.update({
        where: { id: srcAccountId },
        data: { balance: { decrement: amount } }
      })

      // 2. Log normal transaction
      await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amount: amount,
          description: "Transfer to Wallet",
          date: new Date(),
          category: "Transfer",
          status: "COMPLETED",
          userId: user.id,
          accountId: srcAccountId
        }
      })

      // 3. Update or create wallet
      const wallet = await tx.wallet.upsert({
        where: { userId: user.id },
        update: { balance: { increment: amount } },
        create: { userId: user.id, balance: amount }
      })

      // 4. Log wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount: amount,
          description: "Top-up from Bank Account",
          status: "COMPLETED"
        }
      })
    })

    revalidatePath("/wallet")
    revalidatePath("/stocks")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function withdrawFundsAction(
  _prev: WalletFormState | null,
  formData: FormData
): Promise<WalletFormState> {
  const accountId = String(formData.get("accountId") ?? "")
  const amountRaw = formData.get("amount")
  
  const parsed = fundSchema.safeParse({
    accountId,
    amount: amountRaw,
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
    if (!user) throw new Error("User not found")

    const { amount, accountId: destAccountId } = parsed.data

    await prisma.$transaction(async (tx) => {
      // 1. Check wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId: user.id }
      })
      if (!wallet || wallet.balance < amount) {
        throw new Error("Insufficient wallet balance")
      }

      // 2. Check destination account
      const account = await tx.account.findUnique({
        where: { id: destAccountId, userId: user.id }
      })
      if (!account) throw new Error("Destination bank account not found")

      // 3. Update wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } }
      })

      // 4. Log wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: amount,
          description: "Withdrawal to Bank Account",
          status: "COMPLETED"
        }
      })

      // 5. Update bank account
      await tx.account.update({
        where: { id: destAccountId },
        data: { balance: { increment: amount } }
      })

      // 6. Log normal transaction
      await tx.transaction.create({
        data: {
          type: "INCOME",
          amount: amount,
          description: "Transfer from Wallet",
          date: new Date(),
          category: "Transfer",
          status: "COMPLETED",
          userId: user.id,
          accountId: destAccountId
        }
      })
    })

    revalidatePath("/wallet")
    revalidatePath("/stocks")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
