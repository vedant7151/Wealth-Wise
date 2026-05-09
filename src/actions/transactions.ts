"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]).default("COMPLETED"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional(),
  date: z.coerce.date(),
  category: z.string().min(1, "Category is required"),
  accountId: z.string().min(1, "Account is required"),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
});

export async function createTransaction(data: z.infer<typeof transactionSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const validatedData = transactionSchema.parse(data);

    // Get the account first to ensure it belongs to this user
    const account = await prisma.account.findUnique({
      where: { id: validatedData.accountId, userId: user.id }
    });

    if (!account) throw new Error("Account not found");

    // Use a transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Calculate next recurring date if it's recurring
      let nextRecurringDate = null;
      if (validatedData.isRecurring && validatedData.recurringInterval) {
        switch (validatedData.recurringInterval) {
          case "DAILY": nextRecurringDate = addDays(validatedData.date, 1); break;
          case "WEEKLY": nextRecurringDate = addWeeks(validatedData.date, 1); break;
          case "MONTHLY": nextRecurringDate = addMonths(validatedData.date, 1); break;
          case "YEARLY": nextRecurringDate = addYears(validatedData.date, 1); break;
        }
      }

      // 1. Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          type: validatedData.type,
          amount: validatedData.amount,
          description: validatedData.description,
          date: validatedData.date,
          category: validatedData.category,
          isRecurring: validatedData.isRecurring,
          recurringInterval: validatedData.recurringInterval,
          nextRecurringDate: nextRecurringDate,
          userId: user.id,
          accountId: account.id,
          status: validatedData.status
        }
      });

      // 2. Update the account balance, only if COMPLETED
      if (validatedData.status === "COMPLETED") {
        const balanceChange = validatedData.type === "INCOME" ? validatedData.amount : -validatedData.amount;

        await tx.account.update({
          where: { id: account.id },
          data: { balance: { increment: balanceChange } }
        });
      }

      return transaction;
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath(`/account/${account.id}`);

    return { success: true, transaction: result };
  } catch (error: any) {
    return { error: error.message };
  }
}

export type TransactionFormState = { error?: string; success?: boolean };

