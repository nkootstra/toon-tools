# @toon-tools/hono

Hono middleware for TOON content negotiation. Automatically encodes JSON responses as TOON when clients send `Accept: text/toon`.

## Install

```sh
npm install @toon-tools/hono
```

## Usage

```typescript
import { Hono } from 'hono'
import { toon } from '@toon-tools/hono'

const app = new Hono()
app.use(toon())

app.get('/users', (c) => {
  return c.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ])
})
```

## Options

```typescript
app.use(
  toon({
    delimiter: '\t', // ',' | '\t' | '|'
    keyFolding: 'safe', // 'off' | 'safe'
  }),
)
```

## License

MIT
