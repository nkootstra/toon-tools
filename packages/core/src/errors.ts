import { Data } from 'effect'

export class ToonEncodeError extends Data.TaggedError('ToonEncodeError')<{
  readonly cause: unknown
}> {}

export class ToonDecodeError extends Data.TaggedError('ToonDecodeError')<{
  readonly cause: unknown
  readonly input: string
}> {}