export async function createTransactionAction(
  _prev: TransactionFormState | null,
  formData: FormData
): Promise<TransactionFormState> {
  const type = formData.get("type");
  const accountId = String(formData.get("accountId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amountRaw = formData.get("amount");
  const dateRaw = formData.get("date");
  const descriptionRaw = formData.get("description");

  if (type !== "INCOME" && type !== "EXPENSE") {
    return { error: "Invalid transaction type" };
  }
  if (!accountId) {
    return { error: "Please select an account" };
  }
  if (!category) {
    return { error: "Please select a category" };
  }
  const amount = Number(String(amountRaw ?? ""));
  if (amountRaw === null || amountRaw === "" || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Please enter a valid amount" };
  }
  if (!dateRaw || String(dateRaw).trim() === "") {
    return { error: "Date is required" };
  }

  const descStr = String(descriptionRaw ?? "").trim();
  const result = await createTransaction({
    type,
    amount,
    description: descStr ? descStr : undefined,
    date: new Date(String(dateRaw)),
    category,
    accountId,
    status: formData.get("status") as any,
    isRecurring: formData.get("isRecurring") === "on",
  });

  if ("error" in result && result.error) {
    return { error: result.error };
  }
  return { success: true };
}

export async function getUserTransactions(options: {
  accountId?: string;
  type?: "INCOME" | "EXPENSE";
  category?: string;
  search?: string;
  isRecurring?: boolean;
} = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const where: any = { userId: user.id };

    if (options.accountId) where.accountId = options.accountId;
    if (options.type) where.type = options.type;
    if (options.category) where.category = options.category;
    if (options.isRecurring !== undefined) where.isRecurring = options.isRecurring;
    if (options.search) {
      where.description = { contains: options.search, mode: "insensitive" };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        account: {
          select: { name: true, id: true }
        }
      }
    });

    return { success: true, transactions };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteTransaction(transactionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    // Start a transaction to revert balance and delete transaction
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId, userId: user.id }
      });

      if (!transaction) throw new Error("Transaction not found");

      // Reverse the balance change, only if it was COMPLETED
      if (transaction.status === "COMPLETED") {
        const balanceChange = transaction.type === "INCOME" ? -transaction.amount : transaction.amount;

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } }
        });
      }

      // Delete the transaction
      await tx.transaction.delete({
        where: { id: transactionId }
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateTransaction(
  transactionId: string,
  data: {
    type: "INCOME" | "EXPENSE";
    amount: number;
    description?: string;
    date: Date;
    category: string;
    accountId: string;
    status: "PENDING" | "COMPLETED" | "FAILED";
    isRecurring: boolean;
    recurringInterval?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: { id: transactionId, userId: user.id },
      });
      if (!existing) throw new Error("Transaction not found");

      // Reverse the original balance change if it was COMPLETED
      if (existing.status === "COMPLETED") {
        const reversal = existing.type === "INCOME" ? -existing.amount : existing.amount;
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: reversal } },
        });
      }

      // Apply the new balance change if it is now COMPLETED
      if (data.status === "COMPLETED") {
        const newChange = data.type === "INCOME" ? data.amount : -data.amount;
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { increment: newChange } },
        });
      }

      // Calculate next recurring date for edit
      let nextRecurringDate = null;
      if (data.isRecurring && data.recurringInterval) {
        switch (data.recurringInterval) {
          case "DAILY": nextRecurringDate = addDays(data.date, 1); break;
          case "WEEKLY": nextRecurringDate = addWeeks(data.date, 1); break;
          case "MONTHLY": nextRecurringDate = addMonths(data.date, 1); break;
          case "YEARLY": nextRecurringDate = addYears(data.date, 1); break;
        }
      }

      // Update the transaction
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          date: data.date,
          category: data.category,
          accountId: data.accountId,
          status: data.status,
          isRecurring: data.isRecurring,
          recurringInterval: data.recurringInterval,
          nextRecurringDate: nextRecurringDate,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath(`/account/${data.accountId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateTransactionAction(
  _prev: TransactionFormState | null,
  formData: FormData
): Promise<TransactionFormState> {
  const transactionId = String(formData.get("transactionId") ?? "").trim();
  const type = formData.get("type");
  const accountId = String(formData.get("accountId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amountRaw = formData.get("amount");
  const dateRaw = formData.get("date");
  const descriptionRaw = formData.get("description");

  if (!transactionId) {
    return { error: "Missing transaction" };
  }
  if (type !== "INCOME" && type !== "EXPENSE") {
    return { error: "Invalid transaction type" };
  }
  if (!accountId) {
    return { error: "Please select an account" };
  }
  if (!category) {
    return { error: "Please select a category" };
  }
  const amount = Number(String(amountRaw ?? ""));
  if (amountRaw === null || amountRaw === "" || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Please enter a valid amount" };
  }
  if (!dateRaw || String(dateRaw).trim() === "") {
    return { error: "Date is required" };
  }

  const descStr = String(descriptionRaw ?? "").trim();
  const result = await updateTransaction(transactionId, {
    type,
    amount,
    description: descStr ? descStr : undefined,
    date: new Date(String(dateRaw)),
    category,
    accountId,
    status: formData.get("status") as any,
    isRecurring: formData.get("isRecurring") === "on",
    recurringInterval: formData.get("recurringInterval") as any,
  });

  if ("error" in result && result.error) {
    return { error: result.error };
  }
  return { success: true };
}

export async function scanReceipt(formData: FormData) {
  try {
    const file = formData.get("receipt") as File;
    if (!file) throw new Error("No receipt file provided");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type
              }
            }
          ]
        }
      ]
    });

    let text = response.text;
    if (!text) throw new Error("Failed to process receipt");

    // Clean up markdown markers if present
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    try {
      const data = JSON.parse(cleanedText);
      if (Object.keys(data).length === 0) {
        throw new Error("Image does not appear to be a receipt");
      }
      return {
        success: true,
        data: {
          amount: parseFloat(data.amount),
          date: data.date ? new Date(data.date).toISOString().split('T')[0] : undefined,
          description: data.description,
          category: data.category,
          merchantName: data.merchantName,
        }
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error: any) {
    console.error("Error scanning receipt:", error);
    return { error: error.message || "Failed to scan receipt" };
  }
}

export async function getRecurringTemplates(accountId?: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const where: any = { 
      userId: user.id,
      isRecurring: true,
      nextRecurringDate: { not: null }
    };

    if (accountId) {
      where.accountId = accountId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { nextRecurringDate: "asc" },
      include: {
        account: {
          select: { name: true, id: true }
        }
      }
    });

    return { success: true, transactions };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function cancelRecurringTransaction(transactionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    await prisma.transaction.update({
      where: { id: transactionId, userId: user.id },
      data: {
        isRecurring: false,
        nextRecurringDate: null,
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
