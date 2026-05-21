"use client"

import useSWR from "swr"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Recommendation, ConsensusData } from "@/types/stock"
import { calcUpside } from "@/lib/calcUpside"
import { useRealtimePrice } from "@/hooks/useRealtimePrice"

interface Props {
  selected: Recommendation | null
  onClose: () => void
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function StockDetailModal({ selected, onClose }: Props) {
  const { data, isLoading } = useSWR<{ data: ConsensusData }>(
    selected ? `/api/recommendations/${selected.stock_code}` : null,
    fetcher
  )

  const prices = useRealtimePrice(selected ? [selected.stock_code] : [])
  const currentPrice = selected ? (prices.get(selected.stock_code) ?? null) : null
  const consensus = data?.data

  return (
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selected?.stock_name}
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              {selected?.stock_code}
            </span>
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
            불러오는 중...
          </div>
        )}

        {consensus && (
          <div className="space-y-4">
            {currentPrice != null && (
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold">
                  {currentPrice.toLocaleString("ko-KR")}원
                </span>
                <span className="text-sm text-muted-foreground">
                  상승여력{" "}
                  {(() => {
                    const u = calcUpside(consensus.avg_target_price, currentPrice)
                    return u != null ? `${u >= 0 ? "+" : ""}${u.toFixed(1)}%` : "—"
                  })()}
                </span>
              </div>
            )}

            {/* Consensus summary */}
            <div className="rounded-lg border border-border p-3 grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">평균 목표가</div>
                <div className="font-medium">
                  {consensus.avg_target_price.toLocaleString("ko-KR")}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">매수</div>
                <div className="font-medium">{consensus.buy_count}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">중립</div>
                <div className="font-medium">{consensus.neutral_count}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">매도</div>
                <div className="font-medium">{consensus.sell_count}</div>
              </div>
            </div>

            {/* Price history chart */}
            {consensus.price_history.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">목표가 추이</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={consensus.price_history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="target_price"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Firm list */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">증권사별 리포트</p>
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {consensus.reports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between px-3 py-2 text-sm gap-2"
                  >
                    <span className="font-medium w-20 shrink-0">{r.firm}</span>
                    <span className="text-muted-foreground text-xs">{r.report_date}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        r.opinion === "매수"
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.opinion}
                    </span>
                    <span className="text-right">{r.target_price.toLocaleString("ko-KR")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
