# @toon-tools/fetch

Framework-agnostic fetch wrapper for TOON content negotiation. Designed as a composable primitive that plugs into TanStack Query, SWR, or any data-fetching library.

## Design decisions

- `toonFetch` returns `Promise<T>` — this is what makes it work as a TanStack Query `queryFn` or SWR `fetcher`. Do not add caching, state management, or retry logic.
- Accept header is `text/toon, application/json;q=0.9` — prefers TOON but degrades gracefully.
- If the server returns JSON instead of TOON, `toonFetch` falls back to `response.json()`. This means it works even against servers that don't support TOON.
- Re-exports `TOON_CONTENT_TYPE` and `TOON_ACCEPT_HEADER` from `@toon-tools/core` for convenience.

## Testing

Tests stub `fetch` globally via `vi.stubGlobal('fetch', vi.fn())` with controlled Response objects. Never make real network calls.
