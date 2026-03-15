import { describe, test, expect } from 'vitest'
import { Hono } from 'hono'
import { decode } from '@toon-format/toon'
import { toon } from '../src/index.js'

describe('toon middleware', () => {
  test('passes through response when Accept does not include text/toon', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/users', (c) => c.json([{ id: 1, name: 'Alice' }]))

    const res = await app.request('/users', {
      headers: { Accept: 'application/json' },
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    const body = await res.json()
    expect(body).toEqual([{ id: 1, name: 'Alice' }])
  })

  test('converts JSON response to TOON when Accept: text/toon', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/users', (c) => c.json([{ id: 1, name: 'Alice' }]))

    const res = await app.request('/users', {
      headers: { Accept: 'text/toon' },
    })

    const body = await res.text()
    expect(body).toContain('[1]{id,name}')
    expect(body).toContain('1,Alice')
  })

  test('sets Content-Type to text/toon; charset=utf-8 on TOON response', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/data', (c) => c.json({ hello: 'world' }))

    const res = await app.request('/data', {
      headers: { Accept: 'text/toon' },
    })

    expect(res.headers.get('Content-Type')).toBe('text/toon; charset=utf-8')
  })

  test('passes through non-JSON responses unchanged', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/page', (c) => c.html('<h1>Hello</h1>'))

    const res = await app.request('/page', {
      headers: { Accept: 'text/toon' },
    })

    expect(res.headers.get('Content-Type')).toContain('text/html')
    const body = await res.text()
    expect(body).toBe('<h1>Hello</h1>')
  })

  test('applies delimiter option to TOON encoding', async () => {
    const app = new Hono()
    app.use(toon({ delimiter: '\t' }))
    app.get('/users', (c) => c.json([{ id: 1, name: 'Alice' }]))

    const res = await app.request('/users', {
      headers: { Accept: 'text/toon' },
    })

    const body = await res.text()
    expect(body).toContain('1\tAlice')
  })

  test('applies keyFolding option to TOON encoding', async () => {
    const app = new Hono()
    app.use(toon({ keyFolding: 'safe' }))
    app.get('/data', (c) => c.json({ data: { metadata: { items: ['a', 'b'] } } }))

    const res = await app.request('/data', {
      headers: { Accept: 'text/toon' },
    })

    const body = await res.text()
    expect(body).toContain('data.metadata.items[2]')
  })

  test('handles Accept header with quality values', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/users', (c) => c.json([{ id: 1, name: 'Alice' }]))

    const res = await app.request('/users', {
      headers: { Accept: 'text/toon;q=1, application/json;q=0.9' },
    })

    const body = await res.text()
    expect(body).toContain('[1]{id,name}')
  })

  test('preserves response status code when converting to TOON', async () => {
    const app = new Hono()
    app.use(toon())
    app.post('/users', (c) => {
      return c.json({ id: 1, name: 'Alice' }, 201)
    })

    const res = await app.request('/users', {
      method: 'POST',
      headers: { Accept: 'text/toon' },
    })

    expect(res.status).toBe(201)
    const body = await res.text()
    expect(body).toContain('id: 1')
  })

  test('preserves existing response headers when converting to TOON', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/data', (c) => {
      return c.json({ ok: true }, 200, {
        'X-Request-Id': 'abc-123',
        'Cache-Control': 'max-age=3600',
      })
    })

    const res = await app.request('/data', {
      headers: { Accept: 'text/toon' },
    })

    expect(res.headers.get('Content-Type')).toBe('text/toon; charset=utf-8')
    expect(res.headers.get('X-Request-Id')).toBe('abc-123')
    expect(res.headers.get('Cache-Control')).toBe('max-age=3600')
  })

  test('does not convert when Accept: text/toon;q=0', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/users', (c) => c.json([{ id: 1, name: 'Alice' }]))

    const res = await app.request('/users', {
      headers: { Accept: 'text/toon;q=0, application/json;q=1' },
    })

    expect(res.headers.get('Content-Type')).toContain('application/json')
    const body = await res.json()
    expect(body).toEqual([{ id: 1, name: 'Alice' }])
  })

  test('passes through when Accept header is missing', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/users', (c) => c.json([{ id: 1 }]))

    const res = await app.request('/users')

    expect(res.headers.get('Content-Type')).toContain('application/json')
  })

  test('matches Accept: text/toon; charset=utf-8', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/users', (c) => c.json([{ id: 1, name: 'Alice' }]))

    const res = await app.request('/users', {
      headers: { Accept: 'text/toon; charset=utf-8' },
    })

    const body = await res.text()
    expect(body).toContain('[1]{id,name}')
  })

  test('does not trigger TOON for Accept: */*', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/users', (c) => c.json([{ id: 1 }]))

    const res = await app.request('/users', {
      headers: { Accept: '*/*' },
    })

    expect(res.headers.get('Content-Type')).toContain('application/json')
  })

  test('does not trigger TOON for Accept: text/*', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/users', (c) => c.json([{ id: 1 }]))

    const res = await app.request('/users', {
      headers: { Accept: 'text/*' },
    })

    expect(res.headers.get('Content-Type')).toContain('application/json')
  })

  test('passes through 204 no-body response unchanged', async () => {
    const app = new Hono()
    app.use(toon())
    app.delete('/users/1', (c) => {
      return c.body(null, 204)
    })

    const res = await app.request('/users/1', {
      method: 'DELETE',
      headers: { Accept: 'text/toon' },
    })

    expect(res.status).toBe(204)
  })

  test('correctly encodes values with special characters', async () => {
    const app = new Hono()
    app.use(toon())
    app.get('/data', (c) => c.json([{ id: 1, name: 'Alice, Bob', note: 'key: value' }]))

    const res = await app.request('/data', {
      headers: { Accept: 'text/toon' },
    })

    const body = await res.text()
    const parsed = decode(body)
    expect(parsed).toEqual([{ id: 1, name: 'Alice, Bob', note: 'key: value' }])
  })
})
