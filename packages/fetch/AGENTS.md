# @toon-tools/fetch

Framework-agnostic fetch wrapper for TOON content negotiation. Designed as a composable primitive that plugs into TanStack Query, SWR, or any data-fetching library.

## Design decisions

- Dual API: `toonFetchEffect` (Effect-native, typed errors) and `toonFetch` (Promise wrapper via `Effect.runPromise`).
- `toonFetch` returns `Promise<T>` — this is what makes it work as a TanStack Query `queryFn` or SWR `fetcher`. Do not add caching, state management, or retry logic.
- `toonFetchEffect` returns `Effect<T, ToonFetchError | ToonDecodeError>` — typed error channel for Effect consumers.
- `ToonFetchError` has `reason: 'Network' | 'UnexpectedContentType'` to distinguish failure modes.
- Accept header is `text/toon, application/json;q=0.9` — prefers TOON but degrades gracefully.
- If the server returns JSON instead of TOON, both variants fall back to JSON decoding.
- Re-exports `TOON_CONTENT_TYPE` and `TOON_ACCEPT_HEADER` from `@toon-tools/core` for convenience.

## Testing

Uses `@effect/vitest` with `it.effect()` for Effect-native tests. Promise-based tests use standard vitest. Both stub `fetch` globally via `vi.stubGlobal('fetch', vi.fn())`. Never make real network calls.
