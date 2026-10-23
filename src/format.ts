// Four significant figures reads well for most values; at 1000 and above that would round away
// digits before the decimal point, so those keep every whole digit instead.
const SMALL_NUMBER = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 4 })
const LARGE_NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** A measured value as it is shown to the user. */
export function formatNumber(value: number): string {
  return (Math.abs(value) >= 1000 ? LARGE_NUMBER : SMALL_NUMBER).format(value)
}

/**
 * The number the user typed, or `null` if it is not one. Accepts the thousands separators
 * {@link formatNumber} writes, so a shown value can be edited and committed as it stands.
 */
export function parseNumber(text: string): number | null {
  const trimmed = text.trim().replace(/,/g, '')
  if (trimmed === '') return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}
