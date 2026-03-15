import { describe, test, expect } from 'vitest'
import {
  acceptsToon,
  encodeToon,
  TOON_CONTENT_TYPE,
  TOON_ACCEPT_HEADER,
  TOON_CHARSET,
} from '../src/index.js'
import { decode } from '@toon-format/toon'

describe('acceptsToon', () => {
  test('returns true for Accept: text/toon', () => {
    expect(acceptsToon('text/toon')).toBe(true)
  })

  test('returns true for Accept: text/toon; charset=utf-8', () => {
    expect(acceptsToon('text/toon; charset=utf-8')).toBe(true)
  })

  test('returns true for Accept with quality > 0', () => {
    expect(acceptsToon('text/toon;q=0.5, application/json;q=0.9')).toBe(true)
  })

  test('returns false for Accept: text/toon;q=0', () => {
    expect(acceptsToon('text/toon;q=0, application/json;q=1')).toBe(false)
  })

  test('returns false for missing Accept header', () => {
    expect(acceptsToon(undefined)).toBe(false)
    expect(acceptsToon(null)).toBe(false)
  })

  test('returns false for Accept: */*', () => {
    expect(acceptsToon('*/*')).toBe(false)
  })

  test('returns false for Accept: text/*', () => {
    expect(acceptsToon('text/*')).toBe(false)
  })

  test('returns false for Accept: application/json', () => {
    expect(acceptsToon('application/json')).toBe(false)
  })
})

describe('encodeToon', () => {
  test('encodes an object to TOON', () => {
    const result = encodeToon({ name: 'Alice', age: 30 })
    const parsed = decode(result)
    expect(parsed).toEqual({ name: 'Alice', age: 30 })
  })

  test('encodes an array of objects to tabular TOON', () => {
    const result = encodeToon([{ id: 1, name: 'Alice' }])
    expect(result).toContain('[1]{id,name}')
  })

  test('applies delimiter option', () => {
    const result = encodeToon([{ id: 1, name: 'Alice' }], { delimiter: '\t' })
    expect(result).toContain('1\tAlice')
  })

  test('applies keyFolding option', () => {
    const result = encodeToon({ data: { meta: { items: ['a'] } } }, { keyFolding: 'safe' })
    expect(result).toContain('data.meta.items')
  })
})

describe('constants', () => {
  test('TOON_CONTENT_TYPE is text/toon', () => {
    expect(TOON_CONTENT_TYPE).toBe('text/toon')
  })

  test('TOON_CHARSET includes charset=utf-8', () => {
    expect(TOON_CHARSET).toBe('text/toon; charset=utf-8')
  })

  test('TOON_ACCEPT_HEADER prefers toon over json', () => {
    expect(TOON_ACCEPT_HEADER).toBe('text/toon, application/json;q=0.9')
  })
})
