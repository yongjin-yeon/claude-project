"use client"

import useSWR from "swr"
import type { MarketCapEntry } from "@/types/stock"
import { useRealtimePrice } from "@/hooks/useRealtimePrice"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatMarketCap(억: number): string {
  if (억 >= 10_000) return `${(억 / 10_000).toFixed(1)}조`
  return `${억.toLocaleString("ko-KR")}억`
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
      <div className="space-y-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">데이터 없음</p>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2rem_1fr_auto] gap-2 px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-b border-border">
        <span>#</span>
        <span>종목</span>
        <span className="text-right">현재가 / 시총</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {entries.map((e) => {
          const livePrice = prices.get(e.stock_code) ?? e.current_price
          return (
            <div key={e.rank} className="grid grid-cols-[2rem_1fr_auto] gap-2 px-3 py-2.5 text-sm items-center">
              <span className="text-xs text-muted-foreground font-medium text-center">
                {e.rank}
              </span>
              <div>
                <div className="font-medium">{e.stock_name}</div>
                <div className="text-xs text-muted-foreground">{e.stock_code}</div>
              </div>
              <div className="text-right">
                <div className="font-medium tabular-nums">
                  {livePrice > 0 ? livePrice.toLocaleString("ko-KR") : "—"}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {e.market_cap > 0 ? formatMarketCap(e.market_cap) : "—"}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
