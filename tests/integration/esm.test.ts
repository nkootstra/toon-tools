/**
 * Integration tests that verify the built dist/ output is importable
 * via ESM. Uses relative paths to dist/ to avoid workspace resolution issues.
 *
 * Run `pnpm run build` before running these tests.
 */
import { describe, test, expect, vi, afterEach } from 'vitest'
import { Effect } from 'effect'

// Import from built dist/ via relative paths
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
} from '../../packages/core/dist/index.js'

import { toon as honoToon, toonJson as honoToonJson } from '../../packages/hono/dist/index.js'

import { toon as elysiaToon } from '../../packages/elysia/dist/index.js'

import {
  toonFetch,
  toonFetchEffect,
  createToonFetch,
  createToonFetchEffect,
  decodeToonResponse,
  isToonResponse,
  ToonFetchError,
} from '../../packages/fetch/dist/index.js'

import {
  ToonProvider,
  useToonQuery,
  useToonQueryEffect,
  useToonContext,
} from '../../packages/react/dist/index.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ESM dist imports: @toon-tools/core', () => {
  test('exports all expected functions', () => {
    expect(typeof acceptsToon).toBe('function')
    expect(typeof encodeToon).toBe('function')
    expect(typeof encodeToonSync).toBe('function')
    expect(typeof decodeToon).toBe('function')
  })

  test('exports all expected error classes', () => {
    const encErr = new ToonEncodeError({ cause: 'test' })
    expect(encErr._tag).toBe('ToonEncodeError')

    const decErr = new ToonDecodeError({ cause: 'test', input: 'bad' })
    expect(decErr._tag).toBe('ToonDecodeError')
  })

  test('exports all expected constants', () => {
    expect(TOON_CONTENT_TYPE).toBe('text/toon')
    expect(TOON_CONTENT_TYPE_HEADER).toBe('text/toon; charset=utf-8')
    expect(TOON_CHARSET).toBe(TOON_CONTENT_TYPE_HEADER)
    expect(TOON_ACCEPT_HEADER).toBe('text/toon, application/json;q=0.9')
  })

  test('encodeToonSync round-trips through decodeToon', async () => {
    const input = [{ id: 1, name: 'Alice' }]
    const encoded = encodeToonSync(input)
    const decoded = await Effect.runPromise(decodeToon(encoded))
    expect(decoded).toEqual(input)
  })

  test('encodeToon (Effect) round-trips through decodeToon', async () => {
    const input = { name: 'Alice', age: 30 }
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const encoded = yield* encodeToon(input)
        return yield* decodeToon(encoded)
      }),
    )
    expect(result).toEqual(input)
  })
})

describe('ESM dist imports: @toon-tools/hono', () => {
  test('exports toon middleware function', () => {
    expect(typeof honoToon).toBe('function')
  })

  test('exports toonJson helper function', () => {
    expect(typeof honoToonJson).toBe('function')
  })

  test('toon() returns a middleware handler', () => {
    const middleware = honoToon()
    expect(typeof middleware).toBe('function')
  })

  test('full Hono app round-trip', async () => {
    const { Hono } = await import('hono')
    const app = new Hono()
    app.use(honoToon())
    app.get('/data', (c: any) => c.json({ ok: true }))

    const res = await app.request('/data', {
      headers: { Accept: 'text/toon' },
    })

    expect(res.headers.get('Content-Type')).toBe('text/toon; charset=utf-8')
    const body = await res.text()
    expect(body).toContain('ok: true')
  })

  test('toonJson round-trip (zero-copy path)', async () => {
    const { Hono } = await import('hono')
    const app = new Hono()
    app.get('/data', (c: any) => honoToonJson(c, { ok: true }))

    const res = await app.request('/data', {
      headers: { Accept: 'text/toon' },
    })

    expect(res.headers.get('Content-Type')).toBe('text/toon; charset=utf-8')
    const body = await res.text()
    expect(body).toContain('ok: true')
  })
})

describe('ESM dist imports: @toon-tools/elysia', () => {
  test('exports toon plugin function', () => {
    expect(typeof elysiaToon).toBe('function')
  })

  test('full Elysia app round-trip', async () => {
    const { Elysia } = await import('elysia')
    const app = new Elysia().use(elysiaToon()).get('/data', () => ({ ok: true }))

    const res = await app.handle(
      new Request('http://localhost/data', {
        headers: { Accept: 'text/toon' },
      }),
    )

    expect(res.headers.get('Content-Type')).toBe('text/toon; charset=utf-8')
    const body = await res.text()
    expect(body).toContain('ok: true')
  })
})

describe('ESM dist imports: @toon-tools/fetch', () => {
  test('exports all expected functions', () => {
    expect(typeof toonFetch).toBe('function')
    expect(typeof toonFetchEffect).toBe('function')
    expect(typeof createToonFetch).toBe('function')
    expect(typeof createToonFetchEffect).toBe('function')
    expect(typeof decodeToonResponse).toBe('function')
    expect(typeof isToonResponse).toBe('function')
  })

  test('exports ToonFetchError', () => {
    const err = new ToonFetchError({ reason: 'Network' })
    expect(err._tag).toBe('ToonFetchError')
  })

  test('toonFetch end-to-end with Hono server', async () => {
    const { Hono } = await import('hono')
    const app = new Hono()
    app.use(honoToon())
    app.get('/users', (c: any) => c.json([{ id: 1, name: 'Alice' }]))

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        return app.request(url, init)
      }),
    )

    const data = await toonFetch('/users')
    expect(data).toEqual([{ id: 1, name: 'Alice' }])
  })

  test('toonFetchEffect end-to-end with Hono server', async () => {
    const { Hono } = await import('hono')
    const app = new Hono()
    app.use(honoToon())
    app.get('/users', (c: any) => c.json([{ id: 1, name: 'Alice' }]))

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        return app.request(url, init)
      }),
    )

    const data = await Effect.runPromise(toonFetchEffect('/users'))
    expect(data).toEqual([{ id: 1, name: 'Alice' }])
  })
})

describe('ESM dist imports: @toon-tools/react', () => {
  test('exports all expected functions', () => {
    expect(typeof ToonProvider).toBe('function')
    expect(typeof useToonQuery).toBe('function')
    expect(typeof useToonQueryEffect).toBe('function')
    expect(typeof useToonContext).toBe('function')
  })
})
