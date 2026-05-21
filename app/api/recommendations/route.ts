import { getDb, insertRecommendation, getRecommendations } from "@/lib/db"
import { scrapeHankyung, mapOpinion } from "./scraper"

function todayKST(): string {
  return new Date()
    .toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
    .replace(/\. /g, "-")
    .replace(/\.$/, "")
    .split("-")
    .map((p) => p.padStart(2, "0"))
    .join("-")
}

export async function GET() {
  const db = getDb()
  const today = todayKST()

  let rows = getRecommendations(db, today)

  // 데이터 없으면 스크래핑 시도
  if (rows.length === 0) {
    try {
      const reports = await scrapeHankyung()
      const now = new Date().toISOString()
      for (const r of reports) {
        insertRecommendation(db, {
          stock_code: r.BUSINESS_CODE,
          stock_name: r.BUSINESS_NAME,
          firm: r.OFFICE_NAME,
          opinion: mapOpinion(r.GRADE_VALUE),
          target_price: parseInt(r.TARGET_STOCK_PRICES, 10) || 0,
          scraped_at: now,
          report_date: r.REPORT_DATE,
        })
      }
      rows = getRecommendations(db, today)
    } catch {
      // 스크래핑 실패 시 빈 배열 반환 (빈 상태 UI 표시)
    }
  }

  return Response.json({ data: rows })
}

export async function POST() {
  const db = getDb()
  try {
    const reports = await scrapeHankyung()
    const now = new Date().toISOString()
    let inserted = 0
    for (const r of reports) {
      insertRecommendation(db, {
        stock_code: r.BUSINESS_CODE,
        stock_name: r.BUSINESS_NAME,
        firm: r.OFFICE_NAME,
        opinion: mapOpinion(r.GRADE_VALUE),
        target_price: parseInt(r.TARGET_STOCK_PRICES, 10) || 0,
        scraped_at: now,
        report_date: r.REPORT_DATE,
      })
      inserted++
    }
    return Response.json({ ok: true, inserted })
  } catch (e) {
    return Response.json(
      { ok: false, error: String(e) },
      { status: 500 }
    )
  }
}
