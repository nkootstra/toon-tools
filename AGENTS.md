# toon-tools

Turborepo monorepo providing TOON content negotiation for server frameworks (Hono, Elysia) and client-side consumption (fetch wrapper, React hooks).

## Stack

TypeScript. Effect for typed errors and composable pipelines. pnpm workspaces. Turborepo for task orchestration. tsup for building (ESM + CJS dual output). Vitest + @effect/vitest for testing. oxlint for linting. oxfmt for formatting.

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

## Effect conventions

- Core, fetch, and react packages use Effect. Hono and elysia do NOT depend on Effect — they use synchronous functions from core.
- Every package exposes dual APIs: Effect-native (`encodeToon`, `toonFetchEffect`, `useToonQueryEffect`) and Promise-based wrappers (`encodeToonSync`, `toonFetch`, `useToonQuery`).
- Errors are tagged with `Data.TaggedError`: `ToonEncodeError`, `ToonDecodeError`, `ToonFetchError`. Use `Effect.catchTag` or `Effect.flip` in tests.
- Use `@effect/vitest` for Effect tests: `it.effect()` runs Effect programs, `Effect.flip` captures errors. Never use `Effect.runPromiseExit` with conditional expects.

## Conventions

- Media type is `text/toon` (provisional, per TOON SPEC §18.2). Content-Type for responses: `text/toon; charset=utf-8`.
- TOON is opt-in only. `Accept: */*` and `Accept: text/*` do NOT trigger conversion. Only explicit `text/toon` with quality > 0.
- `Accept: text/toon;q=0` explicitly rejects TOON — must fall through to JSON.
- Server middleware only converts `application/json` responses. Non-JSON (HTML, text, 204) passes through unchanged.
- Only objects and arrays are TOON-encoded. Primitive JSON responses pass through as JSON.
- `toonFetch` returns `Promise<T>` — designed to work as a TanStack Query `queryFn`, SWR `fetcher`, or standalone. No custom caching.
- `toonFetchEffect` returns `Effect<T, ToonFetchError | ToonDecodeError>` for Effect-native consumers.

## Testing

Run `pnpm run test` to verify all packages. Turbo handles build-before-test dependency.

Tests verify behavior through public interfaces:

- **Server packages**: real framework app instance, `app.request()` or `app.handle()`. No HTTP server.
- **Fetch package**: stub `fetch` globally via `vi.stubGlobal`. No network calls.
- **React package**: `renderHook` from `@testing-library/react` with `QueryClientProvider`. jsdom environment.

Mock only at system boundaries. Never mock `@toon-tools/core` internals from server/client tests.

When fixing bugs, write a failing test first that reproduces the bug, then fix it.

## Releasing

All packages share one version. Release via `VERSION=X.Y.Z pnpm run version:set`, commit, tag `vX.Y.Z`, push. The publish workflow verifies versions match the tag before publishing. Never publish manually — always use the tag-triggered workflow.

## Sub-areas

- `packages/core/AGENTS.md` — shared negotiation, encoding, constants
- `packages/hono/AGENTS.md` — Hono middleware
- `packages/elysia/AGENTS.md` — Elysia plugin
- `packages/fetch/AGENTS.md` — fetch wrapper and utilities
- `packages/react/AGENTS.md` — React hooks with TanStack Query
