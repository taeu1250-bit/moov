import type { Command } from '../domain/matching.ts'
import type { Data } from '../domain/model.ts'

export type Snapshot = { data: Data; error?: undefined } | { error: string; data?: undefined }
export interface MatchRepository {
  snapshot(): Snapshot
  subscribe(listener: () => void): () => void
  execute(actor: string, command: Command): Promise<void>
}
export interface SessionGateway {
  select(id: string): Promise<void>
  create(alias: string, year: number, demoEmail: string): Promise<void>
  logout(): Promise<void>
}
export interface Services {
  matches: MatchRepository
  session: SessionGateway
  resetDemo(): Promise<void>
}
