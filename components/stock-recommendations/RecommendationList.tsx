"use client"

import type { Recommendation } from "@/types/stock"
import { calcUpside } from "@/lib/calcUpside"

interface Props {
  recommendations: Recommendation[]
  isLoading: boolean
  prices?: Map<string, number>
  onSelect?: (rec: Recommendation) => void
}

function SkeletonCard() {
  return (
    <div
      data-testid="skeleton-card"
      className="rounded-lg border border-border bg-card p-3 animate-pulse"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-4 w-12 rounded bg-muted" />
      </div>
      <div className="h-3 w-48 rounded bg-muted" />
    </div>
  )
}

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR")
}

function formatUpside(upside: number | null): string {
  if (upside == null) return "—"
  return `${upside >= 0 ? "+" : ""}${upside.toFixed(1)}%`
}

export function RecommendationList({ recommendations, isLoading, prices, onSelect }: Props) {
  return (
    <section>
      <h1 className="text-lg font-bold mb-1">오늘의 추천종목</h1>

      {isLoading && (
        <div className="flex flex-col gap-2 mt-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!isLoading && recommendations.length === 0 && (
        <div className="mt-8 text-center text-muted-foreground py-12 border border-border rounded-lg bg-card">
          <p className="font-medium mb-1">오늘의 추천종목이 아직 없습니다</p>
          <p className="text-sm">장 시작 후 데이터가 자동으로 갱신됩니다</p>
        </div>
      )}

      {!isLoading && recommendations.length > 0 && (
        <div className="mt-3">
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">종목명</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">증권사</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">투자의견</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">목표가</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">현재가</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">상승여력</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => onSelect?.(rec)}
                    className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium">{rec.stock_name}</div>
                      <div className="text-xs text-muted-foreground">{rec.stock_code}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{rec.firm}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          rec.opinion === "매수"
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {rec.opinion}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">{formatPrice(rec.target_price)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground" data-stock-code={rec.stock_code}>
                      {prices?.get(rec.stock_code)?.toLocaleString("ko-KR") ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {formatUpside(calcUpside(rec.target_price, prices?.get(rec.stock_code) ?? null))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-2 md:hidden">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => onSelect?.(rec)}
                className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rec.stock_name}</span>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                        rec.opinion === "매수"
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {rec.opinion}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatUpside(calcUpside(rec.target_price, prices?.get(rec.stock_code) ?? null))}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{rec.firm}</span>
                  <span>목표 {formatPrice(rec.target_price)}원</span>
                  <span>현재 {prices?.get(rec.stock_code)?.toLocaleString("ko-KR") ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
