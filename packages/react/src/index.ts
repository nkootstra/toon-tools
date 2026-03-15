import { createContext, useContext, createElement, type ReactNode } from 'react'
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query'
import { toonFetch, createToonFetch, type ToonFetchInit } from '@toon-tools/fetch'

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

export interface UseToonQueryOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryFn'> {
  url: string
  init?: ToonFetchInit
}

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
