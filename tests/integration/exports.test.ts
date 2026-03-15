/**
 * Verifies that each package's package.json "exports" field
 * points to files that actually exist in dist/.
 */
import { describe, test, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../..')

const packages = ['core', 'hono', 'elysia', 'fetch', 'react']

describe('package.json exports field verification', () => {
  for (const pkg of packages) {
    describe(`@toon-tools/${pkg}`, () => {
      const pkgDir = resolve(root, 'packages', pkg)
      const pkgJson = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf-8'))

      test('has exports field', () => {
        expect(pkgJson.exports).toBeDefined()
        expect(pkgJson.exports['.']).toBeDefined()
      })

      test('ESM entry file exists', () => {
        const esmPath = pkgJson.exports['.'].import.default
        const fullPath = resolve(pkgDir, esmPath)
        expect(existsSync(fullPath)).toBe(true)
      })

      test('ESM types file exists', () => {
        const typesPath = pkgJson.exports['.'].import.types
        const fullPath = resolve(pkgDir, typesPath)
        expect(existsSync(fullPath)).toBe(true)
      })

      test('CJS entry file exists', () => {
        const cjsPath = pkgJson.exports['.'].require.default
        const fullPath = resolve(pkgDir, cjsPath)
        expect(existsSync(fullPath)).toBe(true)
      })

      test('CJS types file exists', () => {
        const typesPath = pkgJson.exports['.'].require.types
        const fullPath = resolve(pkgDir, typesPath)
        expect(existsSync(fullPath)).toBe(true)
      })

      test('main field points to existing file', () => {
        const fullPath = resolve(pkgDir, pkgJson.main)
        expect(existsSync(fullPath)).toBe(true)
      })

      test('module field points to existing file', () => {
        const fullPath = resolve(pkgDir, pkgJson.module)
        expect(existsSync(fullPath)).toBe(true)
      })

      test('types field points to existing file', () => {
        const fullPath = resolve(pkgDir, pkgJson.types)
        expect(existsSync(fullPath)).toBe(true)
      })
    })
  }
})
