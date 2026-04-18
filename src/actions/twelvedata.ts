"use server"

import { getStockProfile, getStockTimeSeries, getBatchQuotes } from "@/lib/twelvedata";

export async function fetchStockProfile(symbol: string) {
  return await getStockProfile(symbol);
}

export async function fetchStockTimeSeries(symbol: string) {
  return await getStockTimeSeries(symbol);
}

export async function fetchBatchQuotes(symbols: string[]) {
  return await getBatchQuotes(symbols);
}
