export function calcUpside(
  targetPrice: number | null,
  currentPrice: number | null
): number | null {
  if (targetPrice == null || currentPrice == null || currentPrice === 0) return null
  return ((targetPrice - currentPrice) / currentPrice) * 100
}
