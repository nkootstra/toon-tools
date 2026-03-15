import { Effect } from 'effect'
import { decode } from '@toon-format/toon'
import { ToonDecodeError } from './errors.js'

/**
 * Decodes a TOON string to a JS value. Returns an Effect that fails
 * with `ToonDecodeError` if the input is malformed.
 */
export const decodeToon = <T = unknown>(input: string): Effect.Effect<T, ToonDecodeError> =>
  Effect.try({
    try: () => decode(input) as T,
    catch: (cause) => new ToonDecodeError({ cause, input }),
  })
