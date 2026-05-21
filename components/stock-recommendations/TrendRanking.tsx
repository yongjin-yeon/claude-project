"use client"

import { useState } from "react"
import useSWR from "swr"
import type { TrendEntry, VolumeRankEntry } from "@/types/stock"
import { useRealtimePrice } from "@/hooks/useRealtimePrice"
import { usePriceFlash } from "@/hooks/usePriceFlash"

const PERIODS = [5, 20, 60] as const
type Period = (typeof PERIODS)[number]
type Tab = "trend" | "volume"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000_000) return `${(amount / 1_000_000_000_000).toFixed(1)}조`
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(0)}억`
  if (amount >= 10_000) return `${(amount / 10_000).toFixed(0)}만`
  return amount.toLocaleString("ko-KR")
}

function LivePrice({ price }: { price: number }) {
  const flash = usePriceFlash(price)
  return (
    <span
      className={`tabular-nums text-xs font-medium rounded px-0.5 ${
        flash === "up" ? "price-flash-up" : flash === "down" ? "price-flash-down" : ""
      }`}
    >
      {price.toLocaleString("ko-KR")}
    </span>
  )
}

function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-9 rounded bg-muted animate-pulse" />
      ))}
    </div>
  )
}

function TrendTab() {
  const [days, setDays] = useState<Period>(5)
  const { data, isLoading } = useSWR<{ data: TrendEntry[] }>(
    `/api/recommendations/trend?days=${days}`,
    fetcher
  )
  const entries = data?.data ?? []

  return (
    <>
      <div className="flex gap-1 mb-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setDays(p)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              days === p
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {p}일
          </button>
        ))}
      </div>

      {isLoading && <SkeletonRows />}

      {!isLoading && entries.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">데이터 없음</p>
      )}

      {!isLoading && entries.length > 0 && (
        <div className="space-y-px">
          {entries.map((e) => (
            <div
              key={e.stock_code}
              className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted/50 transition-colors"
            >
              <span className="w-4 text-center text-xs text-muted-foreground font-medium shrink-0">
                {e.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{e.stock_name}</div>
                <div className="text-xs text-muted-foreground">{e.stock_code}</div>
              </div>
              <span className="text-xs font-medium text-muted-foreground shrink-0">{e.count}건</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function VolumeTab() {
  const { data, isLoading } = useSWR<{ data: VolumeRankEntry[] }>(
    "/api/market/volume-rank",
    fetcher,
    { refreshInterval: 60_000 }
  )
  const entries = data?.data ?? []
  const codes = entries.map((e) => e.stock_code)
  const prices = useRealtimePrice(codes)

  if (isLoading) return <SkeletonRows />

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center">데이터 없음</p>
  }

  return (
    <div className="space-y-px">
      {entries.map((e) => {
        const livePrice = prices.get(e.stock_code) ?? e.current_price
        const isUp = e.change_rate > 0
        const isDown = e.change_rate < 0
        return (
          <div
            key={e.rank}
            className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted/50 transition-colors"
          >
            <span className="w-4 text-center text-xs text-muted-foreground font-medium shrink-0">
              {e.rank}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{e.stock_name}</div>
              <div className="text-xs text-muted-foreground">{formatAmount(e.trading_amount)}</div>
            </div>
            <div className="text-right shrink-0">
              {livePrice > 0 && <LivePrice price={livePrice} />}
              <div
                className={`text-xs tabular-nums ${
                  isUp
                    ? "text-red-600 dark:text-red-400"
                    : isDown
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground"
                }`}
              >
                {e.change_rate > 0 ? "+" : ""}{e.change_rate.toFixed(2)}%
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function TrendRanking() {
  const [tab, setTab] = useState<Tab>("trend")

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-border">
        {(["trend", "volume"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "trend" ? "추천 랭킹" : "거래대금"}
          </button>
        ))}
      </div>

      <div className="p-2">
        {tab === "trend" ? <TrendTab /> : <VolumeTab />}
      </div>
    </section>
  )
}
