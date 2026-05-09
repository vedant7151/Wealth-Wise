"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowLeft, TrendingUp, ChevronRight, Loader2, Eye, Plus, Trash2 } from "lucide-react"
import { StockDetailsDrawer } from "./stock-details-drawer"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip as RechartsTooltip } from "recharts"
import Link from "next/link"
import { fetchExploreStocks, fetchStockTimeSeries } from "@/actions/twelvedata"
import { addToWatchlist, removeFromWatchlist } from "@/actions/watchlist"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

interface StocksDashboardClientProps {
  portfolio: { symbol: string; quantity: number; totalSpent: number }[]
  walletBalance: number
  batchPrices: Record<string, number>
  watchlists?: { symbol: string }[]
}

function WatchlistCard({ watchlist, currentPrice, onRemove, onBuy }: { watchlist: any, currentPrice: number, onRemove: (sym: string) => void, onBuy: (sym: string) => void }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    fetchStockTimeSeries(watchlist.symbol).then(res => {
      if (!mounted) return;
      if (res && Array.isArray(res)) {
        setData(res)
      }
      setLoading(false)
    }).catch()
    return () => { mounted = false; }
  }, [watchlist.symbol])

  return (
    <Card className="flex flex-col">
       {loading ? (
         <CardContent className="p-6 flex gap-4 items-center">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
         </CardContent>
       ) : (
         <CardContent className="p-6">
           <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="text-xl font-bold">{watchlist.symbol}</h3>
               <p className="text-sm font-medium mt-1">${currentPrice ? currentPrice.toFixed(2) : "---"}</p>
             </div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={() => onBuy(watchlist.symbol)}>
                 Buy
               </Button>
               <Button variant="ghost" size="icon" onClick={() => onRemove(watchlist.symbol)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
               </Button>
             </div>
           </div>
           {data.length > 0 ? (
             <div className="h-[120px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <XAxis dataKey="date" hide />
                    <Area type="monotone" dataKey="price" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: any) => [`$${value}`, "Price"]} 
                      labelFormatter={(label) => `Date: ${label}`} 
                    />
                  </AreaChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div className="h-[120px] w-full flex items-center justify-center text-muted-foreground text-sm border-t">
               No chart data available
             </div>
           )}
         </CardContent>
       )}
    </Card>
  )
}

