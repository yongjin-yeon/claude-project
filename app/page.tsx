"use client"

import useSWR from "swr"
import { RecommendationList } from "@/components/stock-recommendations/RecommendationList"
import type { Recommendation } from "@/types/stock"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Page() {
  const { data, isLoading } = useSWR<{ data: Recommendation[] }>(
    "/api/recommendations",
    fetcher,
    { refreshInterval: 30 * 60 * 1000 }
  )

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <RecommendationList
        recommendations={data?.data ?? []}
        isLoading={isLoading}
      />
    </main>
  )
}
