import { Effect } from 'effect'
import { encode, type EncodeOptions } from '@toon-format/toon'
import { ToonEncodeError } from './errors.js'

export interface ToonEncodeOptions {
  delimiter?: EncodeOptions['delimiter']
  keyFolding?: EncodeOptions['keyFolding']
}

/**
 * Encodes a value to TOON format. Returns an Effect that fails
 * with `ToonEncodeError` if encoding fails.
 */
export const encodeToon = (
  value: unknown,
  options?: ToonEncodeOptions,
): Effect.Effect<string, ToonEncodeError> =>
  Effect.try({
    try: () => encode(value, options),
    catch: (cause) => new ToonEncodeError({ cause }),
  })

/**
 * Synchronous TOON encoding. Used by server middleware adapters
 * (Hono, Elysia) where Effect is not needed.
 */
export function encodeToonSync(value: unknown, options?: ToonEncodeOptions): string {
  return encode(value, options)
}
