// @vitest-environment node
import { describe, it, expect } from "vitest"
import { mapOpinion, parseNuxtReports } from "./scraper"

describe("mapOpinion", () => {
  it.each([
    ["Buy", "매수"],
    ["buy", "매수"],
    ["Outperform", "매수"],
    ["Strong Buy", "매수"],
    ["Hold", "중립"],
    ["Neutral", "중립"],
    ["Sell", "매도"],
    ["Underperform", "매도"],
  ])("maps '%s' → '%s'", (input, expected) => {
    expect(mapOpinion(input)).toBe(expected)
  })

  it("returns original string for unknown opinion", () => {
    expect(mapOpinion("Unknown")).toBe("Unknown")
  })
})

describe("parseNuxtReports", () => {
  it("returns empty array when todayReports not found", () => {
    expect(parseNuxtReports("<html>no data</html>")).toEqual([])
  })

  it("extracts todayReports from __NUXT__ embedded HTML", () => {
    const html = `
      <script>window.__NUXT__=(function(a,b){return {data:[{
        "todayReports":[
          {"REPORT_IDX":1,"BUSINESS_CODE":"005930","BUSINESS_NAME":"삼성전자","OFFICE_NAME":"미래에셋","GRADE_VALUE":"Buy","TARGET_STOCK_PRICES":"98000","REPORT_DATE":"2025-05-21"}
        ],"topAnalysts":[]}]}}())</script>
    `
    const result = parseNuxtReports(html)
    expect(result).toHaveLength(1)
    expect(result[0].BUSINESS_CODE).toBe("005930")
    expect(result[0].BUSINESS_NAME).toBe("삼성전자")
    expect(result[0].GRADE_VALUE).toBe("Buy")
  })
})
