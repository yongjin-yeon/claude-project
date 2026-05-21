import { getKisAccessToken } from "@/lib/kisToken"
import type { VolumeRankEntry } from "@/types/stock"
import { NextResponse } from "next/server"

interface KisVolumeItem {
  data_rank: string
  stck_shrn_iscd: string
  hts_kor_isnm: string
  acml_tr_pbmn: string // 누적 거래대금 (원)
  stck_prpr: string   // 주식 현재가
  prdy_ctrt: string   // 전일 대비 등락률 (%)
}

async function fetchVolumeRank(
  market: "J" | "Q",
  token: string,
  appKey: string,
  appSecret: string
): Promise<KisVolumeItem[]> {
  const res = await fetch(
    "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/volume-rank" +
      `?FID_COND_MRKT_DIV_CODE=${market}` +
      "&FID_COND_SCR_DIV_CODE=20171" +
      "&FID_INPUT_ISCD=0000" +
      "&FID_DIV_CLS_CODE=2" +  // 거래대금순
      "&FID_BLNG_CLS_CODE=1" +  // 보통주만 (우선주 제외)
      "&FID_TRGT_CLS_CODE=111111111" +
      "&FID_TRGT_EXLS_CLS_CODE=000000" +
      "&FID_INPUT_PRICE_1=0" +
      "&FID_INPUT_PRICE_2=0" +
      "&FID_VOL_CNT=0" +
      "&FID_INPUT_DATE_1=0",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        appkey: appKey,
        appsecret: appSecret,
        "tr_id": "FHPST01710000",
        custtype: "P",
      },
    }
  )

  if (!res.ok) {
    console.error(`KIS volume-rank(${market}) failed: ${res.status}`)
    return []
  }

  const json = (await res.json()) as { output?: KisVolumeItem[] }
  return json.output ?? []
}

export async function GET() {
  const appKey = process.env.KIS_APP_KEY
  const appSecret = process.env.KIS_APP_SECRET

  if (!appKey || !appSecret) {
    return NextResponse.json({ data: [] })
  }

  try {
    const token = await getKisAccessToken()

    // KOSPI + KOSDAQ 병렬 조회
    const [kospi, kosdaq] = await Promise.all([
      fetchVolumeRank("J", token, appKey, appSecret),
      fetchVolumeRank("Q", token, appKey, appSecret),
    ])

    // 합산 후 거래대금 내림차순 정렬, 상위 20개
    const merged = [...kospi, ...kosdaq]
      .sort((a, b) => parseInt(b.acml_tr_pbmn, 10) - parseInt(a.acml_tr_pbmn, 10))
      .slice(0, 20)

    const entries: VolumeRankEntry[] = merged.map((item, idx) => ({
      rank: idx + 1,
      stock_code: item.stck_shrn_iscd,
      stock_name: item.hts_kor_isnm,
      trading_amount: parseInt(item.acml_tr_pbmn, 10) || 0,
      current_price: parseInt(item.stck_prpr, 10) || 0,
      change_rate: parseFloat(item.prdy_ctrt) || 0,
    }))

    return NextResponse.json({ data: entries })
  } catch (err) {
    console.error("volume-rank error:", err)
    return NextResponse.json({ data: [] })
  }
}
