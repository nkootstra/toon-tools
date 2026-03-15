import { TOON_CONTENT_TYPE } from './constants.js'

/**
 * Checks whether an Accept header includes `text/toon` with a quality > 0.
 *
 * Returns false for:
 * - Missing/empty Accept headers
 * - `text/toon;q=0` (explicitly rejected)
 * - Wildcard types like `*\/*` or `text/*` (TOON is opt-in only)
 */
export function acceptsToon(acceptHeader: string | null | undefined): boolean {
  if (!acceptHeader) return false

  const types = acceptHeader.split(',').map((t) => t.trim())
  for (const type of types) {
    const [mediaType, ...params] = type.split(';').map((s) => s.trim())
    if (!mediaType.includes(TOON_CONTENT_TYPE)) continue

    const qParam = params.find((p) => p.startsWith('q='))
    const q = qParam ? parseFloat(qParam.slice(2)) : 1
    if (q > 0) return true
  }

  return false
}
