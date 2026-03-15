# @toon-tools/core

Shared TOON content negotiation logic consumed by all other packages.

## Structure

- `src/constants.ts` — `TOON_CONTENT_TYPE`, `TOON_CHARSET`, `TOON_ACCEPT_HEADER`
- `src/negotiate.ts` — `acceptsToon()` — Accept header parsing with quality value support
- `src/encode.ts` — `encodeToon()` — thin wrapper over `@toon-format/toon`'s `encode()`

## Invariants

- `acceptsToon` accepts `string | null | undefined` to work with both Hono (`string | undefined`) and Elysia (`string | null`) header accessors. Do not narrow this union.
- `acceptsToon` must reject `q=0` — this means the client explicitly does not want TOON.
- `acceptsToon` must reject wildcard types (`*/*`, `text/*`) — TOON is opt-in only.
- Changes here affect all downstream packages. Run `pnpm run test` from root after any modification.

## Testing

Tests cover `acceptsToon` edge cases (quality values, wildcards, missing headers) and `encodeToon` round-trips via `decode()`. Tests import `decode` from `@toon-format/toon` directly.
