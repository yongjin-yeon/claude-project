"use client"

import { useState } from "react"
import useSWR from "swr"
import { RecommendationList } from "@/components/stock-recommendations/RecommendationList"
import { StockDetailModal } from "@/components/stock-recommendations/StockDetailModal"
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
      <RecommendationList
        recommendations={data?.data ?? []}
        isLoading={isLoading}
        prices={prices}
        onSelect={setSelected}
      />
      <StockDetailModal selected={selected} onClose={() => setSelected(null)} />
    </main>
  )
}
