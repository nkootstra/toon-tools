import { describe, test, expect } from 'vitest'
import { Elysia } from 'elysia'
import { toon } from '../src/index.js'

function req(path: string, headers?: Record<string, string>, method = 'GET') {
  return new Request(`http://localhost${path}`, { method, headers })
}

describe('toon plugin', () => {
  test('passes through response when Accept does not include text/toon', async () => {
    const app = new Elysia().use(toon()).get('/users', () => [{ id: 1, name: 'Alice' }])

    const res = await app.handle(req('/users', { Accept: 'application/json' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([{ id: 1, name: 'Alice' }])
  })

  test('converts object response to TOON when Accept: text/toon', async () => {
    const app = new Elysia().use(toon()).get('/users', () => [{ id: 1, name: 'Alice' }])

    const res = await app.handle(req('/users', { Accept: 'text/toon' }))

    const body = await res.text()
    expect(body).toContain('[1]{id,name}')
    expect(body).toContain('1,Alice')
  })

  test('sets Content-Type to text/toon; charset=utf-8 on TOON response', async () => {
    const app = new Elysia().use(toon()).get('/data', () => ({ hello: 'world' }))

    const res = await app.handle(req('/data', { Accept: 'text/toon' }))

    expect(res.headers.get('Content-Type')).toBe('text/toon; charset=utf-8')
  })

  test('passes through non-object responses unchanged', async () => {
    const app = new Elysia().use(toon()).get('/text', () => 'plain text')

    const res = await app.handle(req('/text', { Accept: 'text/toon' }))

    const body = await res.text()
    expect(body).toBe('plain text')
  })

  test('applies delimiter option to TOON encoding', async () => {
    const app = new Elysia()
      .use(toon({ delimiter: '\t' }))
      .get('/users', () => [{ id: 1, name: 'Alice' }])

    const res = await app.handle(req('/users', { Accept: 'text/toon' }))

    const body = await res.text()
    expect(body).toContain('1\tAlice')
  })

  test('applies keyFolding option to TOON encoding', async () => {
    const app = new Elysia()
      .use(toon({ keyFolding: 'safe' }))
      .get('/data', () => ({ data: { metadata: { items: ['a', 'b'] } } }))

    const res = await app.handle(req('/data', { Accept: 'text/toon' }))

    const body = await res.text()
    expect(body).toContain('data.metadata.items[2]')
  })

  test('preserves response status code when converting to TOON', async () => {
    const app = new Elysia().use(toon()).post('/users', ({ set }) => {
      set.status = 201
      return { id: 1, name: 'Alice' }
    })

    const res = await app.handle(req('/users', { Accept: 'text/toon' }, 'POST'))

    expect(res.status).toBe(201)
    const body = await res.text()
    expect(body).toContain('id: 1')
  })

  test('does not convert when Accept: text/toon;q=0', async () => {
    const app = new Elysia().use(toon()).get('/users', () => [{ id: 1, name: 'Alice' }])

    const res = await app.handle(req('/users', { Accept: 'text/toon;q=0, application/json;q=1' }))

    const body = await res.json()
    expect(body).toEqual([{ id: 1, name: 'Alice' }])
  })

  test('passes through when Accept header is missing', async () => {
    const app = new Elysia().use(toon()).get('/users', () => [{ id: 1 }])

    const res = await app.handle(req('/users'))

    const body = await res.json()
    expect(body).toEqual([{ id: 1 }])
  })

  test('matches Accept: text/toon; charset=utf-8', async () => {
    const app = new Elysia().use(toon()).get('/users', () => [{ id: 1, name: 'Alice' }])

    const res = await app.handle(req('/users', { Accept: 'text/toon; charset=utf-8' }))

    const body = await res.text()
    expect(body).toContain('[1]{id,name}')
  })

  test('does not trigger TOON for Accept: */*', async () => {
    const app = new Elysia().use(toon()).get('/users', () => [{ id: 1 }])

    const res = await app.handle(req('/users', { Accept: '*/*' }))

    const body = await res.json()
    expect(body).toEqual([{ id: 1 }])
  })

  test('does not trigger TOON for Accept: text/*', async () => {
    const app = new Elysia().use(toon()).get('/users', () => [{ id: 1 }])

    const res = await app.handle(req('/users', { Accept: 'text/*' }))

    const body = await res.json()
    expect(body).toEqual([{ id: 1 }])
  })
})
