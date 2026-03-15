import type { MiddlewareHandler } from 'hono'
import { acceptsToon, encodeToonSync, TOON_CHARSET, type ToonEncodeOptions } from '@toon-tools/core'

export type { ToonEncodeOptions as ToonOptions } from '@toon-tools/core'

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
      headers: { 'Content-Type': TOON_CHARSET },
    })
  }
}
