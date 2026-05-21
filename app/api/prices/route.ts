import { getKisAccessToken } from "@/lib/kisToken"
import { NextResponse } from "next/server"

async function fetchPrice(
  code: string,
  market: "J" | "Q",
  token: string,
  appKey: string,
  appSecret: string
): Promise<number> {
  try {
    const res = await fetch(
      `https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price` +
        `?FID_COND_MRKT_DIV_CODE=${market}&FID_INPUT_ISCD=${code}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          appkey: appKey,
          appsecret: appSecret,
          "tr_id": "FHKST01010100",
          custtype: "P",
        },
      }
    )
    if (!res.ok) return 0
    const json = (await res.json()) as { output?: { stck_prpr?: string } }
    return parseInt(json.output?.stck_prpr ?? "0", 10) || 0
  } catch {
    return 0
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const codes = (searchParams.get("codes") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 30)

  if (codes.length === 0) return NextResponse.json({ data: {} })

  const appKey = process.env.KIS_APP_KEY
  const appSecret = process.env.KIS_APP_SECRET
  if (!appKey || !appSecret) return NextResponse.json({ data: {} })

  try {
    const token = await getKisAccessToken()

    // 1차: KOSPI(J) 전체 병렬 조회
    const kospiResults = await Promise.all(
      codes.map(async (code) => [code, await fetchPrice(code, "J", token, appKey, appSecret)] as const)
    )

    // 2차: KOSPI에서 0이 나온 종목만 KOSDAQ(Q)으로 재시도
    const missing = kospiResults.filter(([, price]) => price === 0).map(([code]) => code)
    const kosdaqResults = missing.length > 0
      ? await Promise.all(
          missing.map(async (code) => [code, await fetchPrice(code, "Q", token, appKey, appSecret)] as const)
        )
      : []

    const data: Record<string, number> = {}
    for (const [code, price] of [...kospiResults, ...kosdaqResults]) {
      if (price > 0) data[code] = price
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error("prices error:", err)
    return NextResponse.json({ data: {} })
  }
}
