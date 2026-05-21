"use client"

import { useEffect, useRef, useState } from "react"

export function usePriceFlash(price: number | null): "up" | "down" | null {
  const prevRef = useRef<number | null>(null)
  const [flash, setFlash] = useState<"up" | "down" | null>(null)

  useEffect(() => {
    if (price == null) return
    if (prevRef.current != null && price !== prevRef.current) {
      setFlash(price > prevRef.current ? "up" : "down")
      const t = setTimeout(() => setFlash(null), 800)
      prevRef.current = price
      return () => clearTimeout(t)
    }
    prevRef.current = price
  }, [price])

  return flash
}
