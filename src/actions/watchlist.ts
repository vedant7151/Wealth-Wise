"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function addToWatchlist(symbol: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    await prisma.watchlist.upsert({
      where: {
        userId_symbol: {
          userId: user.id,
          symbol,
        },
      },
      update: {},
      create: {
        userId: user.id,
        symbol,
      },
    });

    revalidatePath("/stocks");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function removeFromWatchlist(symbol: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    await prisma.watchlist.delete({
      where: {
        userId_symbol: {
          userId: user.id,
          symbol,
        },
      },
    });

    revalidatePath("/stocks");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getWatchlists() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const watchlists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, watchlists };
  } catch (error: any) {
    return { error: error.message };
  }
}
