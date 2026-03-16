import type { Context, MiddlewareHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import {
  acceptsToon,
  encodeToonSync,
  TOON_CONTENT_TYPE_HEADER,
  type ToonEncodeOptions,
} from '@toon-tools/core'

export type { ToonEncodeOptions as ToonOptions } from '@toon-tools/core'

/**
 * Hono middleware that transparently converts JSON responses to TOON
 * when the client sends `Accept: text/toon`.
 *
 * Note: this middleware reads the already-serialized JSON body and
 * parses it back to an object before TOON-encoding. For routes where
 * you want to avoid this round-trip, use `toonJson()` instead.
 */
export function toon(options?: ToonEncodeOptions): MiddlewareHandler {
  return async (c, next) => {
    await next()

    if (!acceptsToon(c.req.header('Accept'))) return

    const contentType = c.res.headers.get('Content-Type')
    if (!contentType?.includes('application/json')) return

    const json = await c.res.json()
    const toonBody = encodeToonSync(json, options)

    c.res = new Response(toonBody, {
      status: c.res.status,
      headers: { 'Content-Type': TOON_CONTENT_TYPE_HEADER },
    })
  }
}

/**
 * Returns a TOON or JSON response directly, skipping the
 * serialize-then-reparse cycle that the `toon()` middleware incurs.
 *
 * If the client sends `Accept: text/toon`, the data is encoded
 * straight to TOON. Otherwise it falls back to `c.json()`.
 *
 * Use this in individual route handlers for zero-overhead conversion:
 *
 * ```ts
 * app.get('/users', (c) => toonJson(c, [{ id: 1, name: 'Alice' }]))
 * ```
 */
export function toonJson(
  c: Context,
  data: unknown,
  options?: ToonEncodeOptions & { status?: ContentfulStatusCode },
): Response {
  if (acceptsToon(c.req.header('Accept'))) {
    const { status, ...encodeOptions } = options ?? {}
    const toonBody = encodeToonSync(data, encodeOptions)
    return c.body(toonBody, status ?? 200, { 'Content-Type': TOON_CONTENT_TYPE_HEADER })
  }

  return c.json(data as object, options?.status)
}
