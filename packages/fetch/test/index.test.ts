import { describe, test, expect, vi, afterEach } from 'vitest'
import { encode } from '@toon-format/toon'
import {
  toonFetch,
  createToonFetch,
  decodeToonResponse,
  isToonResponse,
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
  const mock = vi.fn().mockResolvedValue(mockResponse(body, contentType))
  vi.stubGlobal('fetch', mock)
  return mock
}

describe('toonFetch', () => {
  test('sends Accept: text/toon header with JSON fallback', async () => {
    const mock = stubFetch('{}', 'application/json')

    await toonFetch('/api/users')

    const [, init] = mock.mock.calls[0]
    expect(init.headers.get('Accept')).toBe(TOON_ACCEPT_HEADER)
  })

  test('decodes text/toon response to JS object', async () => {
    const toonBody = encode([{ id: 1, name: 'Alice' }])
    stubFetch(toonBody, 'text/toon; charset=utf-8')

    const data = await toonFetch<Array<{ id: number; name: string }>>('/api/users')

    expect(data).toEqual([{ id: 1, name: 'Alice' }])
  })

  test('falls back to JSON parsing when server returns application/json', async () => {
    stubFetch(JSON.stringify({ name: 'Alice' }), 'application/json')

    const data = await toonFetch<{ name: string }>('/api/user')

    expect(data).toEqual({ name: 'Alice' })
  })

  test('throws on non-TOON/non-JSON response when fallback is throw', async () => {
    stubFetch('<h1>Not Found</h1>', 'text/html')

    await expect(toonFetch('/api/users', { fallback: 'throw' })).rejects.toThrow(
      'Unexpected Content-Type',
    )
  })

  test('preserves custom headers passed in init', async () => {
    const mock = stubFetch('{}', 'application/json')

    await toonFetch('/api/users', {
      headers: { Authorization: 'Bearer token123' },
    })

    const [, init] = mock.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer token123')
    expect(headers.get('Accept')).toBe(TOON_ACCEPT_HEADER)
  })

  test('createToonFetch prepends baseUrl to relative paths', async () => {
    const mock = stubFetch('{}', 'application/json')

    const api = createToonFetch({ baseUrl: 'https://api.example.com' })
    await api('/users')

    const [url] = mock.mock.calls[0]
    expect(url).toBe('https://api.example.com/users')
  })

  test('createToonFetch merges default headers with per-request headers', async () => {
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

  test('propagates network errors from fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(toonFetch('/api/users')).rejects.toThrow('Failed to fetch')
  })
})

describe('isToonResponse', () => {
  test('returns true for text/toon Content-Type with charset', () => {
    const res = mockResponse('', 'text/toon; charset=utf-8')
    expect(isToonResponse(res)).toBe(true)
  })

  test('returns true for bare text/toon Content-Type (no charset)', () => {
    const res = mockResponse('', 'text/toon')
    expect(isToonResponse(res)).toBe(true)
  })

  test('returns false for application/json Content-Type', () => {
    const res = mockResponse('', 'application/json')
    expect(isToonResponse(res)).toBe(false)
  })
})

describe('decodeToonResponse', () => {
  test('decodes a Response with TOON body', async () => {
    const toonBody = encode({ name: 'Alice', age: 30 })
    const res = mockResponse(toonBody, 'text/toon; charset=utf-8')

    const data = await decodeToonResponse<{ name: string; age: number }>(res)

    expect(data).toEqual({ name: 'Alice', age: 30 })
  })

  test('throws on malformed TOON body', async () => {
    const res = mockResponse('[2]{id,name}:\n  1,Alice', 'text/toon')

    await expect(decodeToonResponse(res)).rejects.toThrow('Expected 2 tabular rows, but got 1')
  })

  test('decodes values with special characters correctly', async () => {
    const original = [{ id: 1, note: 'hello, world', tag: 'key: val' }]
    const toonBody = encode(original)
    const res = mockResponse(toonBody, 'text/toon')

    const data = await decodeToonResponse(res)

    expect(data).toEqual(original)
  })
})
