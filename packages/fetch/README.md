# @toon-tools/fetch

Framework-agnostic TOON fetch wrapper. Works as a TanStack Query `queryFn`, SWR `fetcher`, or standalone.

## Install

```sh
npm install @toon-tools/fetch
```

## Usage

```typescript
import { toonFetch } from '@toon-tools/fetch'

const users = await toonFetch<User[]>('/api/users')
```

### TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query'
import { toonFetch } from '@toon-tools/fetch'

const { data } = useQuery({
  queryKey: ['users'],
  queryFn: () => toonFetch<User[]>('/api/users'),
})
```

### SWR

```typescript
import useSWR from 'swr'
import { toonFetch } from '@toon-tools/fetch'

const { data } = useSWR('/api/users', (url) => toonFetch<User[]>(url))
```

### Configured instance

```typescript
import { createToonFetch } from '@toon-tools/fetch'

const api = createToonFetch({
  baseUrl: 'https://api.example.com',
  headers: { Authorization: 'Bearer token' },
})

const users = await api<User[]>('/users')
```

### Utilities

```typescript
import { isToonResponse, decodeToonResponse, TOON_ACCEPT_HEADER } from '@toon-tools/fetch'

const res = await fetch('/api/users', {
  headers: { Accept: TOON_ACCEPT_HEADER },
})

if (isToonResponse(res)) {
  const data = await decodeToonResponse<User[]>(res)
}
```

## License

MIT
