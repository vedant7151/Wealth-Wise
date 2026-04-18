import { getUserPortfolio } from "@/actions/stocks"
import { getWallet } from "@/actions/wallet"
import { fetchBatchQuotes } from "@/actions/twelvedata"
import { StocksDashboardClient } from "@/components/stocks/stocks-dashboard-client"

export default async function StocksPage() {
  const [portfolioRes, walletRes] = await Promise.all([
    getUserPortfolio().catch(() => []),
    getWallet().catch(() => ({ error: "Failed" }))
  ])

  const portfolio = Array.isArray(portfolioRes) ? portfolioRes : []
  // walletRes might return { success: true, wallet: {...} }
  const walletBalance = (walletRes && !('error' in walletRes) && walletRes.wallet) 
    ? walletRes.wallet.balance 
    : 0

  // Fetch prices for all portfolio items
  const symbols = portfolio.map(item => item.symbol)
  const batchPrices = symbols.length > 0 ? await fetchBatchQuotes(symbols) : {}

  return (
    <StocksDashboardClient 
      portfolio={portfolio as any} 
      walletBalance={walletBalance} 
      batchPrices={batchPrices} 
    />
  )
}
