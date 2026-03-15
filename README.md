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

## Packages

| Package                                 | Description                                     |
| --------------------------------------- | ----------------------------------------------- |
| [`@toon-tools/core`](packages/core)     | Shared content negotiation and encoding         |
| [`@toon-tools/hono`](packages/hono)     | Hono middleware                                 |
| [`@toon-tools/elysia`](packages/elysia) | Elysia plugin                                   |
| [`@toon-tools/fetch`](packages/fetch)   | Fetch wrapper (TanStack Query / SWR compatible) |
| [`@toon-tools/react`](packages/react)   | React hooks with TanStack Query                 |

## How It Works

**Server side**: Middleware checks the `Accept` header. If it includes `text/toon`, JSON responses are encoded as TOON before being sent. Otherwise, the response passes through as normal JSON.

**Client side**: The fetch wrapper sends `Accept: text/toon, application/json;q=0.9`, prefers TOON but falls back to JSON. The response is auto-decoded regardless of format.

## Server Setup

### Hono

```sh
npm install @toon-tools/hono
```

```typescript
import { Hono } from 'hono'
import { toon } from '@toon-tools/hono'

const app = new Hono()

// Apply globally
app.use(toon())

// With options
app.use(toon({ delimiter: '\t', keyFolding: 'safe' }))

app.get('/users', (c) => {
  return c.json([
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
  ])
})

export default app
```

A request with `Accept: text/toon` returns:

```
[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
```

A request with `Accept: application/json` returns normal JSON.

### Elysia

```sh
npm install @toon-tools/elysia
```

```typescript
import { Elysia } from 'elysia'
import { toon } from '@toon-tools/elysia'

const app = new Elysia()
  .use(toon())
  .get('/users', () => [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
  ])
  .listen(3000)
```

### Options

Both `@toon-tools/hono` and `@toon-tools/elysia` accept the same options:

| Option       | Type                      | Default | Description                                  |
| ------------ | ------------------------- | ------- | -------------------------------------------- |
| `delimiter`  | `','` \| `'\t'` \| `'\|'` | `','`   | Delimiter for tabular rows                   |
| `keyFolding` | `'off'` \| `'safe'`       | `'off'` | Collapse single-key chains into dotted paths |

## Client Setup

### Plain JavaScript / TypeScript

```sh
npm install @toon-tools/fetch
```

```typescript
import { toonFetch } from '@toon-tools/fetch'

// Standalone usage
const users = await toonFetch<User[]>('/api/users')

// With custom headers
const users = await toonFetch<User[]>('/api/users', {
  headers: { Authorization: 'Bearer token' },
})

// Configured instance
import { createToonFetch } from '@toon-tools/fetch'

const api = createToonFetch({
  baseUrl: 'https://api.example.com',
  headers: { Authorization: 'Bearer token' },
})

const users = await api<User[]>('/users')
```

`toonFetch` returns a `Promise<T>`, making it compatible with any data-fetching library.

### React (TanStack Query)

```sh
npm install @toon-tools/react @toon-tools/fetch @tanstack/react-query
```

#### Option A: Use `toonFetch` directly as a queryFn

```tsx
import { useQuery } from '@tanstack/react-query'
import { toonFetch } from '@toon-tools/fetch'

function UserList() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => toonFetch<User[]>('/api/users'),
  })

  if (isLoading) return <p>Loading...</p>

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

#### Option B: Use the `useToonQuery` convenience hook

```tsx
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ToonProvider, useToonQuery } from '@toon-tools/react'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToonProvider baseUrl="/api" headers={{ Authorization: `Bearer ${token}` }}>
        <UserList />
      </ToonProvider>
    </QueryClientProvider>
  )
}

