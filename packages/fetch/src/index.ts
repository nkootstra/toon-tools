import { Effect, Data } from 'effect'
import {
  TOON_CONTENT_TYPE,
  TOON_ACCEPT_HEADER,
  decodeToon,
  decodeToonSync,
  type ToonDecodeError,
} from '@toon-tools/core'

export { TOON_CONTENT_TYPE, TOON_ACCEPT_HEADER } from '@toon-tools/core'
export type { ToonDecodeError } from '@toon-tools/core'

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ToonFetchError extends Data.TaggedError('ToonFetchError')<{
  readonly reason: 'Network' | 'UnexpectedContentType'
  readonly cause?: unknown
  readonly contentType?: string
}> {}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToonFetchInit extends RequestInit {
  fallback?: 'json' | 'throw'
}

export interface ToonFetchConfig {
  baseUrl?: string
  headers?: HeadersInit
  fallback?: 'json' | 'throw'
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Checks whether a Response has a TOON Content-Type.
 * Extracts the media type before parameters (e.g. charset)
 * and compares exactly, matching the approach in `acceptsToon`.
 */
export function isToonResponse(response: Response): boolean {
  const ct = response.headers.get('Content-Type') ?? ''
  const mediaType = ct.split(';')[0].trim()
  return mediaType === TOON_CONTENT_TYPE
}

/**
 * Decodes a Response body from TOON format to a JS value.
 */
export async function decodeToonResponse<T = unknown>(response: Response): Promise<T> {
  const text = await response.text()
  return decodeToonSync<T>(text)
}

// ---------------------------------------------------------------------------
// Effect-native API
// ---------------------------------------------------------------------------

/**
 * Effect-native fetch that sets Accept: text/toon and auto-decodes.
 * Returns typed errors: ToonFetchError | ToonDecodeError.
 *
 * Content negotiation logic:
 * - `text/toon` response → TOON-decoded
 * - `application/json` response → JSON-parsed
 * - Other content types → depends on `fallback` option:
 *   - `'json'` (default) — optimistically attempts JSON parsing
 *   - `'throw'` — fails with `ToonFetchError { reason: 'UnexpectedContentType' }`
 */
export const toonFetchEffect = <T = unknown>(
  url: string,
  init?: ToonFetchInit,
): Effect.Effect<T, ToonFetchError | ToonDecodeError> => {
  const fallback = init?.fallback ?? 'json'
  const headers = new Headers(init?.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', TOON_ACCEPT_HEADER)
  }

  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url, { ...init, headers }),
      catch: (cause) => new ToonFetchError({ reason: 'Network', cause }),
    })

    if (isToonResponse(response)) {
      const text = yield* Effect.tryPromise({
        try: () => response.text(),
        catch: (cause) => new ToonFetchError({ reason: 'Network', cause }),
      })
      return yield* decodeToon<T>(text)
    }

    const ct = response.headers.get('Content-Type') ?? ''

    // When fallback is 'throw' and the response is neither TOON nor JSON,
    // fail with a typed error so callers can distinguish unexpected content.
    if (fallback === 'throw' && !ct.includes('application/json')) {
      return yield* Effect.fail(
        new ToonFetchError({ reason: 'UnexpectedContentType', contentType: ct }),
      )
    }

    // JSON response or default fallback: attempt JSON parsing.
    // In fallback mode, non-JSON content types are optimistically parsed
    // as JSON — this will throw if the body isn't valid JSON.
    return yield* Effect.tryPromise({
      try: () => response.json() as Promise<T>,
      catch: (cause) => new ToonFetchError({ reason: 'Network', cause }),
    })
  })
}

/**
 * Creates a configured Effect-native toonFetch with baseUrl and default headers.
 */
export function createToonFetchEffect(config: ToonFetchConfig) {
  return <T = unknown>(
    url: string,
    init?: ToonFetchInit,
  ): Effect.Effect<T, ToonFetchError | ToonDecodeError> => {
    const resolvedUrl = config.baseUrl
      ? `${config.baseUrl.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`
      : url

    const mergedHeaders = new Headers(config.headers)
    if (init?.headers) {
      const initHeaders = new Headers(init.headers)
      initHeaders.forEach((value, key) => {
        mergedHeaders.set(key, value)
      })
    }

    return toonFetchEffect<T>(resolvedUrl, {
      ...init,
      headers: mergedHeaders,
      fallback: init?.fallback ?? config.fallback,
    })
  }
}

// ---------------------------------------------------------------------------
// Promise wrappers (convenience for non-Effect consumers)
// ---------------------------------------------------------------------------

/**
 * Fetch wrapper that sets Accept: text/toon and auto-decodes the response.
 * Works as a TanStack Query queryFn, SWR fetcher, or standalone.
 */
export async function toonFetch<T = unknown>(url: string, init?: ToonFetchInit): Promise<T> {
  return Effect.runPromise(toonFetchEffect<T>(url, init))
}

/**
 * Creates a configured toonFetch instance with baseUrl and default headers.
 */
export function createToonFetch(config: ToonFetchConfig) {
  const effectFetcher = createToonFetchEffect(config)
  return async function <T = unknown>(url: string, init?: ToonFetchInit): Promise<T> {
    return Effect.runPromise(effectFetcher<T>(url, init))
  }
}
