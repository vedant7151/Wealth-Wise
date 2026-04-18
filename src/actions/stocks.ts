"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { getStockPrice } from "@/lib/twelvedata"

export type TradeResult = { error?: string; success?: boolean; price?: number; totalValue?: number }

export async function buyStockAction(
  symbol: string,
  quantity: number
): Promise<TradeResult> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
    if (!user) throw new Error("User not found")

    if (quantity <= 0) throw new Error("Quantity must be greater than zero")
    if (!symbol) throw new Error("Stock symbol is required")

    const upperSymbol = symbol.toUpperCase()

    // 1. Fetch real-time price
    const currentPrice = await getStockPrice(upperSymbol)
    if (!currentPrice) throw new Error("Could not fetch current price for " + upperSymbol)

    const totalCost = currentPrice * quantity

    // 2. Wrap the purchase in a Prisma transaction
    await prisma.$transaction(async (tx) => {
      // Check wallet balance
      const wallet = await tx.wallet.findUnique({
        where: { userId: user.id }
      })
      if (!wallet) throw new Error("Wallet not found. Please visit the Wallet page to activate it.")

      if (wallet.balance < totalCost) {
        throw new Error(`Insufficient wallet funds. Cost is $${totalCost.toFixed(2)}, balance is $${wallet.balance.toFixed(2)}`)
      }

      // Deduct balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance - totalCost }
      })

      // Add wallet transaction record
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: totalCost,
          description: `Bought ${quantity} shares of ${upperSymbol} @ $${currentPrice.toFixed(2)}`,
          status: "COMPLETED",
        }
      })

      // Update or create Portfolio
      const portfolio = await tx.portfolio.findUnique({
        where: { userId_symbol: { userId: user.id, symbol: upperSymbol } }
      })

      if (portfolio) {
        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: { 
            quantity: portfolio.quantity + quantity,
            totalSpent: portfolio.totalSpent + totalCost
          }
        })
      } else {
        await tx.portfolio.create({
          data: {
            userId: user.id,
            symbol: upperSymbol,
            quantity: quantity,
            totalSpent: totalCost
          }
        })
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/stocks")
    revalidatePath("/wallet")
    return { success: true, price: currentPrice, totalValue: totalCost }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function sellStockAction(
  symbol: string,
  quantity: number
): Promise<TradeResult> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
    if (!user) throw new Error("User not found")

    if (quantity <= 0) throw new Error("Quantity must be greater than zero")
    if (!symbol) throw new Error("Stock symbol is required")

    const upperSymbol = symbol.toUpperCase()

    // 1. Check portfolio ownership
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId_symbol: { userId: user.id, symbol: upperSymbol } }
    })

    if (!portfolio || portfolio.quantity < quantity) {
      throw new Error(`You do not own enough shares of ${upperSymbol}. Owned: ${portfolio?.quantity || 0}`)
    }

    // 2. Fetch real-time price
    const currentPrice = await getStockPrice(upperSymbol)
    if (!currentPrice) throw new Error("Could not fetch current price for " + upperSymbol)

    const totalReturn = currentPrice * quantity

    // 3. Wrap sale in Prisma transaction
    await prisma.$transaction(async (tx) => {
      // Find wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId: user.id }
      })
      if (!wallet) throw new Error("Wallet not found. Please visit the Wallet page to activate it.")

      // Add to balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance + totalReturn }
      })

      // Add wallet transaction record
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount: totalReturn,
          description: `Sold ${quantity} shares of ${upperSymbol} @ $${currentPrice.toFixed(2)}`,
          status: "COMPLETED",
        }
      })

      // Update Portfolio
      const newQuantity = portfolio.quantity - quantity
      if (newQuantity <= 0) {
        await tx.portfolio.delete({
          where: { id: portfolio.id }
        })
      } else {
        const proportion = newQuantity / portfolio.quantity
        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: { 
            quantity: newQuantity,
            totalSpent: portfolio.totalSpent * proportion
          }
        })
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/stocks")
    revalidatePath("/wallet")
    return { success: true, price: currentPrice, totalValue: totalReturn }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getUserPortfolio() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
  if (!user) throw new Error("User not found")

  return await prisma.portfolio.findMany({
    where: { userId: user.id },
    orderBy: { symbol: "asc" }
  })
}
