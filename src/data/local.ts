import { applyCommand, requireRule, schoolEmail, uid } from '../domain/matching.ts'
import type { Data } from '../domain/model.ts'
import type { Services, Snapshot } from './contracts.ts'
import { demoData } from './seed.ts'
import { updateDemoCatalog } from './upgrade.ts'

const key = 'moov.campus.demo.v1'
function read(fallback: Data): Data {
  const raw = window.localStorage.getItem(key)
  if (raw === null) return fallback
  const value = JSON.parse(raw) as Data
  requireRule(
    value.version === 1 &&
      Array.isArray(value.users) &&
      value.users.length > 0 &&
      Array.isArray(value.matches) &&
      Array.isArray(value.entries) &&
      Array.isArray(value.notices),
    '저장된 시연 데이터의 형식을 확인할 수 없어요.',
  )
  return updateDemoCatalog(value, fallback)
}

export function makeLocalServices(): Services {
  const initial = demoData()
  const listeners = new Set<() => void>()
  let current: Snapshot
  const refresh = () => {
    try {
      current = { data: read(initial) }
    } catch {
      current = {
        error:
          '이 브라우저의 시연 데이터를 읽을 수 없어요. 저장 권한을 확인하거나 시연 데이터를 초기화해 주세요.',
      }
    }
    listeners.forEach((listener) => listener())
  }
  refresh()
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key === key) refresh()
  })
  const write = async (operation: (old: Data) => Data, reset = false) => {
    const commit = () => {
      const next = operation(reset ? initial : read(initial))
      // One write commits the request, capacity and notification changes together.
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        throw new Error('변경을 저장할 수 없어요. 브라우저의 저장 공간과 권한을 확인해 주세요.')
      }
      current = { data: next }
      listeners.forEach((listener) => listener())
    }
    if (navigator.locks) await navigator.locks.request(key, commit)
    else commit()
  }
  return {
    matches: {
      snapshot: () => current,
      subscribe: (listener) => {
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
        }
      },
      execute: (actor, command) => write((data) => applyCommand(data, actor, command)),
    },
    session: {
      select: (id) =>
        write((data) => {
          requireRule(
            data.users.some((u) => u.id === id),
            '시연 계정을 찾을 수 없어요.',
          )
          return { ...data, currentId: id }
        }),
      create: (alias, year, email) =>
        write((data) => {
          requireRule(schoolEmail(email), '학교 이메일 형식을 확인해 주세요.')
          requireRule(
            alias.trim().length >= 1 && alias.trim().length <= 12,
            '시연 닉네임은 1~12자로 입력해 주세요.',
          )
          requireRule(
            Number.isInteger(year) && year >= 2000 && year <= new Date().getFullYear(),
            '입학연도를 확인해 주세요.',
          )
          const user = {
            id: uid(),
            name: alias.trim(),
            year,
            role: 'student' as const,
            dept: '미래캠퍼스',
          }
          return { ...data, users: [...data.users, user], currentId: user.id }
        }),
      logout: () => write((data) => ({ ...data, currentId: null })),
    },
    resetDemo: () => write(() => demoData(), true),
  }
}
