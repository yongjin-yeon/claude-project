import { getKisAccessToken } from "@/lib/kisToken"
import type { MarketCapEntry } from "@/types/stock"
import { NextResponse } from "next/server"

interface KisCapItem {
  data_rank: string
  stck_shrn_iscd: string
  hts_kor_isnm: string
  stck_avls: string   // 시가총액 (억원)
  stck_prpr: string   // 주식 현재가
  prdy_ctrt: string   // 전일 대비 등락률 (%)
}

export async function GET() {
  const appKey = process.env.KIS_APP_KEY
  const appSecret = process.env.KIS_APP_SECRET

  if (!appKey || !appSecret) {
    return NextResponse.json({ data: [] })
  }

  try {
    const token = await getKisAccessToken()

    const res = await fetch(
      "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/ranking/market-cap" +
        "?FID_COND_MRKT_DIV_CODE=J" +
        "&FID_COND_SCR_DIV_CODE=20174" +
        "&FID_INPUT_ISCD=0000" +
        "&FID_DIV_CLS_CODE=0" +
        "&FID_BLNG_CLS_CODE=0" +
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
          "tr_id": "FHPST01740000",
          custtype: "P",
        },
      }
    )

    if (!res.ok) {
      console.error(`KIS cap-rank API failed: ${res.status}`)
      return NextResponse.json({ data: [] })
    }

    const json = (await res.json()) as { output: KisCapItem[] }
    const entries: MarketCapEntry[] = (json.output ?? [])
      .slice(0, 30)
      .map((item, idx) => ({
        rank: parseInt(item.data_rank, 10) || idx + 1,
        stock_code: item.stck_shrn_iscd,
        stock_name: item.hts_kor_isnm,
        market_cap: parseInt(item.stck_avls, 10) || 0,
        current_price: parseInt(item.stck_prpr, 10) || 0,
        change_rate: parseFloat(item.prdy_ctrt) || 0,
      }))

    return NextResponse.json({ data: entries })
  } catch (err) {
    console.error("cap-rank error:", err)
    return NextResponse.json({ data: [] })
  }
}
