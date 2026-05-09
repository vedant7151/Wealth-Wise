import { getUserPortfolio } from "@/actions/stocks"
import { getWallet } from "@/actions/wallet"
import { fetchBatchQuotes } from "@/actions/twelvedata"
import { getWatchlists } from "@/actions/watchlist"
import { StocksDashboardClient } from "@/components/stocks/stocks-dashboard-client"

export default async function StocksPage() {
  const [portfolioRes, walletRes, watchlistRes] = await Promise.all([
    getUserPortfolio().catch(() => []),
    getWallet().catch(() => ({ error: "Failed" })),
    getWatchlists().catch(() => ({ error: "Failed" }))
  ])

  const portfolio = Array.isArray(portfolioRes) ? portfolioRes : []
  // walletRes might return { success: true, wallet: {...} }
  const walletBalance = (walletRes && !('error' in walletRes) && walletRes.wallet) 
    ? walletRes.wallet.balance 
    : 0

  const watchlists = (watchlistRes && !('error' in watchlistRes) && watchlistRes.success)
    ? watchlistRes.watchlists
    : []

  // Fetch prices for all portfolio items and watchlists
  const portfolioSymbols = portfolio.map((item: any) => item.symbol)
  const watchlistSymbols = watchlists.map((w: any) => w.symbol)
  const allSymbols = Array.from(new Set([...portfolioSymbols, ...watchlistSymbols]))
  
  const batchPrices = allSymbols.length > 0 ? await fetchBatchQuotes(allSymbols) : {}

  return (
    <StocksDashboardClient 
      portfolio={portfolio as any} 
      walletBalance={walletBalance} 
      batchPrices={batchPrices} 
      watchlists={watchlists}
    />
  )
}
