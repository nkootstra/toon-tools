import { Elysia } from 'elysia'
import { acceptsToon, encodeToon, TOON_CHARSET, type ToonEncodeOptions } from '@toon-tools/core'

export type { ToonEncodeOptions as ToonOptions } from '@toon-tools/core'

export function toon(options?: ToonEncodeOptions) {
  return new Elysia({ name: '@toon-tools/elysia' }).mapResponse(
    { as: 'global' },
    ({ request, responseValue }) => {
      if (!acceptsToon(request.headers.get('Accept'))) return

      if (
        responseValue === null ||
        responseValue === undefined ||
        typeof responseValue !== 'object'
      )
        return

      const toonBody = encodeToon(responseValue, options)
      return new Response(toonBody, {
        headers: { 'Content-Type': TOON_CHARSET },
      })
    },
  )
}
