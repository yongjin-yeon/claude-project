import { scrapeHankyung, mapOpinion } from "../scraper"
import type { Recommendation, ConsensusData } from "@/types/stock"

function parseTargetPrice(raw: string): number | null {
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  try {
    const reports = await scrapeHankyung()
    const now = new Date().toISOString()

    const matched: Recommendation[] = reports
      .filter((r) => r.BUSINESS_CODE === code)
      .flatMap((r) => {
        const target_price = parseTargetPrice(r.TARGET_STOCK_PRICES)
        if (!target_price) return []
        return [{
          id: r.REPORT_IDX,
          stock_code: r.BUSINESS_CODE,
          stock_name: r.BUSINESS_NAME,
          firm: r.OFFICE_NAME,
          opinion: mapOpinion(r.GRADE_VALUE),
          target_price,
          scraped_at: now,
          report_date: r.REPORT_DATE,
        }]
      })

    if (matched.length === 0) {
      return Response.json({ error: "종목 데이터 없음" }, { status: 404 })
    }

    const avgTargetPrice = Math.round(
      matched.reduce((sum, r) => sum + r.target_price, 0) / matched.length
    )
    const buy = matched.filter((r) =>
      ["매수", "buy", "outperform", "strong buy"].includes(r.opinion.toLowerCase())
    ).length
    const sell = matched.filter((r) =>
      ["매도", "sell", "underperform"].includes(r.opinion.toLowerCase())
    ).length

    const consensus: ConsensusData = {
      stock_code: code,
      stock_name: matched[0].stock_name,
      avg_target_price: avgTargetPrice,
      buy_count: buy,
      neutral_count: matched.length - buy - sell,
      sell_count: sell,
      reports: matched,
      price_history: matched.map((r) => ({
        date: r.report_date,
        target_price: r.target_price,
        firm: r.firm,
      })),
    }

    return Response.json({ data: consensus })
  } catch (e) {
    console.error("[consensus] GET failed:", e)
    return Response.json({ error: "서버 오류" }, { status: 500 })
  }
}
