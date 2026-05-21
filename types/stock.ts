export interface Recommendation {
  id: number
  stock_code: string
  stock_name: string
  firm: string
  opinion: string
  target_price: number
  scraped_at: string
  report_date: string
}

export interface ConsensusData {
  stock_code: string
  stock_name: string
  avg_target_price: number
  buy_count: number
  neutral_count: number
  sell_count: number
  reports: Recommendation[]
  price_history: { date: string; target_price: number; firm: string }[]
}

export interface TrendEntry {
  stock_code: string
  stock_name: string
  count: number
  rank: number
}

export interface HankyungReport {
  REPORT_IDX: number
  BUSINESS_CODE: string
  BUSINESS_NAME: string
  OFFICE_NAME: string
  GRADE_VALUE: string
  TARGET_STOCK_PRICES: string
  REPORT_DATE: string
}
