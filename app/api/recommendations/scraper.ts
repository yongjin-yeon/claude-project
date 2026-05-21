import type { HankyungReport } from "@/types/stock"

const OPINION_MAP: Record<string, string> = {
  "strong buy": "매수",
  buy: "매수",
  outperform: "매수",
  "trading buy": "매수",
  hold: "중립",
  neutral: "중립",
  "market perform": "중립",
  sell: "매도",
  underperform: "매도",
  "strong sell": "매도",
}

export function mapOpinion(gradeValue: string): string {
  return OPINION_MAP[gradeValue.toLowerCase()] ?? gradeValue
}

export function parseNuxtReports(html: string): HankyungReport[] {
  // Extract todayReports array from window.__NUXT__ embedded JSON
  const match = html.match(/"todayReports"\s*:\s*(\[[\s\S]*?\])\s*,\s*"top/)
  if (!match) return []

  try {
    return JSON.parse(match[1]) as HankyungReport[]
  } catch {
    return []
  }
}

export async function scrapeHankyung(): Promise<HankyungReport[]> {
  const res = await fetch("https://markets.hankyung.com/consensus", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 1800 }, // 30분
  })

  if (!res.ok) throw new Error(`Hankyung fetch failed: ${res.status}`)

  const html = await res.text()
  return parseNuxtReports(html)
}