export function StocksDashboardClient({ portfolio, walletBalance, batchPrices, watchlists = [] }: StocksDashboardClientProps) {
  const [searchSymbol, setSearchSymbol] = useState("")
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null)
  const [view, setView] = useState<"portfolio" | "explore" | "watchlist">("portfolio")
  const [exploreStocks, setExploreStocks] = useState<any[]>([])
  const [isLoadingExplore, setIsLoadingExplore] = useState(false)
  const [selectedAlphabet, setSelectedAlphabet] = useState("A")
  const [displayLimit, setDisplayLimit] = useState(50)

  useEffect(() => {
    if (view === "explore" && exploreStocks.length === 0 && !isLoadingExplore) {
      setIsLoadingExplore(true)
      fetchExploreStocks().then((data) => {
        setExploreStocks(data)
        setIsLoadingExplore(false)
      }).catch(() => {
        setIsLoadingExplore(false)
      })
    }
  }, [view, exploreStocks.length, isLoadingExplore])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchSymbol.trim()) {
      setActiveSymbol(searchSymbol.toUpperCase())
      setSearchSymbol("")
    }
  }

  const handleAddToWatchlist = async (symbol: string) => {
    const toastId = toast.loading(`Adding ${symbol} to Watchlist...`);
    const res = await addToWatchlist(symbol);
    if ("error" in res && res.error) {
       toast.error(res.error, { id: toastId });
    } else {
       toast.success(`${symbol} added successfully to watchlist`, { id: toastId });
    }
  }

  const handleRemoveFromWatchlist = async (symbol: string) => {
    const toastId = toast.loading(`Removing ${symbol}...`);
    const res = await removeFromWatchlist(symbol);
    if ("error" in res && res.error) {
       toast.error(res.error, { id: toastId });
    } else {
       toast.success(`${symbol} removed.`, { id: toastId });
    }
  }

  const filteredStocks = exploreStocks.filter(s => s.symbol.toUpperCase().startsWith(selectedAlphabet))
  const displayedStocks = filteredStocks.slice(0, displayLimit)
  const hasMore = displayLimit < filteredStocks.length

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

        <div className="flex flex-col sm:flex-row gap-2 max-w-2xl w-full">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <Input
              placeholder="Search symbol (e.g. AAPL)"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          <div className="flex gap-2 shrink-0">
            <Button onClick={() => setView("portfolio")} variant={view === "portfolio" ? "default" : "outline"}>
               Portfolio
            </Button>
            <Button onClick={() => setView("explore")} variant={view === "explore" ? "default" : "outline"}>
               <TrendingUp className="h-4 w-4 mr-2" /> Explore
            </Button>
            <Button onClick={() => setView("watchlist")} variant={view === "watchlist" ? "default" : "outline"}>
               <Eye className="h-4 w-4 mr-2" /> Watchlist
            </Button>
          </div>
        </div>
      </div>

      {view === "explore" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-wrap gap-2">
            {ALPHABET.map((letter) => (
              <Button
                key={letter}
                variant={selectedAlphabet === letter ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0 shrink-0"
                onClick={() => {
                  setSelectedAlphabet(letter)
                  setDisplayLimit(50)
                }}
              >
                {letter}
              </Button>
            ))}
          </div>

          {isLoadingExplore ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Fetching latest market data...</p>
            </div>
          ) : exploreStocks.length > 0 ? (
            <>
              {displayedStocks.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {displayedStocks.map((stock) => {
                     const inWatchlist = watchlists.some(w => w.symbol === stock.symbol);
                     return (
                      <Card key={stock.symbol} className="flex flex-col justify-between group relative">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="pr-8">
                              <CardTitle className="text-xl">{stock.symbol}</CardTitle>
                              <CardDescription className="text-sm font-medium mt-1">{stock.name}</CardDescription>
                            </div>
                            {!inWatchlist && (
                               <Button 
                                 variant="outline" 
                                 size="icon" 
                                 className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100 h-8 w-8 rounded-full"
                                 title="Add to Watchlist"
                                 onClick={() => handleAddToWatchlist(stock.symbol)}
                               >
                                 <Plus className="h-4 w-4" />
                               </Button>
                            )}
                            {inWatchlist && (
                               <span title="In Watchlist" className="absolute top-4 right-4"><Eye className="h-4 w-4 text-muted-foreground" /></span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{stock.description}</p>
                        </CardHeader>
                        <CardContent className="pt-0 mt-auto">
                          <Button 
                            className="w-full mt-2" 
                            variant="secondary"
                            onClick={() => setActiveSymbol(stock.symbol)}
                          >
                            Buy <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center p-12 text-muted-foreground">
                  No stocks found starting with "{selectedAlphabet}".
                </div>
              )}
              
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button onClick={() => setDisplayLimit((prev) => prev + 50)} variant="secondary">
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-12 text-muted-foreground">
              Failed to load market data or rate limit reached.
            </div>
          )}
        </div>
      )}

      {view === "watchlist" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
           <h3 className="text-xl font-medium tracking-tight border-b pb-2">Your Watchlist</h3>
           {watchlists.length === 0 ? (
               <div className="text-center p-12 text-muted-foreground bg-muted/20 border-dashed border rounded-xl">
                 <Eye className="h-8 w-8 mx-auto mb-3 opacity-50" />
                 <p>You aren't watching any stocks yet.</p>
                 <Button variant="outline" className="mt-4" onClick={() => setView("explore")}>
                   Explore Markets
                 </Button>
               </div>
           ) : (
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {watchlists.map(w => (
                    <WatchlistCard 
                      key={w.symbol} 
                      watchlist={w} 
                      currentPrice={batchPrices[w.symbol]} 
                      onRemove={handleRemoveFromWatchlist}
                      onBuy={setActiveSymbol}
                    />
                 ))}
               </div>
           )}
        </div>
      )}

      {view === "portfolio" && (
        <div className="space-y-6 animate-in fade-in">
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
                      <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
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
                  <p className="text-sm mt-1">Search or explore the markets to start trading.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setView("explore")}>
                    <TrendingUp className="h-4 w-4 mr-2" /> Explore Markets
                  </Button>
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
                    key={stock.symbol}
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
        </div>
      )}

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
