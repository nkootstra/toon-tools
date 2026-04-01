/**
 * @vitest-environment jsdom
 */

/**
 * Integration tests verifying toonFetch works correctly with
 * the framework data-fetching patterns documented in the README.
 *
 * These test the actual contracts:
 * - SWR: fetcher(key) signature
 * - TanStack Query: queryFn() returning Promise<T>
 * - Solid.js: createResource fetcher
 * - Vue: async setup / onMounted pattern
 */
import { describe, test, expect, vi, afterEach } from 'vitest'

// Import from built dist
import { toonFetch, createToonFetch } from '../../packages/fetch/dist/index.js'
import { toon as honoToon } from '../../packages/hono/dist/index.js'

// Hono app used as the "server" for all tests
import { Hono } from 'hono'

const testData = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' },
]

function createTestServer() {
  const app = new Hono()
  app.use(honoToon())
  app.get('/api/users', (c: any) => c.json(testData))
  return app
}

function stubFetchWithServer(app: any) {
  const mock = vi.fn<typeof fetch>(async (input, init?) => {
    return app.request(input, init)
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// SWR integration
// ---------------------------------------------------------------------------
describe('SWR integration', () => {
  test('toonFetch works as SWR fetcher (fetcher receives key as first arg)', async () => {
    const app = createTestServer()
    stubFetchWithServer(app)

    // SWR calls fetcher(key) — verify toonFetch accepts a URL string as first arg
    const swrFetcher = (url: string) => toonFetch<typeof testData>(url)
    const result = await swrFetcher('/api/users')

    expect(result).toEqual(testData)
  })

  // NOTE: SWR renderHook test removed — swr was dropped from devDependencies.
  // The contract test above verifies toonFetch works with SWR's fetcher(key) signature.
})

// ---------------------------------------------------------------------------
// TanStack Query direct (no @toon-tools/react wrapper)
// ---------------------------------------------------------------------------
describe('TanStack Query direct integration', () => {
  test('toonFetch works directly as useQuery queryFn', async () => {
    const app = createTestServer()
    stubFetchWithServer(app)

    const { renderHook, waitFor } = await import('@testing-library/react')
    const { QueryClient, QueryClientProvider, useQuery } = await import('@tanstack/react-query')
    const React = await import('react')

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['users-direct'],
          queryFn: () => toonFetch<typeof testData>('/api/users'),
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(testData)
  })

  test('createToonFetch instance works as useQuery queryFn', async () => {
    const app = createTestServer()
    stubFetchWithServer(app)

    const { renderHook, waitFor } = await import('@testing-library/react')
    const { QueryClient, QueryClientProvider, useQuery } = await import('@tanstack/react-query')
    const React = await import('react')

    const api = createToonFetch({ baseUrl: '' })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['users-factory'],
          queryFn: () => api<typeof testData>('/api/users'),
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(testData)
  })
})

// ---------------------------------------------------------------------------
// Solid.js integration
// ---------------------------------------------------------------------------
describe('Solid.js integration', () => {
  test('toonFetch works as createResource fetcher', async () => {
    const app = createTestServer()
    stubFetchWithServer(app)

    // Solid's createResource calls fetcher() which must return a Promise
    // We test the contract: fetcher returns Promise<T> that resolves correctly
    const fetcher = () => toonFetch<typeof testData>('/api/users')
    const result = await fetcher()

    expect(result).toEqual(testData)
  })

  test('toonFetch works with createResource source + fetcher pattern', async () => {
    const app = createTestServer()
    stubFetchWithServer(app)

    // Solid's createResource can take (source, fetcher) where fetcher receives the source value
    // Pattern: createResource(() => '/api/users', (url) => toonFetch(url))
    const source = '/api/users'
    const fetcher = (url: string) => toonFetch<typeof testData>(url)
    const result = await fetcher(source)

    expect(result).toEqual(testData)
  })
})

// ---------------------------------------------------------------------------
// Vue integration — removed (vue and @tanstack/vue-query dropped from devDependencies)
// The TanStack Query contract is covered by the React tests above.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Svelte integration
// ---------------------------------------------------------------------------
describe('Svelte integration', () => {
  test('toonFetch works as a Promise for {#await} blocks', async () => {
    const app = createTestServer()
    stubFetchWithServer(app)

    // Svelte's {#await promise} just needs a standard Promise
    const promise = toonFetch<typeof testData>('/api/users')

    // Verify it's a real Promise
    expect(promise).toBeInstanceOf(Promise)

    const result = await promise
    expect(result).toEqual(testData)
  })
})

// ---------------------------------------------------------------------------
// Cross-framework: JSON fallback
// ---------------------------------------------------------------------------
describe('JSON fallback across frameworks', () => {
  test('toonFetch falls back to JSON when server does not support TOON', async () => {
    // Server without TOON middleware — returns plain JSON
    const app = new Hono()
    app.get('/api/users', (c: any) => c.json(testData))
    stubFetchWithServer(app)

    const result = await toonFetch<typeof testData>('/api/users')
    expect(result).toEqual(testData)
  })
})
