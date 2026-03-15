import { decode } from '@toon-format/toon'
import { TOON_CONTENT_TYPE, TOON_ACCEPT_HEADER } from '@toon-tools/core'

export { TOON_CONTENT_TYPE, TOON_ACCEPT_HEADER } from '@toon-tools/core'

export interface ToonFetchInit extends RequestInit {
  fallback?: 'json' | 'throw'
}

export interface ToonFetchConfig {
  baseUrl?: string
  headers?: HeadersInit
  fallback?: 'json' | 'throw'
}

/**
 * Checks whether a Response has a TOON Content-Type.
 */
export function isToonResponse(response: Response): boolean {
  const ct = response.headers.get('Content-Type') ?? ''
  return ct.includes(TOON_CONTENT_TYPE)
}

/**
 * Decodes a Response body from TOON format to a JS value.
 */
export async function decodeToonResponse<T = unknown>(response: Response): Promise<T> {
  const text = await response.text()
  return decode(text) as T
}

/**
 * Fetch wrapper that sets Accept: text/toon and auto-decodes the response.
 * Works as a TanStack Query queryFn, SWR fetcher, or standalone.
 */
export async function toonFetch<T = unknown>(url: string, init?: ToonFetchInit): Promise<T> {
  const fallback = init?.fallback ?? 'json'
  const headers = new Headers(init?.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', TOON_ACCEPT_HEADER)
  }

  const response = await fetch(url, { ...init, headers })

  if (isToonResponse(response)) {
    return decodeToonResponse<T>(response)
  }

  const ct = response.headers.get('Content-Type') ?? ''
  if (ct.includes('application/json')) {
    return response.json() as Promise<T>
  }

  if (fallback === 'throw') {
    throw new Error(`Unexpected Content-Type: ${ct}. Expected text/toon or application/json.`)
  }

  return response.json() as Promise<T>
}

/**
 * Creates a configured toonFetch instance with baseUrl and default headers.
 */
export function createToonFetch(config: ToonFetchConfig) {
  return async function <T = unknown>(url: string, init?: ToonFetchInit): Promise<T> {
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

    return toonFetch<T>(resolvedUrl, {
      ...init,
      headers: mergedHeaders,
      fallback: init?.fallback ?? config.fallback,
    })
  }
}
