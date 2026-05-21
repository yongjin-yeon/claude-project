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

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}

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
    <main className="min-h-screen bg-background">
      {/* Top header */}
      <header className="border-b border-border px-4 md:px-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-1">
          <TabButton active={mainTab === "recommendations"} onClick={() => setMainTab("recommendations")}>
            오늘의 추천종목
          </TabButton>
          <TabButton active={mainTab === "marketcap"} onClick={() => setMainTab("marketcap")}>
            시총 Top30
          </TabButton>
        </div>
      </header>

      {/* Body */}
      <div className="px-4 md:px-8 py-4 max-w-6xl mx-auto flex flex-col md:flex-row gap-5">
        {/* Main content */}
        <div className="flex-1 min-w-0">
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

        {/* Sidebar */}
        <div className="w-full md:w-56 shrink-0">
          <TrendRanking />
        </div>
      </div>

      <StockDetailModal selected={selected} onClose={() => setSelected(null)} />
    </main>
  )
}
