import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TrendRanking } from "./TrendRanking"
import type { TrendEntry, VolumeRankEntry } from "@/types/stock"

vi.mock("swr", () => ({ default: vi.fn() }))
vi.mock("@/hooks/useRealtimePrice", () => ({
  useRealtimePrice: () => new Map<string, number>(),
}))

import useSWR from "swr"

const mockTrend: TrendEntry[] = [
  { stock_code: "005930", stock_name: "삼성전자", count: 12, rank: 1 },
  { stock_code: "000660", stock_name: "SK하이닉스", count: 8, rank: 2 },
  { stock_code: "035420", stock_name: "NAVER", count: 5, rank: 3 },
]

const mockVolume: VolumeRankEntry[] = [
  { rank: 1, stock_code: "005930", stock_name: "삼성전자", trading_amount: 500_000_000_000, current_price: 78000 },
  { rank: 2, stock_code: "000660", stock_name: "SK하이닉스", trading_amount: 300_000_000_000, current_price: 195000 },
]

describe("TrendRanking", () => {
  it("renders trend tab by default with rank and count", () => {
    vi.mocked(useSWR).mockReturnValue({
      data: { data: mockTrend },
      isLoading: false,
    } as ReturnType<typeof useSWR>)

    render(<TrendRanking />)
    expect(screen.getByText("삼성전자")).toBeInTheDocument()
    expect(screen.getByText("SK하이닉스")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("8")).toBeInTheDocument()
  })

  it("shows rank numbers", () => {
    vi.mocked(useSWR).mockReturnValue({
      data: { data: mockTrend },
      isLoading: false,
    } as ReturnType<typeof useSWR>)

    render(<TrendRanking />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("defaults to 5-day period in trend tab", () => {
    let capturedUrl: string | null = null
    vi.mocked(useSWR).mockImplementation((key) => {
      capturedUrl = key as string
      return { data: { data: [] }, isLoading: false } as ReturnType<typeof useSWR>
    })

    render(<TrendRanking />)
    expect(capturedUrl).toContain("days=5")
  })

  it("switches to 20-day period on click", () => {
    let capturedUrl: string | null = null
    vi.mocked(useSWR).mockImplementation((key) => {
      capturedUrl = key as string
      return { data: { data: [] }, isLoading: false } as ReturnType<typeof useSWR>
    })

    render(<TrendRanking />)
    fireEvent.click(screen.getByText("20일"))
    expect(capturedUrl).toContain("days=20")
  })

  it("switches to 거래대금 tab and shows volume data", () => {
    vi.mocked(useSWR).mockImplementation((key) => {
      if ((key as string).includes("volume-rank")) {
        return { data: { data: mockVolume }, isLoading: false } as ReturnType<typeof useSWR>
      }
      return { data: { data: [] }, isLoading: false } as ReturnType<typeof useSWR>
    })

    render(<TrendRanking />)
    fireEvent.click(screen.getByText("거래대금"))

    expect(screen.getAllByText("삼성전자").length).toBeGreaterThan(0)
    expect(screen.getAllByText("SK하이닉스").length).toBeGreaterThan(0)
  })

  it("formats trading amount in 억 units", () => {
    vi.mocked(useSWR).mockImplementation((key) => {
      if ((key as string).includes("volume-rank")) {
        return { data: { data: mockVolume }, isLoading: false } as ReturnType<typeof useSWR>
      }
      return { data: { data: [] }, isLoading: false } as ReturnType<typeof useSWR>
    })

    render(<TrendRanking />)
    fireEvent.click(screen.getByText("거래대금"))

    // 500_000_000_000 = 5000억  (< 1조)
    expect(screen.getByText("5000억")).toBeInTheDocument()
    // 300_000_000_000 = 3000억
    expect(screen.getByText("3000억")).toBeInTheDocument()
  })
})
