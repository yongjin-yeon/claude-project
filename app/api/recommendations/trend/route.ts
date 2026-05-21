import { scrapeHankyung } from "../scraper"
import type { TrendEntry } from "@/types/stock"

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get("days") ?? "5", 10)

  if (![5, 20, 60].includes(days)) {
    return Response.json({ error: "days must be 5, 20, or 60" }, { status: 400 })
  }

  try {
    const reports = await scrapeHankyung()
    const today = todayKST()

    // days 이내 날짜 범위 필터
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
      .replace(/\. /g, "-")
      .replace(/\.$/, "")
      .split("-")
      .map((p) => p.padStart(2, "0"))
      .join("-")

    // 종목별 집계
    const counter = new Map<string, { stock_name: string; count: number }>()

    for (const r of reports) {
      if (!parseTargetPrice(r.TARGET_STOCK_PRICES)) continue
      if (r.REPORT_DATE < cutoffStr || r.REPORT_DATE > today) continue
      const entry = counter.get(r.BUSINESS_CODE)
      if (entry) {
        entry.count++
      } else {
        counter.set(r.BUSINESS_CODE, { stock_name: r.BUSINESS_NAME, count: 1 })
      }
    }

    const ranking: TrendEntry[] = Array.from(counter.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([stock_code, { stock_name, count }], i) => ({
        rank: i + 1,
        stock_code,
        stock_name,
        count,
      }))

    return Response.json({ data: ranking })
  } catch (e) {
    console.error("[trend] GET failed:", e)
    return Response.json({ data: [] })
  }
}
