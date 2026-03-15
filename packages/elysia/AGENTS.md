# @toon-tools/elysia

Elysia plugin for TOON content negotiation.

## How it works

The `toon()` function returns an Elysia plugin that registers a `mapResponse` hook with `{ as: 'global' }`. The hook checks:

1. Does the Accept header include `text/toon` with q > 0?
2. Is `responseValue` a non-null object?

If both: encodes the value as TOON and returns a new Response. Primitive values (strings, numbers, booleans) pass through as JSON — only objects/arrays are converted.

## Key difference from Hono

Elysia's `mapResponse` receives the raw `responseValue` (JS object), not a serialized JSON Response. This means:

- No need to parse JSON from the response body
- The `typeof responseValue === 'object'` guard is needed (Hono checks Content-Type instead)

## Testing

Tests create a real Elysia app and use `app.handle(new Request(...))` — no HTTP server.
