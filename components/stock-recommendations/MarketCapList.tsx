"use client"

import useSWR from "swr"
import type { MarketCapEntry } from "@/types/stock"
import { useRealtimePrice } from "@/hooks/useRealtimePrice"
import { usePriceFlash } from "@/hooks/usePriceFlash"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatMarketCap(억: number): string {
  if (억 >= 10_000) return `${(억 / 10_000).toFixed(1)}조`
  return `${억.toLocaleString("ko-KR")}억`
}

function PriceCell({ price }: { price: number | null }) {
  const flash = usePriceFlash(price)
  return (
    <span
      className={`tabular-nums font-medium rounded px-1 ${
        flash === "up" ? "price-flash-up" : flash === "down" ? "price-flash-down" : ""
      }`}
    >
      {price != null && price > 0 ? price.toLocaleString("ko-KR") : "—"}
    </span>
  )
}

function ChangeRateBadge({ rate }: { rate: number }) {
  const isUp = rate > 0
  const isFlat = rate === 0
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium tabular-nums ${
        isFlat
          ? "text-muted-foreground"
          : isUp
          ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
          : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
      }`}
    >
      {isFlat ? "0.00%" : `${isUp ? "+" : ""}${rate.toFixed(2)}%`}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-muted animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export function MarketCapList() {
  const { data, isLoading } = useSWR<{ data: MarketCapEntry[] }>(
    "/api/market/cap-rank",
    fetcher,
    { refreshInterval: 60_000 }
  )

  const entries = data?.data ?? []
  const codes = entries.map((e) => e.stock_code)
  const prices = useRealtimePrice(codes)

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-16 text-center">데이터 없음</p>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
              <th className="text-center px-4 py-2.5 font-medium w-10">#</th>
              <th className="text-left px-4 py-2.5 font-medium">종목</th>
              <th className="text-right px-4 py-2.5 font-medium">현재가</th>
              <th className="text-right px-4 py-2.5 font-medium">등락률</th>
              <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">시총</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((e) => {
              const livePrice = prices.get(e.stock_code) ?? e.current_price
              return (
                <tr key={e.rank} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground font-medium">
                    {e.rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.stock_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{e.stock_code}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PriceCell price={livePrice > 0 ? livePrice : null} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChangeRateBadge rate={e.change_rate} />
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs tabular-nums hidden sm:table-cell">
                    {e.market_cap > 0 ? formatMarketCap(e.market_cap) : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
