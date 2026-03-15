# @toon-tools/elysia

Elysia plugin for TOON content negotiation. Automatically encodes object responses as TOON when clients send `Accept: text/toon`.

## Install

```sh
npm install @toon-tools/elysia
```

## Usage

```typescript
import { Elysia } from 'elysia'
import { toon } from '@toon-tools/elysia'

const app = new Elysia()
  .use(toon())
  .get('/users', () => [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ])
  .listen(3000)
```

## Options

```typescript
.use(toon({
  delimiter: '\t',      // ',' | '\t' | '|'
  keyFolding: 'safe',   // 'off' | 'safe'
}))
```

## License

MIT
