# toon-tools

Server and client libraries for [TOON](https://toonformat.dev) content negotiation. Serve TOON from Hono or Elysia, consume it from React, Solid, Svelte, Vue, Angular, or plain fetch.

TOON uses ~40% fewer tokens than JSON while maintaining lossless round-trips. These tools add TOON support to your API with one line of middleware and auto-decode it on the client.

## Quick Start

**Server** (pick one):

```sh
npm install @toon-tools/hono    # Hono middleware
npm install @toon-tools/elysia  # Elysia plugin
```

**Client**:

```sh
npm install @toon-tools/fetch   # Works with any framework
npm install @toon-tools/react   # React + TanStack Query hooks
```

See [docs/README.md](docs/README.md) for full documentation with examples for every framework.

## Packages

| Package                                 | Description                                     |
| --------------------------------------- | ----------------------------------------------- |
| [`@toon-tools/core`](packages/core)     | Shared content negotiation and encoding         |
| [`@toon-tools/hono`](packages/hono)     | Hono middleware                                 |
| [`@toon-tools/elysia`](packages/elysia) | Elysia plugin                                   |
| [`@toon-tools/fetch`](packages/fetch)   | Fetch wrapper (TanStack Query / SWR compatible) |
| [`@toon-tools/react`](packages/react)   | React hooks with TanStack Query                 |

## Development

```sh
pnpm install          # Install dependencies
pnpm run build        # Build all packages
pnpm run test         # Run all tests
pnpm run lint         # Lint with oxlint
pnpm run format:check # Check formatting with oxfmt
pnpm run format       # Apply formatting with oxfmt
```

## License

MIT
