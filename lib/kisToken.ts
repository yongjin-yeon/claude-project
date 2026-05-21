interface TokenCache {
  token: string
  expiresAt: number // ms epoch
}

let cache: TokenCache | null = null

export async function getKisAccessToken(): Promise<string> {
  if (cache && Date.now() < cache.expiresAt - 60_000) {
    return cache.token
  }

  const appKey = process.env.KIS_APP_KEY
  const appSecret = process.env.KIS_APP_SECRET
  if (!appKey || !appSecret) throw new Error("KIS_APP_KEY / KIS_APP_SECRET not set")

  const res = await fetch("https://openapi.koreainvestment.com:9443/oauth2/tokenP", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: appKey,
      appsecret: appSecret,
    }),
  })

  if (!res.ok) throw new Error(`KIS token fetch failed: ${res.status}`)

  const json = (await res.json()) as { access_token: string; expires_in: number }
  cache = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  }
  return cache.token
}
