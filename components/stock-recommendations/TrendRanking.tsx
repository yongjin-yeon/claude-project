"use client"

import { useState } from "react"
import useSWR from "swr"
import type { TrendEntry } from "@/types/stock"

const PERIODS = [5, 20, 60] as const
type Period = (typeof PERIODS)[number]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TrendRanking() {
  const [days, setDays] = useState<Period>(5)

  const { data, isLoading } = useSWR<{ data: TrendEntry[] }>(
    `/api/recommendations/trend?days=${days}`,
    fetcher
  )

  const entries = data?.data ?? []

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold">트렌드 랭킹</h2>
        <div className="flex gap-1">
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
      </div>

      {isLoading && (
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">데이터 없음</p>
      )}

      {!isLoading && entries.length > 0 && (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {entries.map((e) => (
            <div key={e.stock_code} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="w-5 text-center text-xs text-muted-foreground font-medium">
                {e.rank}
              </span>
              <span className="flex-1 font-medium">{e.stock_name}</span>
              <span className="text-xs text-muted-foreground">{e.stock_code}</span>
              <span className="text-xs font-medium tabular-nums">{e.count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
