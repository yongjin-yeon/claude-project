// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest"
import { createDb, insertRecommendation, getRecommendations, getTrendRanking } from "./db"
import type Database from "better-sqlite3"

describe("DB functions", () => {
  let db: ReturnType<typeof createDb>

  beforeEach(() => {
    db = createDb(":memory:")
  })

  describe("getRecommendations", () => {
    it("returns empty array when no data", () => {
      const result = getRecommendations(db, "2025-05-21")
      expect(result).toEqual([])
    })

    it("returns recommendations for a given date", () => {
      insertRecommendation(db, {
        stock_code: "005930",
        stock_name: "삼성전자",
        firm: "미래에셋",
        opinion: "매수",
        target_price: 98000,
        scraped_at: "2025-05-21T09:00:00Z",
        report_date: "2025-05-21",
      })
      const result = getRecommendations(db, "2025-05-21")
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        stock_code: "005930",
        stock_name: "삼성전자",
        firm: "미래에셋",
        opinion: "매수",
        target_price: 98000,
        report_date: "2025-05-21",
      })
    })

    it("does not return recommendations from other dates", () => {
      insertRecommendation(db, {
        stock_code: "005930",
        stock_name: "삼성전자",
        firm: "미래에셋",
        opinion: "매수",
        target_price: 98000,
        scraped_at: "2025-05-20T09:00:00Z",
        report_date: "2025-05-20",
      })
      const result = getRecommendations(db, "2025-05-21")
      expect(result).toHaveLength(0)
    })
  })

  describe("insertRecommendation — 중복 방지", () => {
    it("ignores duplicate (stock_code, firm, report_date)", () => {
      const rec = {
        stock_code: "005930",
        stock_name: "삼성전자",
        firm: "미래에셋",
        opinion: "매수",
        target_price: 98000,
        scraped_at: "2025-05-21T09:00:00Z",
        report_date: "2025-05-21",
      }
      insertRecommendation(db, rec)
      insertRecommendation(db, rec)
      const result = getRecommendations(db, "2025-05-21")
      expect(result).toHaveLength(1)
    })
  })

  describe("getTrendRanking", () => {
    it("returns top stocks by recommendation count within days", () => {
      const today = "2025-05-21"
      // 삼성전자 3회 추천
      for (const firm of ["미래에셋", "KB증권", "한국투자"]) {
        insertRecommendation(db, {
          stock_code: "005930",
          stock_name: "삼성전자",
          firm,
          opinion: "매수",
          target_price: 98000,
          scraped_at: `${today}T09:00:00Z`,
          report_date: today,
        })
      }
      // SK하이닉스 1회
      insertRecommendation(db, {
        stock_code: "000660",
        stock_name: "SK하이닉스",
        firm: "신한투자",
        opinion: "매수",
        target_price: 220000,
        scraped_at: `${today}T09:00:00Z`,
        report_date: today,
      })

      const result = getTrendRanking(db, 5, today)
      expect(result[0].stock_code).toBe("005930")
      expect(result[0].count).toBe(3)
      expect(result[0].rank).toBe(1)
      expect(result[1].stock_code).toBe("000660")
      expect(result[1].rank).toBe(2)
    })

    it("returns at most 10 entries", () => {
      const today = "2025-05-21"
      for (let i = 0; i < 15; i++) {
        insertRecommendation(db, {
          stock_code: `00000${i}`,
          stock_name: `종목${i}`,
          firm: "미래에셋",
          opinion: "매수",
          target_price: 100000,
          scraped_at: `${today}T09:00:00Z`,
          report_date: today,
        })
      }
      const result = getTrendRanking(db, 5, today)
      expect(result.length).toBeLessThanOrEqual(10)
    })
  })
})
