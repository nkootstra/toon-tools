# @toon-tools/react

React hooks for TOON data fetching, built on TanStack Query and `@toon-tools/fetch`.

## Design decisions

- `useToonQuery` is a thin wrapper around `useQuery` that injects `toonFetch` as the `queryFn`. All `UseQueryOptions` except `queryFn` are passed through.
- `ToonProvider` is optional. Without it, `useToonQuery` uses `toonFetch` directly. With it, it creates a configured `createToonFetch` instance with the provider's `baseUrl`/`headers`.
- The recommended path for most users is `toonFetch` directly as a `queryFn` — `@toon-tools/react` is convenience, not a requirement.

## Testing

Uses `@testing-library/react` with `renderHook`. jsdom environment configured in `vitest.config.ts`. Tests wrap hooks in `QueryClientProvider` (required by TanStack Query). Global `fetch` is stubbed to return TOON or JSON responses.

`@toon-format/toon` is a devDependency for `encode()` in test fixtures.
