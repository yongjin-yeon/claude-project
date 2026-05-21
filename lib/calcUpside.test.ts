import { describe, it, expect } from "vitest"
import { calcUpside } from "./calcUpside"

describe("calcUpside", () => {
  it("returns percentage when both values are present", () => {
    expect(calcUpside(98000, 82400)).toBeCloseTo(18.93, 1)
  })

  it("returns null when targetPrice is null", () => {
    expect(calcUpside(null, 82400)).toBeNull()
  })

  it("returns null when currentPrice is null", () => {
    expect(calcUpside(98000, null)).toBeNull()
  })

  it("returns null when currentPrice is 0 (division guard)", () => {
    expect(calcUpside(98000, 0)).toBeNull()
  })

  it("returns negative percentage when target is below current", () => {
    expect(calcUpside(70000, 82400)).toBeCloseTo(-15.05, 1)
  })
})
