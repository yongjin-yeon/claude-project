import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { StockDetailModal } from "./StockDetailModal"
import type { Recommendation, ConsensusData } from "@/types/stock"

// Mock recharts — not compatible with jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}))

// Mock useSWR
vi.mock("swr", () => ({
  default: vi.fn(),
}))

// Mock useRealtimePrice — EventSource not in jsdom
vi.mock("@/hooks/useRealtimePrice", () => ({
  useRealtimePrice: () => new Map<string, number>(),
}))

import useSWR from "swr"

const mockRec: Recommendation = {
  id: 1,
  stock_code: "005930",
  stock_name: "삼성전자",
  firm: "미래에셋",
  opinion: "매수",
  target_price: 98000,
  scraped_at: "2025-05-21T09:00:00Z",
  report_date: "2025-05-21",
}

const mockConsensus: ConsensusData = {
  stock_code: "005930",
  stock_name: "삼성전자",
  avg_target_price: 95000,
  buy_count: 5,
  neutral_count: 1,
  sell_count: 0,
  reports: [
    { ...mockRec, id: 1 },
    { ...mockRec, id: 2, firm: "한국투자", target_price: 92000 },
  ],
  price_history: [
    { date: "2025-05-19", target_price: 90000, firm: "미래에셋" },
    { date: "2025-05-21", target_price: 98000, firm: "미래에셋" },
  ],
}

describe("StockDetailModal", () => {
  it("does not render dialog content when selected is null", () => {
    vi.mocked(useSWR).mockReturnValue({ data: undefined, isLoading: false } as ReturnType<typeof useSWR>)
    render(<StockDetailModal selected={null} onClose={vi.fn()} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("shows stock name in dialog title", () => {
    vi.mocked(useSWR).mockReturnValue({ data: { data: mockConsensus }, isLoading: false } as ReturnType<typeof useSWR>)
    render(<StockDetailModal selected={mockRec} onClose={vi.fn()} />)
    expect(screen.getByText("삼성전자")).toBeInTheDocument()
  })

  it("shows average target price and opinion counts", () => {
    vi.mocked(useSWR).mockReturnValue({ data: { data: mockConsensus }, isLoading: false } as ReturnType<typeof useSWR>)
    render(<StockDetailModal selected={mockRec} onClose={vi.fn()} />)
    expect(screen.getByText("95,000")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument() // buy count
  })

  it("shows firm report list", () => {
    vi.mocked(useSWR).mockReturnValue({ data: { data: mockConsensus }, isLoading: false } as ReturnType<typeof useSWR>)
    render(<StockDetailModal selected={mockRec} onClose={vi.fn()} />)
    expect(screen.getByText("미래에셋")).toBeInTheDocument()
    expect(screen.getByText("한국투자")).toBeInTheDocument()
  })

  it("renders price history chart", () => {
    vi.mocked(useSWR).mockReturnValue({ data: { data: mockConsensus }, isLoading: false } as ReturnType<typeof useSWR>)
    render(<StockDetailModal selected={mockRec} onClose={vi.fn()} />)
    expect(screen.getByTestId("line-chart")).toBeInTheDocument()
  })

  it("calls onClose when close button is clicked", () => {
    vi.mocked(useSWR).mockReturnValue({ data: { data: mockConsensus }, isLoading: false } as ReturnType<typeof useSWR>)
    const onClose = vi.fn()
    render(<StockDetailModal selected={mockRec} onClose={onClose} />)
    fireEvent.click(screen.getByRole("button", { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
