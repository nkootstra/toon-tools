# @toon-tools/core

Shared content negotiation utilities for the toon-tools ecosystem.

## API

### `acceptsToon(header: string | null | undefined): boolean`

Returns `true` if the Accept header includes `text/toon` with quality > 0.

### `encodeToon(value: unknown, options?: ToonEncodeOptions): string`

Encodes a JSON-serializable value to TOON format.

### Constants

- `TOON_CONTENT_TYPE` — `"text/toon"`
- `TOON_CHARSET` — `"text/toon; charset=utf-8"`
- `TOON_ACCEPT_HEADER` — `"text/toon, application/json;q=0.9"`

## License

MIT
