# @toon-tools/hono

Hono middleware for TOON content negotiation.

## How it works

The `toon()` middleware runs after `await next()`. It checks:

1. Does the Accept header include `text/toon` with q > 0? (via `acceptsToon` from core)
2. Is the response Content-Type `application/json`?

If both: reads the JSON body, encodes it as TOON via `encodeToonSync`, replaces `c.res` with a new Response.

This package does NOT depend on Effect — it uses the synchronous functions from core.

## Testing

Tests create a real Hono app, attach the middleware, and use `app.request()` — no HTTP server. Assertions check response body content and headers.

`@toon-format/toon` is a devDependency (for `decode()` in round-trip tests), not a production dependency. Production encoding comes through `@toon-tools/core`.
