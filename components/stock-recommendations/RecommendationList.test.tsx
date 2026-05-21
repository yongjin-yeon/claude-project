import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { RecommendationList } from "./RecommendationList"
import type { Recommendation } from "@/types/stock"

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
  it("shows heading '오늘의 추천종목'", () => {
    render(<RecommendationList recommendations={mockRecs} isLoading={false} />)
    expect(screen.getByText("오늘의 추천종목")).toBeInTheDocument()
  })

  it("renders at least one row when data is present", () => {
    render(<RecommendationList recommendations={mockRecs} isLoading={false} />)
    // jsdom renders both desktop table and mobile cards simultaneously (no CSS media queries)
    expect(screen.getAllByText("삼성전자").length).toBeGreaterThan(0)
    expect(screen.getAllByText("미래에셋").length).toBeGreaterThan(0)
    expect(screen.getAllByText("매수").length).toBeGreaterThan(0)
    expect(screen.getAllByText("98,000").length).toBeGreaterThan(0)
  })

  it("shows skeleton cards while loading", () => {
    render(<RecommendationList recommendations={[]} isLoading={true} />)
    const skeletons = document.querySelectorAll("[data-testid='skeleton-card']")
    expect(skeletons.length).toBeGreaterThan(0)
    expect(screen.queryByText("오늘의 추천종목이 아직 없습니다")).not.toBeInTheDocument()
  })

  it("shows empty state message when no data and not loading", () => {
    render(<RecommendationList recommendations={[]} isLoading={false} />)
    expect(screen.getByText("오늘의 추천종목이 아직 없습니다")).toBeInTheDocument()
  })

  it("skeleton and empty state are visually distinct", () => {
    const { rerender } = render(
      <RecommendationList recommendations={[]} isLoading={true} />
    )
    expect(document.querySelectorAll("[data-testid='skeleton-card']").length).toBeGreaterThan(0)

    rerender(<RecommendationList recommendations={[]} isLoading={false} />)
    expect(document.querySelectorAll("[data-testid='skeleton-card']").length).toBe(0)
    expect(screen.getByText("오늘의 추천종목이 아직 없습니다")).toBeInTheDocument()
  })
})
