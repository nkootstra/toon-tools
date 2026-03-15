# toon-tools

Turborepo monorepo providing TOON content negotiation for server frameworks (Hono, Elysia) and client-side consumption (fetch wrapper, React hooks).

## Stack

TypeScript. pnpm workspaces. Turborepo for task orchestration. tsup for building (ESM + CJS dual output). Vitest for testing. oxlint for linting. oxfmt for formatting.

## Dependency graph

```
@toon-format/toon (external)
       |
  @toon-tools/core ← shared negotiation logic, constants, encoding
       |
  +----+----+----------+
  |         |          |
  hono    elysia     fetch ← re-exports core constants
                       |
                     react
```

All shared logic (content negotiation, encoding, constants) lives in `@toon-tools/core`. Server packages (hono, elysia) and fetch depend on core. React depends on fetch.

## Conventions

- Media type is `text/toon` (provisional, per TOON SPEC §18.2). Content-Type for responses: `text/toon; charset=utf-8`.
- TOON is opt-in only. `Accept: */*` and `Accept: text/*` do NOT trigger conversion. Only explicit `text/toon` with quality > 0.
- `Accept: text/toon;q=0` explicitly rejects TOON — must fall through to JSON.
- Server middleware only converts `application/json` responses. Non-JSON (HTML, text, 204) passes through unchanged.
- Only objects and arrays are TOON-encoded. Primitive JSON responses pass through as JSON.
- `toonFetch` returns `Promise<T>` — designed to work as a TanStack Query `queryFn`, SWR `fetcher`, or standalone. No custom caching.

## Testing

Run `pnpm run test` to verify all packages. Turbo handles build-before-test dependency.

Tests verify behavior through public interfaces:

- **Server packages**: real framework app instance, `app.request()` or `app.handle()`. No HTTP server.
- **Fetch package**: stub `fetch` globally via `vi.stubGlobal`. No network calls.
- **React package**: `renderHook` from `@testing-library/react` with `QueryClientProvider`. jsdom environment.

Mock only at system boundaries. Never mock `@toon-tools/core` internals from server/client tests.

When fixing bugs, write a failing test first that reproduces the bug, then fix it.

## Sub-areas

- `packages/core/AGENTS.md` — shared negotiation, encoding, constants
- `packages/hono/AGENTS.md` — Hono middleware
- `packages/elysia/AGENTS.md` — Elysia plugin
- `packages/fetch/AGENTS.md` — fetch wrapper and utilities
- `packages/react/AGENTS.md` — React hooks with TanStack Query
