# @toon-tools/react

React hooks for TOON data fetching with TanStack Query.

## Install

```sh
npm install @toon-tools/react @toon-tools/fetch @tanstack/react-query
```

## Usage

```tsx
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ToonProvider, useToonQuery } from '@toon-tools/react'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToonProvider baseUrl="/api">
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

`useToonQuery` passes through all TanStack Query options.

## License

MIT
