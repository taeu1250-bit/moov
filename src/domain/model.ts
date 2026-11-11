export const sports = ['풋살', '축구', '농구', '러닝', '헬스'] as const
export const venues = ['대운동장', '풋살장', '스포츠센터', '농구장'] as const
export type Sport = (typeof sports)[number]
export type Kind = 'pickup' | 'friendly'
export const kindLabel: Record<Kind, string> = { pickup: '용병 모집', friendly: '친선경기' }
export type Status = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'unselected'
export const statusLabel: Record<Status, string> = {
  pending: '승인 대기',
  approved: '참가 확정',
  rejected: '거절',
  cancelled: '취소',
  unselected: '미선정',
}
export interface User {
  id: string
  name: string
  year: number
  role: 'student' | 'leader'
  team?: string
  teamSport?: Sport
  dept: string
}
export interface MatchFields {
  kind: Kind
  sport: Sport
  title: string
  venue: string
  start: string
  capacity: number
  existing: number
  fee: number
  level: string
  description: string
}
export interface Match extends MatchFields {
  id: string
  hostId: string
  createdAt: string
}
export interface Entry {
  id: string
  matchId: string
  userId: string
  team?: string
  note: string
  status: Status
  at: string
}
export interface Notice {
  id: string
  to: string
  matchId: string
  text: string
  at: string
  read: boolean
}
export interface Data {
  version: 1
  catalogRevision?: 2
  users: User[]
  currentId: string | null
  matches: Match[]
  entries: Entry[]
  notices: Notice[]
}
export function isTeamSport(sport: Sport) {
  return ['축구', '풋살', '농구'].includes(sport)
}
export function entriesFor(data: Data, match: Match) {
  return data.entries.filter((e) => e.matchId === match.id)
}
export function confirmed(data: Data, match: Match) {
  return entriesFor(data, match).filter((e) => e.status === 'approved')
}
export function seats(data: Data, match: Match) {
  return match.existing + (match.kind === 'pickup' ? confirmed(data, match).length : 0)
}
export function matchStatus(data: Data, match: Match, now = Date.now()) {
  if (Date.parse(match.start) <= now) return '경기 시작'
  if (match.kind === 'friendly' && confirmed(data, match).length) return '매칭 확정'
  if (match.kind === 'pickup' && seats(data, match) >= match.capacity) return '모집 마감'
  return '모집 중'
}
export function cardTitle(data: Data, match: Match, now = Date.now()) {
  if (match.kind !== 'friendly') return match.title
  const home = data.users.find((user) => user.id === match.hostId)?.team
  if (!home) return match.title
  const opponent = confirmed(data, match)[0]?.team
  if (opponent) return home + ' vs ' + opponent
  if (Date.parse(match.start) <= now) return home + ' 친선경기'
  return home + ' vs 상대팀 모집 중'
}
export function activeEntry(data: Data, match: Match, userId: string) {
  return entriesFor(data, match).find(
    (e) => e.userId === userId && ['approved', 'pending'].includes(e.status),
  )
}
export const dateKey = (date: number | string | Date) =>
  new Date(new Date(date).getTime() + 9 * 3600000).toISOString().slice(0, 10)
export function shiftDay(key: string, n: number) {
  return dateKey(Date.parse(key + 'T12:00:00+09:00') + n * 86400000)
}
export const today = () => dateKey(Date.now())
export function fmtDate(value: string, withYear = false) {
  const date = new Date(value.length === 10 ? value + 'T12:00:00+09:00' : value)
  return date.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    ...(withYear ? { year: 'numeric' } : {}),
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}
export const fmtTime = (value: string) =>
  new Date(value).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
export const money = (value: number) => (value ? value.toLocaleString('ko-KR') + '원' : '무료')