function UserList() {
  const { data, isLoading } = useToonQuery<User[]>({
    queryKey: ['users'],
    url: '/users',
  })

  if (isLoading) return <p>Loading...</p>

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

`useToonQuery` passes through all TanStack Query options (`enabled`, `staleTime`, `refetchInterval`, etc.).

### SWR

```sh
npm install @toon-tools/fetch swr
```

```tsx
import useSWR from 'swr'
import { toonFetch } from '@toon-tools/fetch'

function UserList() {
  const { data, isLoading } = useSWR('/api/users', (url) => toonFetch<User[]>(url))

  if (isLoading) return <p>Loading...</p>

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### Solid.js

```sh
npm install @toon-tools/fetch
```

```tsx
import { createResource } from 'solid-js'
import { toonFetch } from '@toon-tools/fetch'

function UserList() {
  const [users] = createResource(() => toonFetch<User[]>('/api/users'))

  return (
    <ul>
      <For each={users()}>{(user) => <li>{user.name}</li>}</For>
    </ul>
  )
}
```

### Svelte

```sh
npm install @toon-tools/fetch
```

```svelte
<script>
  import { toonFetch } from '@toon-tools/fetch'

  const users = toonFetch('/api/users')
</script>

{#await users}
  <p>Loading...</p>
{:then data}
  <ul>
    {#each data as user}
      <li>{user.name}</li>
    {/each}
  </ul>
{/await}
```

### Vue

```sh
npm install @toon-tools/fetch
```

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { toonFetch } from '@toon-tools/fetch'

const users = ref([])
const loading = ref(true)

onMounted(async () => {
  users.value = await toonFetch('/api/users')
  loading.value = false
})
</script>

<template>
  <p v-if="loading">Loading...</p>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

### Vue with TanStack Query

```sh
npm install @toon-tools/fetch @tanstack/vue-query
```

```vue
<script setup>
import { useQuery } from '@tanstack/vue-query'
import { toonFetch } from '@toon-tools/fetch'

const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => toonFetch('/api/users'),
})
</script>

<template>
  <p v-if="isLoading">Loading...</p>
  <ul v-else>
    <li v-for="user in data" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

### Angular

```sh
npm install @toon-tools/fetch
```

```typescript
import { Component, signal } from '@angular/core'
import { toonFetch } from '@toon-tools/fetch'

@Component({
  selector: 'app-user-list',
  template: `
    @if (loading()) {
      <p>Loading...</p>
    } @else {
      <ul>
        @for (user of users(); track user.id) {
          <li>{{ user.name }}</li>
        }
      </ul>
    }
  `,
})
export class UserListComponent {
  users = signal<User[]>([])
  loading = signal(true)

  async ngOnInit() {
    this.users.set(await toonFetch<User[]>('/api/users'))
    this.loading.set(false)
  }
}
```

## Effect-Native API

All packages expose Effect-native versions with typed error channels. Errors are tagged with `Data.TaggedError` for `catchTag`-based handling.

### Effect with TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query'
import { Effect } from 'effect'
import { toonFetchEffect } from '@toon-tools/fetch'

const { data } = useQuery({
  queryKey: ['users'],
  queryFn: () => Effect.runPromise(toonFetchEffect<User[]>('/api/users')),
})
```

### Effect-native fetch

```typescript
import { Effect } from 'effect'
import { toonFetchEffect, type ToonFetchError } from '@toon-tools/fetch'
import type { ToonDecodeError } from '@toon-tools/core'

const program: Effect.Effect<User[], ToonFetchError | ToonDecodeError> =
  toonFetchEffect<User[]>('/api/users')

// Handle specific error types
const handled = program.pipe(
  Effect.catchTag('ToonFetchError', (e) => {
    console.error(`Fetch failed: ${e.reason}`, e.contentType)
    return Effect.succeed([])
  }),
  Effect.catchTag('ToonDecodeError', (e) => {
    console.error('Invalid TOON:', e.input)
    return Effect.succeed([])
  }),
)

const users = await Effect.runPromise(handled)
```

### Effect React hooks

```tsx
import { useToonQueryEffect } from '@toon-tools/react'

function UserList() {
  // Error type is ToonFetchError | ToonDecodeError (not generic Error)
  const { data, error } = useToonQueryEffect<User[]>({
    queryKey: ['users'],
    url: '/api/users',
  })

  if (error) {
    // error._tag is 'ToonFetchError' | 'ToonDecodeError'
  }
}
```

## Lower-Level Utilities

```typescript
import {
  isToonResponse,
  decodeToonResponse,
  TOON_ACCEPT_HEADER,
  TOON_CONTENT_TYPE,
} from '@toon-tools/fetch'

// Manual fetch with TOON content negotiation
const res = await fetch('/api/users', {
  headers: { Accept: TOON_ACCEPT_HEADER },
})

if (isToonResponse(res)) {
  const data = await decodeToonResponse<User[]>(res)
}
```

## Content Negotiation Behavior

- Clients send `Accept: text/toon, application/json;q=0.9`
- Server checks the `Accept` header for `text/toon`
- If present (with quality > 0), JSON responses are re-encoded as TOON
- `Accept: text/toon;q=0` explicitly rejects TOON
- `Accept: */*` and `Accept: text/*` do **not** trigger TOON (opt-in only)
- Non-JSON responses (HTML, text, etc.) pass through unchanged
- Response `Content-Type` is set to `text/toon; charset=utf-8`

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
