// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useRealtimePrice } from "./useRealtimePrice"

function mockFetch(data: Record<string, number>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data }),
    })
  )
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe("useRealtimePrice", () => {
  it("returns empty map initially before first fetch resolves", () => {
    mockFetch({})
    const { result } = renderHook(() => useRealtimePrice(["005930"]))
    expect(result.current.size).toBe(0)
  })

  it("populates prices after first fetch", async () => {
    mockFetch({ "005930": 82400 })
    const { result } = renderHook(() => useRealtimePrice(["005930"]))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.get("005930")).toBe(82400)
  })

  it("populates multiple stock prices", async () => {
    mockFetch({ "005930": 82400, "000660": 195000 })
    const { result } = renderHook(() => useRealtimePrice(["005930", "000660"]))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.get("005930")).toBe(82400)
    expect(result.current.get("000660")).toBe(195000)
  })

  it("clears interval on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval")
    mockFetch({})
    const { unmount } = renderHook(() => useRealtimePrice(["005930"]))
    unmount()
    expect(clearSpy).toHaveBeenCalled()
  })

  it("does not fetch when codes is empty", () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)
    renderHook(() => useRealtimePrice([]))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("polls again after interval", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { "005930": 82400 } }),
    })
    vi.stubGlobal("fetch", fetchSpy)

    renderHook(() => useRealtimePrice(["005930"]))

    await act(async () => { await Promise.resolve() })
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await act(async () => { vi.advanceTimersByTime(5000) })
    await act(async () => { await Promise.resolve() })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it("ignores fetch errors and keeps previous prices", async () => {
    mockFetch({ "005930": 82400 })
    const { result } = renderHook(() => useRealtimePrice(["005930"]))

    await act(async () => { await Promise.resolve() })
    expect(result.current.get("005930")).toBe(82400)

    // Next poll fails
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")))
    await act(async () => { vi.advanceTimersByTime(5000) })
    await act(async () => { await Promise.resolve() })

    // Price should remain
    expect(result.current.get("005930")).toBe(82400)
  })
})
