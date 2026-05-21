import { getDb, getConsensus } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const db = getDb()
  const consensus = getConsensus(db, code)

  if (!consensus) {
    return Response.json({ error: "종목 데이터 없음" }, { status: 404 })
  }

  return Response.json({ data: consensus })
}
