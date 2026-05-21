import { getDb, getTrendRanking } from "@/lib/db"

function todayKST(): string {
  return new Date()
    .toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
    .replace(/\. /g, "-")
    .replace(/\.$/, "")
    .split("-")
    .map((p) => p.padStart(2, "0"))
    .join("-")
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get("days") ?? "5", 10)

  if (![5, 20, 60].includes(days)) {
    return Response.json({ error: "days must be 5, 20, or 60" }, { status: 400 })
  }

  const db = getDb()
  const today = todayKST()
  const ranking = getTrendRanking(db, days, today)

  return Response.json({ data: ranking })
}
