"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCurrentBudget() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return { success: false, error: "User not found" };

    const budget = await prisma.budget.findUnique({
      where: { userId: user.id }
    });

    return { success: true, budget };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function upsertBudget(amount: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    if (amount <= 0) throw new Error("Budget amount must be positive");

    const budget = await prisma.budget.upsert({
      where: { userId: user.id },
      update: { amount },
      create: { 
        userId: user.id,
        amount
      }
    });

    revalidatePath("/dashboard");
    return { success: true, budget };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getBudgetProgress() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return { success: false, error: "User not found" };

    const budget = await prisma.budget.findUnique({
      where: { userId: user.id }
    });

    if (!budget) return { success: true, budget: null, spent: 0 };

    // Find default account to calculate expenses from
    const defaultAccount = await prisma.account.findFirst({
      where: { userId: user.id, isDefault: true }
    });

    if (!defaultAccount) return { success: true, budget, spent: 0, progress: 0 };

    // Calculate current month's start and end dates
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get total expenses for current month for the default account
    const expenses = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        accountId: defaultAccount.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        amount: true
      }
    });

    const spent = expenses._sum.amount || 0;

    return { 
      success: true, 
      budget, 
      spent,
      progress: (spent / budget.amount) * 100
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
