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
  it("returns empty array when no REPORT_IDX blocks found", () => {
    expect(parseNuxtReports("<html>no data</html>")).toEqual([])
  })

  it("extracts reports from Nuxt 2 compressed SSR format (param refs)", () => {
    // Nuxt 2 format: function(a,b,c,...){...})(val_a, val_b, val_c, ...)
    // Here c="미래에셋", e="Buy", m="2025-05-21"
    const html = `
      <script>window.__NUXT__=(function(a,b,c,d,e,f,g,h,i,j,k,l,m){return {
        data:[{REPORT_IDX:1,BUSINESS_CODE:"005930",BUSINESS_NAME:"삼성전자",OFFICE_NAME:c,GRADE_VALUE:e,TARGET_STOCK_PRICES:"98000",REPORT_DATE:m}]
      }})("null","b","미래에셋","d","Buy","f","g","h","i","j","k","l","2025-05-21");</script>
    `
    const result = parseNuxtReports(html)
    expect(result).toHaveLength(1)
    expect(result[0].BUSINESS_CODE).toBe("005930")
    expect(result[0].BUSINESS_NAME).toBe("삼성전자")
    expect(result[0].OFFICE_NAME).toBe("미래에셋")
    expect(result[0].GRADE_VALUE).toBe("Buy")
    expect(result[0].REPORT_DATE).toBe("2025-05-21")
  })

  it("extracts reports with literal string values", () => {
    const html = `
      <script>window.__NUXT__=(function(a){return {
        data:[{REPORT_IDX:2,BUSINESS_CODE:"000660",BUSINESS_NAME:"SK하이닉스",OFFICE_NAME:"한국투자",GRADE_VALUE:"Buy",TARGET_STOCK_PRICES:"220000",REPORT_DATE:"2025-05-21"}]
      }})(null);</script>
    `
    const result = parseNuxtReports(html)
    expect(result).toHaveLength(1)
    expect(result[0].BUSINESS_CODE).toBe("000660")
    expect(result[0].TARGET_STOCK_PRICES).toBe("220000")
  })

  it("skips records missing BUSINESS_CODE or REPORT_DATE", () => {
    const html = `
      <script>window.__NUXT__=(function(a){return {
        data:[{REPORT_IDX:3,BUSINESS_CODE:"",BUSINESS_NAME:"unknown",OFFICE_NAME:"firm",GRADE_VALUE:"Buy",TARGET_STOCK_PRICES:"100",REPORT_DATE:"2025-05-21"}]
      }})(null);</script>
    `
    const result = parseNuxtReports(html)
    expect(result).toHaveLength(0)
  })
})
