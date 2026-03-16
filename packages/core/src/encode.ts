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
 * Synchronous TOON encoding for non-Effect consumers.
 * Used by server middleware (Hono, Elysia) and Promise-based wrappers.
 */
export function encodeToonSync(value: unknown, options?: ToonEncodeOptions): string {
  return encode(value, options)
}
