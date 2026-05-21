import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import type { Recommendation, TrendEntry } from "@/types/stock"

type NewRecommendation = Omit<Recommendation, "id">

export function createDb(filename: string = ":memory:"): Database.Database {
  const db = new Database(filename)
  db.pragma("journal_mode = WAL")
  createTables(db)
  return db
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    const dbDir = path.join(process.cwd(), "data")
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
    _db = createDb(path.join(dbDir, "stocks.db"))
  }
  return _db
}

function createTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_code  TEXT NOT NULL,
      stock_name  TEXT NOT NULL,
      firm        TEXT NOT NULL,
      opinion     TEXT NOT NULL,
      target_price INTEGER NOT NULL,
      scraped_at  TEXT NOT NULL,
      report_date TEXT NOT NULL,
      UNIQUE(stock_code, firm, report_date)
    )
  `)
}

export function insertRecommendation(
  db: Database.Database,
  rec: NewRecommendation
): void {
  db.prepare(`
    INSERT OR IGNORE INTO recommendations
      (stock_code, stock_name, firm, opinion, target_price, scraped_at, report_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    rec.stock_code,
    rec.stock_name,
    rec.firm,
    rec.opinion,
    rec.target_price,
    rec.scraped_at,
    rec.report_date
  )
}

export function getRecommendations(
  db: Database.Database,
  date: string
): Recommendation[] {
  return db
    .prepare(
      "SELECT * FROM recommendations WHERE report_date = ? ORDER BY id DESC"
    )
    .all(date) as Recommendation[]
}

export function getConsensus(db: Database.Database, stockCode: string) {
  const reports = db
    .prepare(
      "SELECT * FROM recommendations WHERE stock_code = ? ORDER BY report_date DESC"
    )
    .all(stockCode) as Recommendation[]

  if (reports.length === 0) return null

  const avgTargetPrice = Math.round(
    reports.reduce((sum, r) => sum + r.target_price, 0) / reports.length
  )
  const buy = reports.filter((r) =>
    ["매수", "buy", "outperform", "strong buy"].includes(r.opinion.toLowerCase())
  ).length
  const sell = reports.filter((r) =>
    ["매도", "sell", "underperform"].includes(r.opinion.toLowerCase())
  ).length
  const neutral = reports.length - buy - sell

  const priceHistory = reports.map((r) => ({
    date: r.report_date,
    target_price: r.target_price,
    firm: r.firm,
  }))

  return {
    stock_code: stockCode,
    stock_name: reports[0].stock_name,
    avg_target_price: avgTargetPrice,
    buy_count: buy,
    neutral_count: neutral,
    sell_count: sell,
    reports,
    price_history: priceHistory,
  }
}

export function getTrendRanking(
  db: Database.Database,
  days: number,
  referenceDate: string
): TrendEntry[] {
  const rows = db
    .prepare(
      `SELECT stock_code, stock_name, COUNT(*) as count
       FROM recommendations
       WHERE report_date >= date(?, '-' || ? || ' days')
         AND report_date <= ?
       GROUP BY stock_code
       ORDER BY count DESC
       LIMIT 10`
    )
    .all(referenceDate, days, referenceDate) as {
    stock_code: string
    stock_name: string
    count: number
  }[]

  return rows.map((row, i) => ({ ...row, rank: i + 1 }))
}
