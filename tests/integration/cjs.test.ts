/**
 * Integration tests that verify the built dist/ output is importable
 * via CJS require(). Tests that the "require" condition in package.json
 * "exports" resolves correctly.
 *
 * Run `pnpm run build` before running these tests.
 */
import { describe, test, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

describe('CJS require: @toon-tools/core', () => {
  test('all expected exports are accessible', () => {
    const core = require('@toon-tools/core')
    expect(typeof core.acceptsToon).toBe('function')
    expect(typeof core.encodeToon).toBe('function')
    expect(typeof core.encodeToonSync).toBe('function')
    expect(typeof core.decodeToon).toBe('function')
    expect(typeof core.ToonEncodeError).toBe('function')
    expect(typeof core.ToonDecodeError).toBe('function')
    expect(core.TOON_CONTENT_TYPE).toBe('text/toon')
    expect(core.TOON_CHARSET).toBe('text/toon; charset=utf-8')
    expect(core.TOON_ACCEPT_HEADER).toBe('text/toon, application/json;q=0.9')
  })

  test('encodeToonSync produces valid output', () => {
    const core = require('@toon-tools/core')
    const result = core.encodeToonSync({ name: 'Alice' })
    expect(typeof result).toBe('string')
    expect(result).toContain('name: Alice')
  })
})

describe('CJS require: @toon-tools/hono', () => {
  test('exports toon function', () => {
    const hono = require('@toon-tools/hono')
    expect(typeof hono.toon).toBe('function')
  })
})

describe('CJS require: @toon-tools/elysia', () => {
  test('exports toon function', () => {
    const elysia = require('@toon-tools/elysia')
    expect(typeof elysia.toon).toBe('function')
  })
})

describe('CJS require: @toon-tools/fetch', () => {
  test('all expected exports are accessible', () => {
    const fetch = require('@toon-tools/fetch')
    expect(typeof fetch.toonFetch).toBe('function')
    expect(typeof fetch.toonFetchEffect).toBe('function')
    expect(typeof fetch.createToonFetch).toBe('function')
    expect(typeof fetch.createToonFetchEffect).toBe('function')
    expect(typeof fetch.decodeToonResponse).toBe('function')
    expect(typeof fetch.isToonResponse).toBe('function')
    expect(typeof fetch.ToonFetchError).toBe('function')
    expect(fetch.TOON_ACCEPT_HEADER).toBe('text/toon, application/json;q=0.9')
    expect(fetch.TOON_CONTENT_TYPE).toBe('text/toon')
  })
})

describe('CJS require: @toon-tools/react', () => {
  test('all expected exports are accessible', () => {
    const react = require('@toon-tools/react')
    expect(typeof react.ToonProvider).toBe('function')
    expect(typeof react.useToonQuery).toBe('function')
    expect(typeof react.useToonQueryEffect).toBe('function')
    expect(typeof react.useToonContext).toBe('function')
  })
})
