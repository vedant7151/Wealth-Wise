"use client"

import { useState, useEffect } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { buyStockAction, sellStockAction } from "@/actions/stocks"
import { fetchStockProfile, fetchStockTimeSeries } from "@/actions/twelvedata"
import { Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const tradeSchema = z.object({
  quantity: z.coerce.number().min(0.01, "Quantity must be at least 0.01"),
})

interface StockDetailsDrawerProps {
  symbol: string
  open: boolean
  onClose: () => void
  walletBalance: number
  ownedQuantity: number
  currentPrice: number | null
}

export function StockDetailsDrawer({ symbol, open, onClose, walletBalance, ownedQuantity, currentPrice }: StockDetailsDrawerProps) {
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  
  const [tradeMode, setTradeMode] = useState<"buy" | "sell" | null>(null)
  const [loadingTrade, setLoadingTrade] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(tradeSchema),
    defaultValues: { quantity: 0 }
  })

  const watchQuantity = (watch("quantity") || 0) as number

  useEffect(() => {
    if (open && symbol) {
      setLoadingProfile(true)
      setTradeMode(null)
      reset()
      
      Promise.all([
        fetchStockProfile(symbol),
        fetchStockTimeSeries(symbol)
      ]).then(([prof, timeSeries]) => {
        setProfile(prof)
        setChartData(timeSeries)
      }).catch(err => {
        toast.error("Failed to fetch stock details")
      }).finally(() => {
        setLoadingProfile(false)
      })
    }
  }, [open, symbol, reset])

  const onSubmit: SubmitHandler<any> = async (data) => {
    if (!tradeMode) return

    setLoadingTrade(true)
    const actionName = tradeMode === "buy" ? "purchase" : "sale"
    const toastId = toast.loading(`Processing ${actionName}...`)

    try {
      const action = tradeMode === "buy" ? buyStockAction : sellStockAction
      const result = await action(symbol, data.quantity)

      if (result.error) {
        toast.error(result.error, { id: toastId })
      } else {
        toast.success(
          `Successfully ${tradeMode === "buy" ? "bought" : "sold"} ${data.quantity} shares of ${symbol.toUpperCase()} for $${result.totalValue?.toFixed(2)}`,
          { id: toastId }
        )
        reset()
        onClose()
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred", { id: toastId })
    } finally {
      setLoadingTrade(false)
    }
  }

  const estimatedTotal = currentPrice ? (watchQuantity * currentPrice) : 0
  const canBuy = walletBalance >= estimatedTotal
  const canSell = ownedQuantity >= watchQuantity

  return (
    <Drawer open={open} onOpenChange={(val) => !val && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto p-4 sm:p-6">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-3xl flex items-center justify-between">
              <span>{symbol.toUpperCase()}</span>
              {currentPrice && <span>${currentPrice.toFixed(2)}</span>}
            </DrawerTitle>
            <DrawerDescription>
              {loadingProfile ? "Loading details..." : profile?.name || "Stock Details"}
              {profile?.sector && <span className="ml-2 px-2 py-1 bg-muted rounded-full text-xs">{profile.sector}</span>}
            </DrawerDescription>
          </DrawerHeader>

          {!loadingProfile && chartData.length > 0 && (
            <div className="h-[250px] mt-4 mb-6 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    labelFormatter={(label) => new Date(label).toDateString()}
                  />
                  <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {!loadingProfile && profile?.description && (
            <div className="mb-6 text-sm text-muted-foreground line-clamp-3">
              {profile.description}
            </div>
          )}

          <div className="bg-muted/50 rounded-xl p-4 mb-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
              <p className="font-semibold">${walletBalance.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Shares Owned</p>
              <p className="font-semibold">{ownedQuantity}</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button 
              variant={tradeMode === "buy" ? "default" : "outline"} 
              className="flex-1" 
              onClick={() => setTradeMode("buy")}
            >
              Buy
            </Button>
            <Button 
              variant={tradeMode === "sell" ? "default" : "outline"} 
              className="flex-1"
              onClick={() => setTradeMode("sell")}
            >
              Sell
            </Button>
          </div>

          {tradeMode && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity to {tradeMode}</Label>
                <div className="flex gap-2 items-center">
                  <Input id="quantity" type="number" step="0.01" {...register("quantity")} className="text-lg" />
                  <div className="min-w-[100px] text-right">
                    <span className="text-sm text-muted-foreground">≈ ${estimatedTotal.toFixed(2)}</span>
                  </div>
                </div>
                {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                
                {tradeMode === "buy" && !canBuy && watchQuantity > 0 && (
                  <p className="text-xs text-destructive">Insufficient wallet balance. Top up your wallet first.</p>
                )}
                {tradeMode === "sell" && !canSell && watchQuantity > 0 && (
                  <p className="text-xs text-destructive">You do not own enough shares.</p>
                )}
              </div>

              <DrawerFooter className="px-0">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={loadingTrade || (tradeMode === "buy" && !canBuy) || (tradeMode === "sell" && !canSell)}
                >
                  {loadingTrade && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm {tradeMode === "buy" ? "Buy" : "Sell"} {symbol.toUpperCase()}
                </Button>
              </DrawerFooter>
            </form>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
