import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { RecommendationList } from "./RecommendationList"
import type { Recommendation } from "@/types/stock"

vi.mock("@/hooks/usePriceFlash", () => ({ usePriceFlash: () => null }))

const mockRecs: Recommendation[] = [
  {
    id: 1,
    stock_code: "005930",
    stock_name: "삼성전자",
    firm: "미래에셋",
    opinion: "매수",
    target_price: 98000,
    scraped_at: "2025-05-21T09:00:00Z",
    report_date: "2025-05-21",
  },
  {
    id: 2,
    stock_code: "000660",
    stock_name: "SK하이닉스",
    firm: "한국투자",
    opinion: "매수",
    target_price: 220000,
    scraped_at: "2025-05-21T09:00:00Z",
    report_date: "2025-05-21",
  },
]

describe("RecommendationList", () => {
  it("renders stock names, firms, and target prices when data is present", () => {
    render(<RecommendationList recommendations={mockRecs} isLoading={false} />)
    expect(screen.getAllByText("삼성전자").length).toBeGreaterThan(0)
    expect(screen.getAllByText("미래에셋").length).toBeGreaterThan(0)
    expect(screen.getAllByText("매수").length).toBeGreaterThan(0)
    expect(screen.getAllByText("98,000").length).toBeGreaterThan(0)
  })

  it("shows skeleton rows while loading", () => {
    render(<RecommendationList recommendations={[]} isLoading={true} />)
    const skeletons = document.querySelectorAll("[data-testid='skeleton-card']")
    expect(skeletons.length).toBeGreaterThan(0)
    expect(screen.queryByText("추천종목이 없습니다")).not.toBeInTheDocument()
  })

  it("shows empty state message when no data and not loading", () => {
    render(<RecommendationList recommendations={[]} isLoading={false} />)
    expect(screen.getByText("추천종목이 없습니다")).toBeInTheDocument()
  })

  it("shows upside badge with + for positive upside", () => {
    const prices = new Map([["005930", 80000]])  // target 98000, upside ~+22.5%
    render(<RecommendationList recommendations={mockRecs} isLoading={false} prices={prices} />)
    expect(screen.getAllByText(/\+\d+\.\d+%/).length).toBeGreaterThan(0)
  })

  it("shows sequential rank numbers", () => {
    render(<RecommendationList recommendations={mockRecs} isLoading={false} />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })
})
