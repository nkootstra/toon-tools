import { encode, type EncodeOptions } from '@toon-format/toon'

export interface ToonEncodeOptions {
  delimiter?: EncodeOptions['delimiter']
  keyFolding?: EncodeOptions['keyFolding']
}

/**
 * Encodes a JSON-serializable value to TOON format.
 * Thin wrapper around `@toon-format/toon`'s `encode` that accepts
 * the subset of options relevant to server-side encoding.
 */
export function encodeToon(value: unknown, options?: ToonEncodeOptions): string {
  return encode(value, options)
}
