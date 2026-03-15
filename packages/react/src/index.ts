import { createContext, useContext, createElement, type ReactNode } from 'react'
import { Effect } from 'effect'
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query'
import {
  toonFetch,
  toonFetchEffect,
  createToonFetch,
  createToonFetchEffect,
  type ToonFetchInit,
  type ToonFetchError,
} from '@toon-tools/fetch'
import type { ToonDecodeError } from '@toon-tools/fetch'

export type { ToonFetchError, ToonDecodeError } from '@toon-tools/fetch'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface ToonContextValue {
  baseUrl?: string
  headers?: HeadersInit
  fallback?: 'json' | 'throw'
}

const ToonContext = createContext<ToonContextValue>({})

export interface ToonProviderProps extends ToonContextValue {
  children: ReactNode
}

export function ToonProvider({ children, ...config }: ToonProviderProps) {
  return createElement(ToonContext.Provider, { value: config }, children)
}

export function useToonContext(): ToonContextValue {
  return useContext(ToonContext)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseToonQueryOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryFn'> {
  url: string
  init?: ToonFetchInit
}

export interface UseToonQueryEffectOptions<T> extends Omit<
  UseQueryOptions<T, ToonFetchError | ToonDecodeError>,
  'queryFn'
> {
  url: string
  init?: ToonFetchInit
}

// ---------------------------------------------------------------------------
// Promise-based hook (unchanged API)
// ---------------------------------------------------------------------------

export function useToonQuery<T = unknown>(
  options: UseToonQueryOptions<T>,
): UseQueryResult<T, Error> {
  const { url, init, ...queryOptions } = options
  const ctx = useToonContext()

  const fetcher =
    ctx.baseUrl || ctx.headers
      ? createToonFetch({
          baseUrl: ctx.baseUrl,
          headers: ctx.headers,
          fallback: ctx.fallback,
        })
      : toonFetch

  return useQuery<T, Error>({
    ...queryOptions,
    queryFn: () => fetcher<T>(url, init),
  })
}

// ---------------------------------------------------------------------------
// Effect-native hook (typed errors)
// ---------------------------------------------------------------------------

export function useToonQueryEffect<T = unknown>(
  options: UseToonQueryEffectOptions<T>,
): UseQueryResult<T, ToonFetchError | ToonDecodeError> {
  const { url, init, ...queryOptions } = options
  const ctx = useToonContext()

  const fetcher =
    ctx.baseUrl || ctx.headers
      ? createToonFetchEffect({
          baseUrl: ctx.baseUrl,
          headers: ctx.headers,
          fallback: ctx.fallback,
        })
      : toonFetchEffect

  return useQuery<T, ToonFetchError | ToonDecodeError>({
    ...queryOptions,
    queryFn: () => Effect.runPromise(fetcher<T>(url, init)),
  })
}
