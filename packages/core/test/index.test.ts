import { Effect } from 'effect'
import { describe, expect, it } from '@effect/vitest'
import {
  acceptsToon,
  encodeToon,
  encodeToonSync,
  decodeToon,
  ToonEncodeError,
  ToonDecodeError,
  TOON_CONTENT_TYPE,
  TOON_ACCEPT_HEADER,
  TOON_CONTENT_TYPE_HEADER,
  TOON_CHARSET,
} from '../src/index.js'
import { decode } from '@toon-format/toon'

describe('acceptsToon', () => {
  it('returns true for Accept: text/toon', () => {
    expect(acceptsToon('text/toon')).toBe(true)
  })

  it('returns true for Accept: text/toon; charset=utf-8', () => {
    expect(acceptsToon('text/toon; charset=utf-8')).toBe(true)
  })

  it('returns true for Accept with quality > 0', () => {
    expect(acceptsToon('text/toon;q=0.5, application/json;q=0.9')).toBe(true)
  })

  it('returns false for Accept: text/toon;q=0', () => {
    expect(acceptsToon('text/toon;q=0, application/json;q=1')).toBe(false)
  })

  it('returns false for missing Accept header', () => {
    expect(acceptsToon(undefined)).toBe(false)
    expect(acceptsToon(null)).toBe(false)
  })

  it('returns false for Accept: */*', () => {
    expect(acceptsToon('*/*')).toBe(false)
  })

  it('returns false for Accept: text/*', () => {
    expect(acceptsToon('text/*')).toBe(false)
  })

  it('returns false for Accept: application/json', () => {
    expect(acceptsToon('application/json')).toBe(false)
  })

  it('returns false for superstring media types like text/toon-extended', () => {
    expect(acceptsToon('text/toon-extended')).toBe(false)
  })
})

describe('encodeToonSync', () => {
  it('encodes an object to TOON', () => {
    const result = encodeToonSync({ name: 'Alice', age: 30 })
    const parsed = decode(result)
    expect(parsed).toEqual({ name: 'Alice', age: 30 })
  })

  it('encodes an array of objects to tabular TOON', () => {
    const result = encodeToonSync([{ id: 1, name: 'Alice' }])
    expect(result).toContain('[1]{id,name}')
  })

  it('applies delimiter option', () => {
    const result = encodeToonSync([{ id: 1, name: 'Alice' }], { delimiter: '\t' })
    expect(result).toContain('1\tAlice')
  })

  it('applies keyFolding option', () => {
    const result = encodeToonSync({ data: { meta: { items: ['a'] } } }, { keyFolding: 'safe' })
    expect(result).toContain('data.meta.items')
  })
})

describe('encodeToon (Effect)', () => {
  it.effect('succeeds with TOON string for valid input', () =>
    Effect.gen(function* () {
      const result = yield* encodeToon({ name: 'Alice', age: 30 })
      const parsed = decode(result)
      expect(parsed).toEqual({ name: 'Alice', age: 30 })
    }),
  )

  it.effect('fails with ToonEncodeError on circular reference', () =>
    Effect.gen(function* () {
      const circular: Record<string, unknown> = {}
      circular.self = circular
      const error = yield* encodeToon(circular).pipe(Effect.flip)
      expect(error._tag).toBe('ToonEncodeError')
    }),
  )
})

describe('decodeToon (Effect)', () => {
  it.effect('succeeds with parsed JS for valid TOON', () =>
    Effect.gen(function* () {
      const toon = encodeToonSync({ name: 'Alice', age: 30 })
      const result = yield* decodeToon(toon)
      expect(result).toEqual({ name: 'Alice', age: 30 })
    }),
  )

  it.effect('fails with ToonDecodeError on malformed TOON', () =>
    Effect.gen(function* () {
      const error = yield* decodeToon('[2]{id,name}:\n  1,Alice').pipe(Effect.flip)
      expect(error._tag).toBe('ToonDecodeError')
    }),
  )

  it.effect('ToonDecodeError includes the input string', () =>
    Effect.gen(function* () {
      const badInput = '[2]{id,name}:\n  1,Alice'
      const error = yield* decodeToon(badInput).pipe(Effect.flip)
      expect(error.input).toBe(badInput)
    }),
  )
})

describe('tagged errors', () => {
  it('ToonEncodeError has _tag "ToonEncodeError"', () => {
    const error = new ToonEncodeError({ cause: 'test' })
    expect(error._tag).toBe('ToonEncodeError')
  })

  it('ToonDecodeError has _tag "ToonDecodeError"', () => {
    const error = new ToonDecodeError({ cause: 'test', input: 'bad' })
    expect(error._tag).toBe('ToonDecodeError')
    expect(error.input).toBe('bad')
  })
})

describe('constants', () => {
  it('TOON_CONTENT_TYPE is text/toon', () => {
    expect(TOON_CONTENT_TYPE).toBe('text/toon')
  })

  it('TOON_CONTENT_TYPE_HEADER is the full Content-Type with charset', () => {
    expect(TOON_CONTENT_TYPE_HEADER).toBe('text/toon; charset=utf-8')
  })

  it('TOON_CHARSET is a deprecated alias for TOON_CONTENT_TYPE_HEADER', () => {
    expect(TOON_CHARSET).toBe(TOON_CONTENT_TYPE_HEADER)
  })

  it('TOON_ACCEPT_HEADER prefers toon over json', () => {
    expect(TOON_ACCEPT_HEADER).toBe('text/toon, application/json;q=0.9')
  })
})
