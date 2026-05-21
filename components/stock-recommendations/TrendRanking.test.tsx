import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TrendRanking } from "./TrendRanking"
import type { TrendEntry } from "@/types/stock"

vi.mock("swr", () => ({ default: vi.fn() }))

import useSWR from "swr"

const mockTrend: TrendEntry[] = [
  { stock_code: "005930", stock_name: "삼성전자", count: 12, rank: 1 },
  { stock_code: "000660", stock_name: "SK하이닉스", count: 8, rank: 2 },
  { stock_code: "035420", stock_name: "NAVER", count: 5, rank: 3 },
]

describe("TrendRanking", () => {
  it("renders up to 10 entries with rank and count", () => {
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

  it("defaults to 5-day period", () => {
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

  it("switches to 60-day period on click", () => {
    let capturedUrl: string | null = null
    vi.mocked(useSWR).mockImplementation((key) => {
      capturedUrl = key as string
      return { data: { data: [] }, isLoading: false } as ReturnType<typeof useSWR>
    })

    render(<TrendRanking />)
    fireEvent.click(screen.getByText("60일"))
    expect(capturedUrl).toContain("days=60")
  })
})
