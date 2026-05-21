import type { HankyungReport } from "@/types/stock"

const OPINION_MAP: Record<string, string> = {
  "strong buy": "매수",
  buy: "매수",
  outperform: "매수",
  "trading buy": "매수",
  hold: "중립",
  neutral: "중립",
  "market perform": "중립",
  "not rated": "중립",
  sell: "매도",
  underperform: "매도",
  "strong sell": "매도",
}

export function mapOpinion(gradeValue: string): string {
  return OPINION_MAP[gradeValue.toLowerCase()] ?? gradeValue
}

/**
 * Nuxt 2 SSR 압축 포맷에서 파라미터 이름 → 실제 값 맵을 생성한다.
 * 포맷: window.__NUXT__=(function(a,b,c,...){return {...}})(val1,val2,...);
 */
function buildParamMap(html: string): Map<string, string> {
  const nuxtStart = html.indexOf("window.__NUXT__")
  if (nuxtStart === -1) return new Map()

  const scriptEnd = html.indexOf("</script>", nuxtStart)
  const nuxtBlock =
    scriptEnd === -1 ? html.substring(nuxtStart) : html.substring(nuxtStart, scriptEnd)

  // Parameter names
  const paramMatch = nuxtBlock.match(/\(function\(([^)]+)\)/)
  if (!paramMatch) return new Map()
  const params = paramMatch[1].split(",")

  // Argument values: format is (function(params){...}(args)) — args before last ));
  // Also handle ); ending (test fixtures, rare variants)
  let endIdx = nuxtBlock.lastIndexOf("));")
  if (endIdx === -1) endIdx = nuxtBlock.lastIndexOf(");")
  if (endIdx === -1) return new Map()

  // Scan backward from endIdx to find the ( that opens the args list
  let argsStartIdx = -1
  for (let i = endIdx - 1; i >= 0; i--) {
    if (nuxtBlock[i] === "(" && /^["0-9tfn]/.test(nuxtBlock[i + 1] ?? "")) {
      argsStartIdx = i
      break
    }
  }
  if (argsStartIdx === -1) return new Map()

  const argsRaw = nuxtBlock.substring(argsStartIdx + 1, endIdx)

  let args: unknown[]
  try {
    args = JSON.parse("[" + argsRaw + "]") as unknown[]
  } catch {
    return new Map()
  }

  const map = new Map<string, string>()
  params.forEach((p, i) => {
    const v = args[i]
    if (v != null) map.set(p, String(v))
  })
  return map
}

/**
 * JavaScript 객체 리터럴 블록에서 특정 필드 값을 추출한다.
 * - 큰따옴표 문자열 → 그대로 반환
 * - 파라미터 참조 → paramMap으로 해석
 */
function extractField(
  block: string,
  fieldName: string,
  paramMap: Map<string, string>
): string {
  const regex = new RegExp(`(?:^|,)${fieldName}:([^,}]+)`)
  const match = block.match(regex)
  if (!match) return ""
  const raw = match[1].trim()
  if (raw.startsWith('"')) {
    // Quoted string — remove surrounding quotes and unescape \u002F → /
    return raw.slice(1, -1).replace(/\\u002F/g, "/")
  }
  // Parameter reference
  return paramMap.get(raw) ?? ""
}

export function parseNuxtReports(html: string): HankyungReport[] {
  const paramMap = buildParamMap(html)
  const reports: HankyungReport[] = []

  const blockRegex = /\{REPORT_IDX:(\d+)[^}]+\}/g
  for (const m of html.matchAll(blockRegex)) {
    const block = m[0]
    const idxRaw = m[1]

    const report: HankyungReport = {
      REPORT_IDX: parseInt(idxRaw, 10),
      BUSINESS_CODE: extractField(block, "BUSINESS_CODE", paramMap),
      BUSINESS_NAME: extractField(block, "BUSINESS_NAME", paramMap),
      OFFICE_NAME: extractField(block, "OFFICE_NAME", paramMap),
      GRADE_VALUE: extractField(block, "GRADE_VALUE", paramMap),
      TARGET_STOCK_PRICES: extractField(block, "TARGET_STOCK_PRICES", paramMap),
      REPORT_DATE: extractField(block, "REPORT_DATE", paramMap),
    }

    // Skip records missing essential fields
    if (!report.BUSINESS_CODE || !report.REPORT_DATE) continue

    reports.push(report)
  }

  return reports
}

export async function scrapeHankyung(): Promise<HankyungReport[]> {
  const res = await fetch("https://markets.hankyung.com/consensus", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 1800 },
  })

  if (!res.ok) throw new Error(`Hankyung fetch failed: ${res.status}`)

  const html = await res.text()
  return parseNuxtReports(html)
}
