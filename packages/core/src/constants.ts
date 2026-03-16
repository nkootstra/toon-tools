/** The provisional TOON media type per SPEC §18.2 */
export const TOON_CONTENT_TYPE = 'text/toon'

/** The full Content-Type header value for TOON responses */
export const TOON_CONTENT_TYPE_HEADER = 'text/toon; charset=utf-8'

/** @deprecated Renamed to `TOON_CONTENT_TYPE_HEADER` — this name was misleading */
export const TOON_CHARSET = TOON_CONTENT_TYPE_HEADER

/** Accept header that prefers TOON with JSON fallback */
export const TOON_ACCEPT_HEADER = 'text/toon, application/json;q=0.9'
