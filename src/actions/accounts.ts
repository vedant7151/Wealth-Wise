"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.coerce.number().min(0, "Balance must be positive"),
  isDefault: z.boolean().default(false),
})

export type CreateAccountFormState = { error?: string; success?: boolean }

/** Form `action` for `<form action={…}>` — keeps submission off the client async path (avoids dev refresh loops). */
export async function createAccountAction(
  _prev: CreateAccountFormState | null,
  formData: FormData
): Promise<CreateAccountFormState> {
  const name = String(formData.get("name") ?? "").trim()
  const type = formData.get("type")
  const balanceRaw = formData.get("balance")
  const isDefault = formData.get("isDefault") === "on"

  if (type !== "CURRENT" && type !== "SAVINGS") {
    return { error: "Please select an account type" }
  }

  const balance =
    balanceRaw === "" || balanceRaw === null ? 0 : Number(String(balanceRaw))
  const safeBalance = Number.isFinite(balance) ? balance : 0

  const result = await createAccount({
    name,
    type,
    balance: safeBalance,
    isDefault,
  })
  if ("error" in result && result.error) {
    return { error: result.error }
  }
  return { success: true }
}

export async function createAccount(data: z.infer<typeof accountSchema>) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
    if (!user) throw new Error("User not found")

    const validatedData = accountSchema.parse(data)

    const existingAccounts = await prisma.account.findMany({ where: { userId: user.id } })
    const shouldBeDefault = existingAccounts.length === 0 ? true : validatedData.isDefault

    if (shouldBeDefault) {
      await prisma.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const account = await prisma.account.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        balance: validatedData.balance,
        isDefault: shouldBeDefault,
        userId: user.id,
      }
    })

    if (validatedData.balance > 0) {
      await prisma.transaction.create({
        data: {
          type: "INCOME",
          amount: validatedData.balance,
          description: "Initial Balance",
          date: new Date(),
          category: "Initial",
          status: "COMPLETED",
          userId: user.id,
          accountId: account.id
        }
      })
    }

    revalidatePath("/dashboard")
    revalidatePath("/accounts")
    return { success: true, account }
  } catch (error: any) {
    return { error: error.message }
  }
}

const updateAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  isDefault: z.boolean().default(false),
})

export type UpdateAccountFormState = { error?: string; success?: boolean }

export async function updateAccountAction(
  _prev: UpdateAccountFormState | null,
  formData: FormData
): Promise<UpdateAccountFormState> {
  const accountId = String(formData.get("accountId") ?? "").trim()
  const name = String(formData.get("name") ?? "").trim()
  const type = formData.get("type")
  const isDefault = formData.get("isDefault") === "on"

  if (!accountId) return { error: "Account ID is required" }
  if (type !== "CURRENT" && type !== "SAVINGS") {
    return { error: "Please select an account type" }
  }

  const result = await updateAccount(accountId, { name, type, isDefault })
  if ("error" in result && result.error) {
    return { error: result.error }
  }
  return { success: true }
}

export async function updateAccount(
  accountId: string,
  data: z.infer<typeof updateAccountSchema>
) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
    if (!user) throw new Error("User not found")

    const validatedData = updateAccountSchema.parse(data)

    const account = await prisma.account.findUnique({
      where: { id: accountId, userId: user.id },
    })
    if (!account) throw new Error("Account not found")

    if (validatedData.isDefault && !account.isDefault) {
      await prisma.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: {
        name: validatedData.name,
        type: validatedData.type,
        isDefault: validatedData.isDefault,
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/accounts")
    return { success: true, account: updated }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getUserAccounts() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
  if (!user) throw new Error("User not found")

  return await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  })
}

export async function switchPrimaryAccount(accountId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
    if (!user) throw new Error("User not found")

    await prisma.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false }
    })

    await prisma.account.update({
      where: { id: accountId, userId: user.id },
      data: { isDefault: true }
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getAccountWithTransactions(accountId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const account = await prisma.account.findUnique({
    where: { id: accountId, userId: user.id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
      },
      _count: {
        select: { transactions: true }
      }
    }
  });

  if (!account) return null;
  return account;
}

export async function deleteAccount(accountId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const account = await prisma.account.findUnique({
      where: { id: accountId, userId: user.id }
    });

    if (!account) throw new Error("Account not found");

    if (account.isDefault) {
      const remainingAccounts = await prisma.account.findMany({
        where: { userId: user.id, id: { not: accountId } }
      });

      if (remainingAccounts.length > 0) {
        await prisma.account.update({
          where: { id: remainingAccounts[0].id },
          data: { isDefault: true }
        });
      } else {
        throw new Error("Cannot delete the last default account");
      }
    }

    await prisma.account.delete({
      where: { id: accountId }
    });

    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
