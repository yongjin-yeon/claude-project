"use client"

import { useState } from "react"
import useSWR from "swr"
import { RecommendationList } from "@/components/stock-recommendations/RecommendationList"
import { StockDetailModal } from "@/components/stock-recommendations/StockDetailModal"
import { TrendRanking } from "@/components/stock-recommendations/TrendRanking"
import { useRealtimePrice } from "@/hooks/useRealtimePrice"
import type { Recommendation } from "@/types/stock"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Page() {
  const { data, isLoading } = useSWR<{ data: Recommendation[] }>(
    "/api/recommendations",
    fetcher,
    { refreshInterval: 30 * 60 * 1000 }
  )

  const codes = (data?.data ?? []).map((r) => r.stock_code)
  const prices = useRealtimePrice(codes)
  const [selected, setSelected] = useState<Recommendation | null>(null)

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <RecommendationList
            recommendations={data?.data ?? []}
            isLoading={isLoading}
            prices={prices}
            onSelect={setSelected}
          />
        </div>
        <div className="w-full md:w-64 shrink-0">
          <TrendRanking />
        </div>
      </div>
      <StockDetailModal selected={selected} onClose={() => setSelected(null)} />
    </main>
  )
}
