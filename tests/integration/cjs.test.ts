/**
 * Integration tests that verify the built dist/ output is importable
 * via CJS require(). Uses relative paths to dist/ to match the ESM
 * tests and avoid workspace resolution issues with createRequire.
 *
 * Run `pnpm run build` before running these tests.
 */
import { describe, test, expect } from 'vitest'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

function requireDist(pkg: string) {
  return require(resolve(__dirname, '..', '..', 'packages', pkg, 'dist', 'index.cjs'))
}

describe('CJS require: @toon-tools/core', () => {
  test('all expected exports are accessible', () => {
    const core = requireDist('core')
    expect(typeof core.acceptsToon).toBe('function')
    expect(typeof core.encodeToon).toBe('function')
    expect(typeof core.encodeToonSync).toBe('function')
    expect(typeof core.decodeToon).toBe('function')
    expect(typeof core.ToonEncodeError).toBe('function')
    expect(typeof core.ToonDecodeError).toBe('function')
    expect(core.TOON_CONTENT_TYPE).toBe('text/toon')
    expect(core.TOON_CONTENT_TYPE_HEADER).toBe('text/toon; charset=utf-8')
    expect(core.TOON_CHARSET).toBe(core.TOON_CONTENT_TYPE_HEADER)
    expect(core.TOON_ACCEPT_HEADER).toBe('text/toon, application/json;q=0.9')
  })

  test('encodeToonSync produces valid output', () => {
    const core = requireDist('core')
    const result = core.encodeToonSync({ name: 'Alice' })
    expect(typeof result).toBe('string')
    expect(result).toContain('name: Alice')
  })
})

describe('CJS require: @toon-tools/hono', () => {
  test('exports toon function', () => {
    const hono = requireDist('hono')
    expect(typeof hono.toon).toBe('function')
  })

  test('exports toonJson function', () => {
    const hono = requireDist('hono')
    expect(typeof hono.toonJson).toBe('function')
  })
})

describe('CJS require: @toon-tools/elysia', () => {
  test('exports toon function', () => {
    const elysia = requireDist('elysia')
    expect(typeof elysia.toon).toBe('function')
  })
})

describe('CJS require: @toon-tools/fetch', () => {
  test('all expected exports are accessible', () => {
    const fetch = requireDist('fetch')
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
    const react = requireDist('react')
    expect(typeof react.ToonProvider).toBe('function')
    expect(typeof react.useToonQuery).toBe('function')
    expect(typeof react.useToonQueryEffect).toBe('function')
    expect(typeof react.useToonContext).toBe('function')
  })
})
