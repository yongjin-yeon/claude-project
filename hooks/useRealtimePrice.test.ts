import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useRealtimePrice } from "./useRealtimePrice"

class MockEventSource {
  static instances: MockEventSource[] = []
  url: string
  onmessage: ((e: { data: string }) => void) | null = null
  closed = false

  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
  }

  close() {
    this.closed = true
  }

  emit(data: string) {
    this.onmessage?.({ data })
  }
}

beforeEach(() => {
  MockEventSource.instances = []
  vi.stubGlobal("EventSource", MockEventSource)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useRealtimePrice", () => {
  it("returns empty map initially", () => {
    const { result } = renderHook(() => useRealtimePrice(["005930"]))
    expect(result.current.size).toBe(0)
  })

  it("updates price on SSE message", () => {
    const { result } = renderHook(() => useRealtimePrice(["005930"]))
    const es = MockEventSource.instances[0]

    act(() => {
      es.emit(JSON.stringify({ code: "005930", price: 82400 }))
    })

    expect(result.current.get("005930")).toBe(82400)
  })

  it("accumulates multiple stock prices", () => {
    const { result } = renderHook(() => useRealtimePrice(["005930", "000660"]))
    const es = MockEventSource.instances[0]

    act(() => {
      es.emit(JSON.stringify({ code: "005930", price: 82400 }))
      es.emit(JSON.stringify({ code: "000660", price: 195000 }))
    })

    expect(result.current.get("005930")).toBe(82400)
    expect(result.current.get("000660")).toBe(195000)
  })

  it("closes EventSource on unmount", () => {
    const { unmount } = renderHook(() => useRealtimePrice(["005930"]))
    const es = MockEventSource.instances[0]
    unmount()
    expect(es.closed).toBe(true)
  })

  it("does not create EventSource when codes is empty", () => {
    renderHook(() => useRealtimePrice([]))
    expect(MockEventSource.instances.length).toBe(0)
  })

  it("ignores malformed SSE messages", () => {
    const { result } = renderHook(() => useRealtimePrice(["005930"]))
    const es = MockEventSource.instances[0]

    act(() => {
      es.emit("not valid json")
    })

    expect(result.current.size).toBe(0)
  })
})
