"use client"

import { useEffect, useMemo, useState } from "react"

const POLL_INTERVAL = 5_000 // 5초

export function useRealtimePrice(codes: string[]): Map<string, number> {
  const [prices, setPrices] = useState<Map<string, number>>(new Map())
  const codesKey = useMemo(() => codes.slice().sort().join(","), [codes])

  useEffect(() => {
    if (codesKey === "") return

    const fetchPrices = async () => {
      try {
        const res = await fetch(`/api/prices?codes=${encodeURIComponent(codesKey)}`)
        if (!res.ok) return
        const json = (await res.json()) as { data: Record<string, number> }
        if (json.data && typeof json.data === "object") {
          setPrices(new Map(Object.entries(json.data)))
        }
      } catch {
        // 네트워크 오류 시 무시 — 이전 prices 유지
      }
    }

    fetchPrices()
    const timer = setInterval(fetchPrices, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [codesKey])

  return prices
}
