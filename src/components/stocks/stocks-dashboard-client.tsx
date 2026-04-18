"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { StockDetailsDrawer } from "./stock-details-drawer"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

interface StocksDashboardClientProps {
  portfolio: { symbol: string; quantity: number; totalSpent: number }[]
  walletBalance: number
  batchPrices: Record<string, number>
}

export function StocksDashboardClient({ portfolio, walletBalance, batchPrices }: StocksDashboardClientProps) {
  const [searchSymbol, setSearchSymbol] = useState("")
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchSymbol.trim()) {
      setActiveSymbol(searchSymbol.toUpperCase())
      setSearchSymbol("")
    }
  }

  // Calculate total portfolio value and generate chart data
  let totalPortfolioValue = 0
  let totalInvested = 0
  const pieData = portfolio.map(item => {
    const currentPrice = batchPrices[item.symbol] || 0
    const value = currentPrice * item.quantity
    totalPortfolioValue += value
    totalInvested += item.totalSpent
    return { name: item.symbol, value }
  }).filter(item => item.value > 0)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']
  
  const totalGainLoss = totalPortfolioValue - totalInvested
  const isPositive = totalGainLoss >= 0

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stocks & Investments</h2>
          <p className="text-muted-foreground mt-2">
            Manage your stock portfolio. <Link href="/wallet" className="text-primary hover:underline">Wallet Balance: ${walletBalance.toFixed(2)}</Link>
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full">
          <Input 
            placeholder="Search symbol (e.g. AAPL)" 
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4 mr-2" />
            Lookup
          </Button>
        </form>
      </div>

      {portfolio.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Value</span>
                  <span className="font-semibold text-lg">${totalPortfolioValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Invested</span>
                  <span>${totalInvested.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t mt-2">
                  <span className="text-muted-foreground">Total Return</span>
                  <span className={`font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : '-'}${Math.abs(totalGainLoss).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Allocation</CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] w-full pb-0 -mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {portfolio.length === 0 ? (
          <Card className="col-span-full border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <p>You don't own any stocks yet.</p>
              <p className="text-sm mt-1">Search for a ticker symbol above to start trading from your wallet.</p>
            </CardContent>
          </Card>
        ) : (
          portfolio.map((stock) => {
            const currentPrice = batchPrices[stock.symbol] || 0
            const currentValue = currentPrice * stock.quantity
            const gainLoss = currentValue - stock.totalSpent
            const isGain = gainLoss >= 0

            return (
              <Card 
                key={stock.id || stock.symbol} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setActiveSymbol(stock.symbol)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-2xl">{stock.symbol}</CardTitle>
                    <div className="text-right">
                      <div className="font-semibold text-lg">${currentPrice.toFixed(2)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                    <span className="text-muted-foreground">{stock.quantity} shares</span>
                    <span className={isGain ? 'text-emerald-500' : 'text-red-500'}>
                      {isGain ? '+' : '-'}${Math.abs(gainLoss).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <StockDetailsDrawer 
        symbol={activeSymbol || ""}
        open={!!activeSymbol}
        onClose={() => setActiveSymbol(null)}
        walletBalance={walletBalance}
        ownedQuantity={portfolio.find(p => p.symbol === activeSymbol)?.quantity || 0}
        currentPrice={activeSymbol ? batchPrices[activeSymbol] : null}
      />
    </div>
  )
}
