import { describe, test, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { encode } from '@toon-format/toon'
import { ToonProvider, useToonQuery, useToonContext } from '../src/index.js'

afterEach(() => {
  vi.restoreAllMocks()
})

function createWrapper(providerProps?: {
  baseUrl?: string
  headers?: HeadersInit
  fallback?: 'json' | 'throw'
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      providerProps ? createElement(ToonProvider, providerProps, children) : children,
    )
  }
}

function stubFetch(body: string, contentType: string) {
  const mock = vi.fn().mockResolvedValue(
    new Response(body, {
      headers: { 'Content-Type': contentType },
    }),
  )
  vi.stubGlobal('fetch', mock)
  return mock
}

describe('ToonProvider', () => {
  test('provides config to child components via context', () => {
    const { result } = renderHook(() => useToonContext(), {
      wrapper: createWrapper({
        baseUrl: 'https://api.example.com',
        headers: { Authorization: 'Bearer token' },
      }),
    })

    expect(result.current.baseUrl).toBe('https://api.example.com')
  })
})

describe('useToonQuery', () => {
  test('fetches and decodes TOON data', async () => {
    const toonBody = encode([{ id: 1, name: 'Alice' }])
    stubFetch(toonBody, 'text/toon; charset=utf-8')

    const { result } = renderHook(
      () =>
        useToonQuery<Array<{ id: number; name: string }>>({
          queryKey: ['users'],
          url: '/api/users',
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 1, name: 'Alice' }])
  })

  test('prepends ToonProvider baseUrl to url', async () => {
    const mock = stubFetch(JSON.stringify({ ok: true }), 'application/json')

    const { result } = renderHook(
      () =>
        useToonQuery({
          queryKey: ['data'],
          url: '/data',
        }),
      { wrapper: createWrapper({ baseUrl: 'https://api.example.com' }) },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [calledUrl] = mock.mock.calls[0]
    expect(calledUrl).toBe('https://api.example.com/data')
  })

  test('merges ToonProvider headers with per-request headers', async () => {
    const mock = stubFetch(JSON.stringify({ ok: true }), 'application/json')

    const { result } = renderHook(
      () =>
        useToonQuery({
          queryKey: ['data'],
          url: '/data',
          init: { headers: { 'X-Custom': 'value' } },
        }),
      {
        wrapper: createWrapper({
          headers: { Authorization: 'Bearer ctx-token' },
        }),
      },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [, init] = mock.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer ctx-token')
    expect(headers.get('X-Custom')).toBe('value')
  })

  test('passes through useQuery options (enabled, staleTime)', async () => {
    stubFetch(JSON.stringify({ ok: true }), 'application/json')

    const { result } = renderHook(
      () =>
        useToonQuery({
          queryKey: ['disabled'],
          url: '/data',
          enabled: false,
        }),
      { wrapper: createWrapper() },
    )

    // Query should not fire because enabled is false
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
  })

  test('works without ToonProvider (uses defaults)', async () => {
    const toonBody = encode({ name: 'Bob' })
    stubFetch(toonBody, 'text/toon; charset=utf-8')

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(
      () =>
        useToonQuery<{ name: string }>({
          queryKey: ['user'],
          url: '/user',
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ name: 'Bob' })
  })
})
