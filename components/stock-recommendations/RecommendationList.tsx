"use client"

import type { Recommendation } from "@/types/stock"
import { calcUpside } from "@/lib/calcUpside"
import { usePriceFlash } from "@/hooks/usePriceFlash"

interface Props {
  recommendations: Recommendation[]
  isLoading: boolean
  prices?: Map<string, number>
  onSelect?: (rec: Recommendation) => void
}

function UpsideBadge({ upside }: { upside: number | null }) {
  if (upside == null) return <span className="text-muted-foreground">—</span>
  const isUp = upside >= 0
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium tabular-nums ${
        isUp
          ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
          : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
      }`}
    >
      {isUp ? "+" : ""}{upside.toFixed(1)}%
    </span>
  )
}

function OpinionBadge({ opinion }: { opinion: string }) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
        opinion === "매수"
          ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
          : opinion === "매도"
          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {opinion}
    </span>
  )
}

function PriceCell({ price }: { price: number | null }) {
  const flash = usePriceFlash(price)
  return (
    <span
      className={`tabular-nums rounded px-1 transition-colors ${
        flash === "up" ? "price-flash-up" : flash === "down" ? "price-flash-down" : ""
      }`}
    >
      {price != null && price > 0 ? price.toLocaleString("ko-KR") : "—"}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr data-testid="skeleton-card">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-muted animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export function RecommendationList({ recommendations, isLoading, prices, onSelect }: Props) {
  return (
    <section>
      {isLoading && (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && recommendations.length === 0 && (
        <div className="mt-4 text-center text-muted-foreground py-16 border border-border rounded-lg">
          <p className="font-medium mb-1">추천종목이 없습니다</p>
          <p className="text-sm">장 시작 후 데이터가 자동으로 갱신됩니다</p>
        </div>
      )}

      {!isLoading && recommendations.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
                  <th className="text-center px-4 py-2.5 font-medium w-10">#</th>
                  <th className="text-left px-4 py-2.5 font-medium">종목</th>
                  <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">증권사</th>
                  <th className="text-center px-4 py-2.5 font-medium">의견</th>
                  <th className="text-right px-4 py-2.5 font-medium hidden md:table-cell">목표가</th>
                  <th className="text-right px-4 py-2.5 font-medium">현재가</th>
                  <th className="text-right px-4 py-2.5 font-medium">상승여력</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recommendations.map((rec, idx) => {
                  const currentPrice = prices?.get(rec.stock_code) ?? null
                  const upside = calcUpside(rec.target_price, currentPrice)
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => onSelect?.(rec)}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{rec.stock_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{rec.stock_code}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                        {rec.firm}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <OpinionBadge opinion={rec.opinion} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                        {rec.target_price.toLocaleString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 text-right" data-stock-code={rec.stock_code}>
                        <PriceCell price={currentPrice} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <UpsideBadge upside={upside} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
