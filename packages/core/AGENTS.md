# @toon-tools/core

Shared TOON content negotiation logic consumed by all other packages.

## Structure

- `src/constants.ts` — `TOON_CONTENT_TYPE`, `TOON_CHARSET`, `TOON_ACCEPT_HEADER`
- `src/negotiate.ts` — `acceptsToon()` — Accept header parsing with quality value support
- `src/encode.ts` — `encodeToon()` (Effect) and `encodeToonSync()` (plain) — wrappers over `@toon-format/toon`'s `encode()`
- `src/decode.ts` — `decodeToon()` (Effect) — wraps `@toon-format/toon`'s `decode()`
- `src/errors.ts` — `ToonEncodeError`, `ToonDecodeError` — tagged errors via `Data.TaggedError`

## Invariants

- `acceptsToon` accepts `string | null | undefined` to work with both Hono (`string | undefined`) and Elysia (`string | null`) header accessors. Do not narrow this union.
- `acceptsToon` must reject `q=0` — this means the client explicitly does not want TOON.
- `acceptsToon` must reject wildcard types (`*/*`, `text/*`) — TOON is opt-in only.
- `acceptsToon` is a plain function (not Effect) — used by server adapters that don't depend on Effect.
- Hono and Elysia use `encodeToonSync`. Only Effect-native consumers use `encodeToon`.
- Changes here affect all downstream packages. Run `pnpm run test` from root after any modification.

## Testing

Uses `@effect/vitest` with `it.effect()` for Effect tests. `Effect.flip` captures expected failures. Tests import `decode` from `@toon-format/toon` directly for round-trip assertions.
