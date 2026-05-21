import { NextRequest } from "next/server"
import WebSocket from "ws"

async function getApprovalKey(): Promise<string> {
  const res = await fetch("https://openapi.koreainvestment.com:9443/oauth2/Approval", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: process.env.KIS_APP_KEY,
      secretkey: process.env.KIS_APP_SECRET,
    }),
  })
  if (!res.ok) throw new Error(`KIS approval key failed: ${res.status}`)
  const json = (await res.json()) as { approval_key: string }
  return json.approval_key
}

function subscribeMsg(approvalKey: string, trKey: string): string {
  return JSON.stringify({
    header: {
      approval_key: approvalKey,
      custtype: "P",
      tr_type: "1",
      "content-type": "utf-8",
    },
    body: {
      input: {
        tr_id: "H0STCNT0",
        tr_key: trKey,
      },
    },
  })
}

// Format: 0|H0STCNT0|001|{code}^{time}^{price}^...
function parsePrice(raw: string): { code: string; price: number } | null {
  const parts = raw.split("|")
  if (parts[0] !== "0" || parts[1] !== "H0STCNT0") return null
  const fields = parts[3]?.split("^")
  if (!fields) return null
  const code = fields[0]
  const price = parseInt(fields[2], 10)
  if (!code || isNaN(price) || price <= 0) return null
  return { code, price }
}

export async function GET(request: NextRequest) {
  const codes = (request.nextUrl.searchParams.get("codes") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)

  if (codes.length === 0) {
    return new Response("codes parameter required", { status: 400 })
  }

  const encoder = new TextEncoder()
  let ws: WebSocket | null = null
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        if (!closed) controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      try {
        const approvalKey = await getApprovalKey()
        const wsUrl = process.env.KIS_MOCK === "true"
          ? "wss://openapivts.koreainvestment.com:29443/websocket"
          : "wss://ops.koreainvestment.com:21000"

        ws = new WebSocket(wsUrl)

        ws.on("open", () => {
          for (const code of codes) {
            ws!.send(subscribeMsg(approvalKey, code))
          }
        })

        ws.on("message", (raw: Buffer) => {
          const text = raw.toString()
          const parsed = parsePrice(text)
          if (parsed) send(JSON.stringify(parsed))
        })

        ws.on("error", () => {
          if (!closed) { controller.close(); closed = true }
        })

        ws.on("close", () => {
          if (!closed) { controller.close(); closed = true }
        })
      } catch {
        if (!closed) { controller.close(); closed = true }
      }
    },
    cancel() {
      closed = true
      ws?.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
