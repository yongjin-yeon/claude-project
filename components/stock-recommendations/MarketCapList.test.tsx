import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MarketCapList } from "./MarketCapList"
import type { MarketCapEntry } from "@/types/stock"

vi.mock("swr", () => ({ default: vi.fn() }))
vi.mock("@/hooks/useRealtimePrice", () => ({
  useRealtimePrice: () => new Map<string, number>([["005930", 78500]]),
}))
vi.mock("@/hooks/usePriceFlash", () => ({ usePriceFlash: () => null }))

import useSWR from "swr"

const mockEntries: MarketCapEntry[] = [
  { rank: 1, stock_code: "005930", stock_name: "삼성전자", market_cap: 4_680_000, current_price: 78000, change_rate: 1.23 },
  { rank: 2, stock_code: "000660", stock_name: "SK하이닉스", market_cap: 1_420_000, current_price: 195000, change_rate: -0.55 },
  { rank: 3, stock_code: "005380", stock_name: "현대차", market_cap: 530_000, current_price: 253000, change_rate: 0 },
]

describe("MarketCapList", () => {
  it("renders stock names and codes", () => {
    vi.mocked(useSWR).mockReturnValue({
      data: { data: mockEntries },
      isLoading: false,
    } as ReturnType<typeof useSWR>)

    render(<MarketCapList />)
    expect(screen.getByText("삼성전자")).toBeInTheDocument()
    expect(screen.getByText("SK하이닉스")).toBeInTheDocument()
    expect(screen.getByText("005930")).toBeInTheDocument()
  })

  it("shows live price from useRealtimePrice when available", () => {
    vi.mocked(useSWR).mockReturnValue({
      data: { data: mockEntries },
      isLoading: false,
    } as ReturnType<typeof useSWR>)

    render(<MarketCapList />)
    expect(screen.getByText("78,500")).toBeInTheDocument()
  })

  it("falls back to snapshot price when no live price", () => {
    vi.mocked(useSWR).mockReturnValue({
      data: { data: mockEntries },
      isLoading: false,
    } as ReturnType<typeof useSWR>)

    render(<MarketCapList />)
    expect(screen.getByText("195,000")).toBeInTheDocument()
  })

  it("formats market cap in 조 units", () => {
    vi.mocked(useSWR).mockReturnValue({
      data: { data: mockEntries },
      isLoading: false,
    } as ReturnType<typeof useSWR>)

    render(<MarketCapList />)
    expect(screen.getByText("468.0조")).toBeInTheDocument()
    expect(screen.getByText("53.0조")).toBeInTheDocument()
  })

  it("shows change rate badges", () => {
    vi.mocked(useSWR).mockReturnValue({
      data: { data: mockEntries },
      isLoading: false,
    } as ReturnType<typeof useSWR>)

    render(<MarketCapList />)
    expect(screen.getByText("+1.23%")).toBeInTheDocument()
    expect(screen.getByText("-0.55%")).toBeInTheDocument()
  })

  it("shows rank numbers", () => {
    vi.mocked(useSWR).mockReturnValue({
      data: { data: mockEntries },
      isLoading: false,
    } as ReturnType<typeof useSWR>)

    render(<MarketCapList />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("shows loading skeleton", () => {
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useSWR>)

    const { container } = render(<MarketCapList />)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })

  it("shows 데이터 없음 when empty", () => {
    vi.mocked(useSWR).mockReturnValue({
      data: { data: [] },
      isLoading: false,
    } as ReturnType<typeof useSWR>)

    render(<MarketCapList />)
    expect(screen.getByText("데이터 없음")).toBeInTheDocument()
  })
})
