"use client"

import { useState } from "react"
import useSWR from "swr"
import { RecommendationList } from "@/components/stock-recommendations/RecommendationList"
import { StockDetailModal } from "@/components/stock-recommendations/StockDetailModal"
import { TrendRanking } from "@/components/stock-recommendations/TrendRanking"
import { MarketCapList } from "@/components/stock-recommendations/MarketCapList"
import { useRealtimePrice } from "@/hooks/useRealtimePrice"
import type { Recommendation } from "@/types/stock"

type MainTab = "recommendations" | "marketcap"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Page() {
  const [mainTab, setMainTab] = useState<MainTab>("recommendations")
  const [selected, setSelected] = useState<Recommendation | null>(null)

  const { data, isLoading } = useSWR<{ data: Recommendation[] }>(
    "/api/recommendations",
    fetcher,
    { refreshInterval: 30 * 60 * 1000 }
  )

  const codes = (data?.data ?? []).map((r) => r.stock_code)
  const prices = useRealtimePrice(codes)

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {/* Main tab bar */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setMainTab("recommendations")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                mainTab === "recommendations"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              추천종목
            </button>
            <button
              onClick={() => setMainTab("marketcap")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                mainTab === "marketcap"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              시총 Top30
            </button>
          </div>

          {mainTab === "recommendations" ? (
            <RecommendationList
              recommendations={data?.data ?? []}
              isLoading={isLoading}
              prices={prices}
              onSelect={setSelected}
            />
          ) : (
            <MarketCapList />
          )}
        </div>

        <div className="w-full md:w-64 shrink-0">
          <TrendRanking />
        </div>
      </div>

      <StockDetailModal selected={selected} onClose={() => setSelected(null)} />
    </main>
  )
}
