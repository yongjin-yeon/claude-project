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

function parseTargetPrice(raw: string): number | null {
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function GET() {
  const db = getDb()
  const today = todayKST()

  let rows = getRecommendations(db, today)

  if (rows.length === 0) {
    try {
      const reports = await scrapeHankyung()
      const now = new Date().toISOString()
      for (const r of reports) {
        const target_price = parseTargetPrice(r.TARGET_STOCK_PRICES)
        if (target_price == null) continue
        insertRecommendation(db, {
          stock_code: r.BUSINESS_CODE,
          stock_name: r.BUSINESS_NAME,
          firm: r.OFFICE_NAME,
          opinion: mapOpinion(r.GRADE_VALUE),
          target_price,
          scraped_at: now,
          report_date: r.REPORT_DATE,
        })
      }
      rows = getRecommendations(db, today)
    } catch (e) {
      console.error("[scrape] auto-scrape on GET failed:", e)
    }
  }

  return Response.json({ data: rows })
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("authorization") ?? ""
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const db = getDb()
  try {
    const reports = await scrapeHankyung()
    const now = new Date().toISOString()
    let inserted = 0
    for (const r of reports) {
      const target_price = parseTargetPrice(r.TARGET_STOCK_PRICES)
      if (target_price == null) continue
      insertRecommendation(db, {
        stock_code: r.BUSINESS_CODE,
        stock_name: r.BUSINESS_NAME,
        firm: r.OFFICE_NAME,
        opinion: mapOpinion(r.GRADE_VALUE),
        target_price,
        scraped_at: now,
        report_date: r.REPORT_DATE,
      })
      inserted++
    }
    return Response.json({ ok: true, inserted })
  } catch (e) {
    console.error("[scrape] POST scrape failed:", e)
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
