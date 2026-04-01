import { Effect } from 'effect'
import { describe, expect, it } from '@effect/vitest'
import { vi, afterEach } from 'vitest'
import { encode } from '@toon-format/toon'
import {
  toonFetch,
  toonFetchEffect,
  createToonFetch,
  createToonFetchEffect,
  decodeToonResponse,
  isToonResponse,
  ToonFetchError,
  TOON_ACCEPT_HEADER,
} from '../src/index.js'

afterEach(() => {
  vi.restoreAllMocks()
})

function mockResponse(body: string, contentType: string) {
  return new Response(body, {
    headers: { 'Content-Type': contentType },
  })
}

function stubFetch(body: string, contentType: string) {
  const mock = vi.fn<typeof fetch>().mockResolvedValue(mockResponse(body, contentType))
  vi.stubGlobal('fetch', mock)
  return mock
}

describe('toonFetch', () => {
  it('sends Accept: text/toon header with JSON fallback', async () => {
    const mock = stubFetch('{}', 'application/json')

    await toonFetch('/api/users')

    const [, init] = mock.mock.calls[0]
    expect(init.headers.get('Accept')).toBe(TOON_ACCEPT_HEADER)
  })

  it('decodes text/toon response to JS object', async () => {
    const toonBody = encode([{ id: 1, name: 'Alice' }])
    stubFetch(toonBody, 'text/toon; charset=utf-8')

    const data = await toonFetch<Array<{ id: number; name: string }>>('/api/users')

    expect(data).toEqual([{ id: 1, name: 'Alice' }])
  })

  it('falls back to JSON parsing when server returns application/json', async () => {
    stubFetch(JSON.stringify({ name: 'Alice' }), 'application/json')

    const data = await toonFetch<{ name: string }>('/api/user')

    expect(data).toEqual({ name: 'Alice' })
  })

  it('throws on non-TOON/non-JSON response when fallback is throw', async () => {
    stubFetch('<h1>Not Found</h1>', 'text/html')

    await expect(toonFetch('/api/users', { fallback: 'throw' })).rejects.toThrow()
  })

  it('preserves custom headers passed in init', async () => {
    const mock = stubFetch('{}', 'application/json')

    await toonFetch('/api/users', {
      headers: { Authorization: 'Bearer token123' },
    })

    const [, init] = mock.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer token123')
    expect(headers.get('Accept')).toBe(TOON_ACCEPT_HEADER)
  })

  it('createToonFetch prepends baseUrl to relative paths', async () => {
    const mock = stubFetch('{}', 'application/json')

    const api = createToonFetch({ baseUrl: 'https://api.example.com' })
    await api('/users')

    const [url] = mock.mock.calls[0]
    expect(url).toBe('https://api.example.com/users')
  })

  it('createToonFetch merges default headers with per-request headers', async () => {
    const mock = stubFetch('{}', 'application/json')

    const api = createToonFetch({
      headers: { Authorization: 'Bearer default' },
    })
    await api('/users', { headers: { 'X-Custom': 'value' } })

    const [, init] = mock.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer default')
    expect(headers.get('X-Custom')).toBe('value')
  })

  it('propagates network errors from fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(toonFetch('/api/users')).rejects.toThrow()
  })
})

describe('toonFetchEffect', () => {
  it.effect('succeeds with decoded TOON data', () => {
    const toonBody = encode([{ id: 1, name: 'Alice' }])
    stubFetch(toonBody, 'text/toon; charset=utf-8')

    return Effect.gen(function* () {
      const data = yield* toonFetchEffect<Array<{ id: number; name: string }>>('/api/users')
      expect(data).toEqual([{ id: 1, name: 'Alice' }])
    })
  })

  it.effect('falls back to JSON when server returns application/json', () => {
    stubFetch(JSON.stringify({ name: 'Alice' }), 'application/json')

    return Effect.gen(function* () {
      const data = yield* toonFetchEffect<{ name: string }>('/api/user')
      expect(data).toEqual({ name: 'Alice' })
    })
  })

  it.effect('fails with ToonFetchError on network error', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    return Effect.gen(function* () {
      const error = yield* toonFetchEffect('/api/users').pipe(Effect.flip)
      expect(error._tag).toBe('ToonFetchError')
    })
  })

  it.effect('fails with ToonFetchError on unexpected Content-Type when fallback is throw', () => {
    stubFetch('<h1>Not Found</h1>', 'text/html')

    return Effect.gen(function* () {
      const error = yield* toonFetchEffect('/api/users', { fallback: 'throw' }).pipe(Effect.flip)
      expect(error._tag).toBe('ToonFetchError')
      expect((error as ToonFetchError).reason).toBe('UnexpectedContentType')
      expect((error as ToonFetchError).contentType).toBe('text/html')
    })
  })

  it.effect('createToonFetchEffect prepends baseUrl', () => {
    const mock = stubFetch('{}', 'application/json')

    return Effect.gen(function* () {
      const api = createToonFetchEffect({ baseUrl: 'https://api.example.com' })
      yield* api('/users')

      const [url] = mock.mock.calls[0]
      expect(url).toBe('https://api.example.com/users')
    })
  })

  it('ToonFetchError has correct _tag', () => {
    const error = new ToonFetchError({ reason: 'Network' })
    expect(error._tag).toBe('ToonFetchError')
  })
})

describe('isToonResponse', () => {
  it('returns true for text/toon Content-Type with charset', () => {
    const res = mockResponse('', 'text/toon; charset=utf-8')
    expect(isToonResponse(res)).toBe(true)
  })

  it('returns true for bare text/toon Content-Type (no charset)', () => {
    const res = mockResponse('', 'text/toon')
    expect(isToonResponse(res)).toBe(true)
  })

  it('returns false for application/json Content-Type', () => {
    const res = mockResponse('', 'application/json')
    expect(isToonResponse(res)).toBe(false)
  })
})

describe('decodeToonResponse', () => {
  it('decodes a Response with TOON body', async () => {
    const toonBody = encode({ name: 'Alice', age: 30 })
    const res = mockResponse(toonBody, 'text/toon; charset=utf-8')

    const data = await decodeToonResponse<{ name: string; age: number }>(res)

    expect(data).toEqual({ name: 'Alice', age: 30 })
  })

  it('throws on malformed TOON body', async () => {
    const res = mockResponse('[2]{id,name}:\n  1,Alice', 'text/toon')

    await expect(decodeToonResponse(res)).rejects.toThrow('Expected 2 tabular rows, but got 1')
  })

  it('decodes values with special characters correctly', async () => {
    const original = [{ id: 1, note: 'hello, world', tag: 'key: val' }]
    const toonBody = encode(original)
    const res = mockResponse(toonBody, 'text/toon')

    const data = await decodeToonResponse(res)

    expect(data).toEqual(original)
  })
})
