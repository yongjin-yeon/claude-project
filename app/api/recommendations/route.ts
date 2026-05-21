import { scrapeHankyung, mapOpinion } from "./scraper"
import type { Recommendation } from "@/types/stock"

function todayKST(): string {
  return new Date()
    .toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
    .replace(/\. /g, "-")
    .replace(/\.$/, "")
    .split("-")
    .map((p) => p.padStart(2, "0"))
    .join("-")
}

function parseTargetPrice(raw: string): number | null {
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function toRecommendations(reports: Awaited<ReturnType<typeof scrapeHankyung>>): Recommendation[] {
  const now = new Date().toISOString()
  const result: Recommendation[] = []
  for (const r of reports) {
    const target_price = parseTargetPrice(r.TARGET_STOCK_PRICES)
    if (!target_price) continue
    result.push({
      id: r.REPORT_IDX,
      stock_code: r.BUSINESS_CODE,
      stock_name: r.BUSINESS_NAME,
      firm: r.OFFICE_NAME,
      opinion: mapOpinion(r.GRADE_VALUE),
      target_price,
      scraped_at: now,
      report_date: r.REPORT_DATE,
    })
  }
  return result
}

export async function GET() {
  const today = todayKST()

  try {
    const reports = await scrapeHankyung()
    let rows = toRecommendations(reports).filter((r) => r.report_date === today)

    // 오늘 데이터가 없으면 (장 개장 전 등) 가장 최근 날짜 데이터로 폴백
    if (rows.length === 0) {
      const all = toRecommendations(reports)
      if (all.length > 0) {
        const latest = all[0].report_date
        rows = all.filter((r) => r.report_date === latest)
      }
    }

    return Response.json({ data: rows })
  } catch (e) {
    console.error("[scrape] GET failed:", e)
    return Response.json({ data: [] })
  }
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("authorization") ?? ""
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const reports = await scrapeHankyung()
    const rows = toRecommendations(reports)
    return Response.json({ ok: true, total: rows.length })
  } catch (e) {
    console.error("[scrape] POST failed:", e)
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
