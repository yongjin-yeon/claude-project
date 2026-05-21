"use client"

import { useEffect, useState } from "react"

export function useRealtimePrice(codes: string[]): Map<string, number> {
  const [prices, setPrices] = useState<Map<string, number>>(new Map())
  const codesKey = codes.slice().sort().join(",")

  useEffect(() => {
    if (codes.length === 0) return

    const url = `/api/price-stream?codes=${encodeURIComponent(codesKey)}`
    const es = new EventSource(url)

    es.onmessage = (e) => {
      try {
        const { code, price } = JSON.parse(e.data) as { code: string; price: number }
        setPrices((prev) => new Map(prev).set(code, price))
      } catch {
        // ignore malformed messages
      }
    }

    return () => es.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codesKey])

  return prices
}
